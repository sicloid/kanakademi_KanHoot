import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const wsUrl = process.env.NODE_ENV === "production" ? "https://vpn.sicloid.xyz:8443" : "http://localhost:8080";
    
    // We get the admin key from headers
    const adminKey = request.headers.get("X-Admin-Key") || "";

    const res = await fetch(`${wsUrl}/api/stats`, {
      headers: { "X-Admin-Key": adminKey }
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats from game server" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
