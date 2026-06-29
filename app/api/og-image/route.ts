import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ image: null });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; hotel-tracker-bot/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();
    const match =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    const image = match ? match[1] : null;
    return NextResponse.json({ image });
  } catch {
    return NextResponse.json({ image: null });
  }
}