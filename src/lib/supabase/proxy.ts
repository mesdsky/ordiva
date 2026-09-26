import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function updateSession(request: NextRequest) {

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(name, value);

              supabaseResponse.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;


  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isPublicRoute) {
    return supabaseResponse;
  }

  const protectedRoutes = [
    "/dashboard",
    "/transactions",
    "/budget",
    "/goals",
    "/subscriptions",
    "/debts",
    "/reports",
    "/profile",
    "/settings",
    "/billing",
    "/onboarding",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  if (!user) {

    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "full_name, account_type, currency, financial_goal, plan"
      )
      .eq("id", user.id)
      .maybeSingle();



  if (profileError || !profile) {

    if (pathname !== "/onboarding") {
      const url = request.nextUrl.clone();

      url.pathname = "/onboarding";
      url.search = "";

      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const onboardingComplete =
    typeof profile.full_name === "string" &&
    profile.full_name.trim().length > 0 &&
    typeof profile.account_type === "string" &&
    profile.account_type.length > 0 &&
    typeof profile.currency === "string" &&
    profile.currency.length > 0 &&
    typeof profile.financial_goal === "string" &&
    profile.financial_goal.length > 0;


  if (!onboardingComplete) {

    if (pathname !== "/onboarding") {
      const url = request.nextUrl.clone();

      url.pathname = "/onboarding";
      url.search = "";

      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  if (pathname === "/onboarding") {

    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";
    url.search = "";

    return NextResponse.redirect(url);
  }

  if (profile.plan === "premium") {
    await expireLapsedPremium(supabase, user.id);
  }

  return supabaseResponse;
}

// Nothing else turns premium off when a paid period ends, so check on
// navigation. Accounts with no entitlements at all were granted premium
// by hand and are left alone.
async function expireLapsedPremium(
  supabase: SupabaseClient,
  userId: string
) {
  try {
    const { data: entitlements, error } = await supabase
      .from("billing_entitlements")
      .select("id, status, ends_at")
      .eq("user_id", userId);

    if (error || !entitlements || entitlements.length === 0) return;

    const now = Date.now();
    const current = entitlements.some(
      (e) =>
        e.status === "active" &&
        (e.ends_at === null || new Date(e.ends_at).getTime() > now)
    );

    if (current) return;

    const admin = createAdminClient();
    const nowIso = new Date(now).toISOString();

    await admin
      .from("billing_entitlements")
      .update({ status: "expired" })
      .eq("user_id", userId)
      .eq("status", "active")
      .lte("ends_at", nowIso);

    await admin
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", userId)
      .eq("plan", "premium");
  } catch (error) {
    // Never block navigation over this; the next request retries.
    console.error("Premium expiry check failed", error);
  }
}