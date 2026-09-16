import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BillingDatabase } from "@/lib/billing-database";

let adminClient: SupabaseClient<BillingDatabase> | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured");
  }

  adminClient = createSupabaseClient<BillingDatabase>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}
