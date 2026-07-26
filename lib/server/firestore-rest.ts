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

type FirestoreValue =
  | { nullValue: null }
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function serviceAccount() {
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!value || value.includes("REPLACE_WITH")) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const normalizedValue = value.replace(/^\\+/, "");
  const jsonValue = normalizedValue.startsWith("{")
    ? normalizedValue
    : Buffer.from(normalizedValue, "base64").toString("utf8");
  const sanitizedJsonValue = jsonValue.replace(/\\(?!["\\/bfnrtu])/g, "");
  const account = JSON.parse(sanitizedJsonValue) as ServiceAccount;
  account.private_key = account.private_key.replace(/\\n/g, "\n");
  return account;
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

function documentsUrl() {
  const { project_id: projectId } = serviceAccount();
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

function documentUrl(bookId: string) {
  return `${documentsUrl()}/story_orders/${encodeURIComponent(bookId)}`;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, item]) => [key, encodeValue(item)]),
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function decodeValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [
        key,
        decodeValue(item),
      ]),
    );
  }
  return null;
}

function decodeDocument(document: FirestoreDocument) {
  const id = document.name.split("/").pop() ?? "";
  const fields = Object.fromEntries(
    Object.entries(document.fields ?? {}).map(([key, value]) => [
      key,
      decodeValue(value),
    ]),
  );
  return { id, ...fields };
}

export async function verifyFirebaseAuthorization(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Firebase access token");
  }
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey.includes("REPLACE_WITH")) {
    throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not configured");
  }
  const idToken = authorization.replace(/^Bearer\s+/i, "");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  const payload = await response.json() as {
    users?: Array<{ localId?: string; email?: string }>;
  };
  const user = payload.users?.[0];
  if (!response.ok || !user?.localId) {
    throw new Error("Invalid Firebase access token");
  }
  return { id: user.localId, email: user.email };
}

export async function getStoryOrderDocument(bookId: string) {
  const response = await fetch(documentUrl(bookId), {
    headers: { Authorization: `Bearer ${await accessToken()}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Firestore lookup failed with ${response.status}`);
  }
  return decodeDocument(await response.json() as FirestoreDocument);
}

export async function findStoryOrderByCheckoutId(checkoutId: string) {
  const response = await fetch(`${documentsUrl()}:runQuery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "story_orders" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "stripe_checkout_session_id" },
            op: "EQUAL",
            value: { stringValue: checkoutId },
          },
        },
        limit: 1,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Firestore query failed with ${response.status}`);
  }
  const rows = await response.json() as Array<{ document?: FirestoreDocument }>;
  return rows[0]?.document ? decodeDocument(rows[0].document) : null;
}

export async function patchStoryOrderDocument(
  bookId: string,
  payload: Record<string, unknown>,
) {
  const update = { ...payload, updated_at: new Date().toISOString() };
  const query = Object.keys(update)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join("&");

  const response = await fetch(`${documentUrl(bookId)}?${query}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: Object.fromEntries(
        Object.entries(update).map(([key, value]) => [key, encodeValue(value)]),
      ),
    }),
  });
  if (!response.ok) {
    throw new Error(`Firestore update failed with ${response.status}`);
  }
  return decodeDocument(await response.json() as FirestoreDocument);
}
