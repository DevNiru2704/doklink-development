import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/beds/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to fetch beds:", error);
    return NextResponse.json({ error: "Failed to fetch beds" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/beds/", { method: "POST", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to create bed:", error);
    return NextResponse.json({ error: "Failed to create bed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/beds/", { method: "PUT", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to update bed:", error);
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 });
  }
}
