const XENDIT_BASE_URL = "https://api.xendit.co";

export type XenditSessionResponse = {
  id?: string;
  payment_session_id?: string;
  payment_link_url?: string;
  status?: string;
  subscription_id?: string;
  [key: string]: unknown;
};

export async function xenditRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const secretKey = process.env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("XENDIT_SECRET_KEY is not configured");
  }

  const response = await fetch(`${XENDIT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : `Xendit request failed with ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  return value.replace(/\/$/, "");
}

export function assertXenditWebhook(request: Request) {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expected) throw new Error("XENDIT_WEBHOOK_TOKEN is not configured");
  return request.headers.get("x-callback-token") === expected;
}
