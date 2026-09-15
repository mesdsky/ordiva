import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    error: userError,
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
        "full_name, account_type, currency, financial_goal"
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

  return supabaseResponse;
}