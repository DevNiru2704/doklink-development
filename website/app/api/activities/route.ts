import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/activities/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/activities/", { method: "POST", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
