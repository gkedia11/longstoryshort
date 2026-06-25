import { createClient } from "@supabase/supabase-js";

type SupabaseUser = {
  id: string;
  email?: string;
};

export type StoryOrder = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  genre: string;
  summary: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_status: string | null;
  story_status: "draft" | "pending_payment" | "paid" | "sent_to_n8n" | "failed";
  n8n_response: unknown | null;
  created_at: string;
  updated_at: string;
};

function required(name: string) {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getPublicSupabaseConfig() {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getServerSupabaseConfig() {
  return {
    ...getPublicSupabaseConfig(),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

function getServiceClient() {
  const { url, serviceRoleKey } = getServerSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getUserFromAuthorization(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Supabase access token");
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const token = authorization.replace(/^Bearer\s+/i, "");
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Supabase session could not be verified");
  }

  return {
    id: data.user.id,
    email: data.user.email,
  } satisfies SupabaseUser;
}

export async function getStoryOrderForUser(
  orderId: string,
  userId: string,
) {
  const { data, error } = await getServiceClient()
    .from("story_orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase order lookup failed: ${error.message}`);
  }

  return data as StoryOrder | null;
}

export async function getStoryOrder(orderId: string) {
  const { data, error } = await getServiceClient()
    .from("story_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase order lookup failed: ${error.message}`);
  }

  return data as StoryOrder | null;
}

export async function getStoryOrderByCheckoutId(checkoutId: string) {
  const { data, error } = await getServiceClient()
    .from("story_orders")
    .select("*")
    .eq("stripe_checkout_session_id", checkoutId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase checkout lookup failed: ${error.message}`);
  }

  return data as StoryOrder | null;
}

export async function updateStoryOrder(
  orderId: string,
  payload: Partial<StoryOrder>,
) {
  const { data, error } = await getServiceClient()
    .from("story_orders")
    .update(payload)
    .eq("id", orderId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase order update failed: ${error.message}`);
  }

  return data as StoryOrder | null;
}
