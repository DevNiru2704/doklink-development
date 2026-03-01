import { NextRequest, NextResponse } from "next/server";
import { djangoFetch, extractContextHeaders } from "@/lib/django-api";

// Get users — Django handles role-based filtering via headers
export async function GET(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { data, status } = await djangoFetch("/users/", {}, ctx);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch(
      "/users/",
      { method: "POST", body },
      ctx
    );
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

// Update user role or active status
export async function PATCH(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const body = await request.json();
    const { data, status } = await djangoFetch(
      "/users/",
      { method: "PATCH", body },
      ctx
    );
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// Delete (deactivate) user
export async function DELETE(request: NextRequest) {
  try {
    const ctx = extractContextHeaders(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const { data, status } = await djangoFetch(
      `/users/?userId=${userId}`,
      { method: "DELETE" },
      ctx
    );
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
