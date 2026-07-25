import { createSign } from "node:crypto";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function serviceAccount() {
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const normalizedValue = value.startsWith("\\{") ? value.slice(1) : value;
  return JSON.parse(normalizedValue) as ServiceAccount;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const account = serviceAccount();
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(account.private_key))}`;

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(`Firebase token request failed with ${response.status}`);
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };
  return cachedToken.value;
}

function documentUrl(bookId: string) {
  const { project_id: projectId } = serviceAccount();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/story_orders/${encodeURIComponent(bookId)}`;
}

export async function storyOrderExists(bookId: string) {
  const response = await fetch(documentUrl(bookId), {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`Firestore lookup failed with ${response.status}`);
  }
  return true;
}

export async function updateStoryOrderProgress(
  bookId: string,
  status: string,
  bookTitle?: string,
) {
  const updateFields = ["story_status", "updated_at"];
  if (bookTitle) updateFields.push("book_title");
  const query = updateFields
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const response = await fetch(`${documentUrl(bookId)}?${query}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        story_status: { stringValue: status },
        updated_at: { stringValue: new Date().toISOString() },
        ...(bookTitle ? { book_title: { stringValue: bookTitle } } : {}),
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Firestore update failed with ${response.status}`);
  }
}
