import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getClient(supabaseClient) {
  const supabase = supabaseClient || createBrowserSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function listRecords(table, options = {}, supabaseClient) {
  const supabase = getClient(supabaseClient);
  const {
    select = "*",
    orderBy = "created_at",
    ascending = false,
    limit,
    filters = [],
  } = options;

  let query = supabase.from(table).select(select);

  filters.forEach(({ column, operator = "eq", value }) => {
    query = query[operator](column, value);
  });

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getRecordById(table, id, select = "*", supabaseClient) {
  const supabase = getClient(supabaseClient);
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createRecord(table, payload, supabaseClient) {
  const supabase = getClient(supabaseClient);
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecord(table, id, payload, supabaseClient) {
  const supabase = getClient(supabaseClient);
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecord(table, id, supabaseClient) {
  const supabase = getClient(supabaseClient);
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) throw error;
  return true;
}
