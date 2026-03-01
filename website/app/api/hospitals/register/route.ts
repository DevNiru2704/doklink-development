import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch(
      "/hospitals/register/",
      { method: "POST", body },
      ctx
    );
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error registering hospital:", error);
    return NextResponse.json({ error: "Failed to register hospital" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/hospitals/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 });
  }
}
