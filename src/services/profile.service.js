import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const profileColumns =
  "id,user_id,full_name,first_name,last_name,mobile_number,avatar_url,metadata,created_at,updated_at";
export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

const AVATAR_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function cleanOptional(value) {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

export function getProfileDisplayName(profile, fallbackEmail) {
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || profile?.full_name || fallbackEmail || "Portal user";
}

export function getProfileInitials(profile, fallbackEmail) {
  const fromName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (fromName) return fromName;

  return (
    fallbackEmail
      ?.split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function validateAvatarFile(file) {
  if (!file) {
    return "Choose an image to upload.";
  }

  if (!AVATAR_MIME_TYPES.includes(file.type)) {
    return "Upload a PNG, JPG, JPEG, or WEBP image.";
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Profile pictures must be 3 MB or smaller.";
  }

  return null;
}

function avatarPath(userId, file) {
  const extension = AVATAR_EXTENSIONS[file.type] || "jpg";
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}`;

  return `${userId}/${id}.${extension}`;
}

export async function updateCurrentUserProfile(values) {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to update your profile.");

  const firstName = values.first_name.trim();
  const lastName = values.last_name.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        mobile_number: cleanOptional(values.mobile_number),
        ...(values.avatar_url ? { avatar_url: values.avatar_url } : {}),
      },
      { onConflict: "user_id" },
    )
    .select(profileColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function uploadCurrentUserAvatar(file) {
  const validationError = validateAvatarFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to upload a profile picture.");

  const path = avatarPath(user.id, file);
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        avatar_url: publicUrl,
      },
      { onConflict: "user_id" },
    )
    .select(profileColumns)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCurrentUserProfilePreferences(preferences) {
  const supabase = createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase environment variables are missing.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be signed in to update preferences.");

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("metadata")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  const metadata = {
    ...(existingProfile?.metadata || {}),
    notification_preferences: preferences,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        metadata,
      },
      { onConflict: "user_id" },
    )
    .select(profileColumns)
    .single();

  if (error) throw error;
  return data;
}

export { profileColumns };
