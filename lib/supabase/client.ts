"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getJwtRole(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}

export function getSupabaseBrowserConfigError() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL.";
  }

  if (!anonKey || anonKey.includes("REPLACE_WITH")) {
    return "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the Supabase anon or publishable key, not the service_role key.";
  }

  if (getJwtRole(anonKey) === "service_role") {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is a service_role key. Replace it with the browser-safe anon or publishable key and rotate the exposed service_role key.";
  }

  return null;
}

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (getSupabaseBrowserConfigError() || !url || !anonKey) {
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
