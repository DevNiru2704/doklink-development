import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/patients/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/patients/", { method: "POST", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to create patient:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch("/patients/", { method: "PUT", body }, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Failed to update patient:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
