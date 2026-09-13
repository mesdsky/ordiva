import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CURRENCIES = [
  "USD",
  "SGD",
  "MYR",
  "EUR",
  "GBP",
  "JPY",
];

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams
    .get("target")
    ?.toUpperCase();

  if (!target || !ALLOWED_CURRENCIES.includes(target)) {
    return NextResponse.json(
      {
        error: "Unsupported currency",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/IDR/${target}`,
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch exchange rate",
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    if (!Number.isFinite(Number(data.rate))) {
      return NextResponse.json(
        {
          error: "Invalid exchange rate",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      base: "IDR",
      target,
      rate: Number(data.rate),
      date: data.date,
    });
  } catch (error) {
    console.error("Currency API error:", error);

    return NextResponse.json(
      {
        error: "Currency service unavailable",
      },
      {
        status: 503,
      }
    );
  }
}