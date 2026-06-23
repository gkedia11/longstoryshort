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

export async function getUserFromAuthorization(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Supabase access token");
  }

  const { url, anonKey } = getPublicSupabaseConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    throw new Error("Supabase session could not be verified");
  }

  return (await response.json()) as SupabaseUser;
}

async function supabaseRest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {},
) {
  const { url, serviceRoleKey } = getServerSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
  headers.set("Content-Type", "application/json");
  if (init.prefer) {
    headers.set("Prefer", init.prefer);
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${detail}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function getStoryOrder(orderId: string) {
  const rows = await supabaseRest<StoryOrder[]>(
    `story_orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
  );
  return rows[0] ?? null;
}

export async function updateStoryOrder(
  orderId: string,
  payload: Partial<StoryOrder>,
) {
  const rows = await supabaseRest<StoryOrder[]>(
    `story_orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      prefer: "return=representation",
    },
  );
  return rows[0] ?? null;
}
