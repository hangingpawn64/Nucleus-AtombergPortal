"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getProfileDisplayName, getProfileInitials } from "@/services/profile";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-8",
  md: "size-9",
  lg: "size-12",
  xl: "size-20",
  "2xl": "size-28",
};

function getProfile(person, profile) {
  return profile || person?.profile || person || null;
}

export function UserAvatar({
  person,
  profile,
  email,
  name,
  size = "md",
  className,
  fallbackClassName,
}) {
  const resolvedProfile = getProfile(person, profile);
  const resolvedEmail = email || person?.email || "";
  const displayName =
    name || getProfileDisplayName(resolvedProfile, resolvedEmail);
  const initials = getProfileInitials(resolvedProfile, resolvedEmail);
  const avatarUrl = resolvedProfile?.avatar_url;
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = avatarUrl && !hasImageError;

  return (
    <Avatar className={cn(sizeClasses[size] || sizeClasses.md, className)}>
      {shouldShowImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className="size-full object-cover"
          onError={() => setHasImageError(true)}
        />
      )}
      {!shouldShowImage && (
        <AvatarFallback className={fallbackClassName}>{initials}</AvatarFallback>
      )}
    </Avatar>
  );
}
