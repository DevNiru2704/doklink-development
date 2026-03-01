import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/claims/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/claims/", { method: "POST", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to create claim:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/claims/", { method: "PUT", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to update claim:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}
