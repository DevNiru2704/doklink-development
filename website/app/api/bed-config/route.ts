import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getHospitalDb } from "@/lib/mongodb";
import { authOptions } from "../auth/[...nextauth]/route";

// GET - Fetch custom dropdown options for a hospital
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getHospitalDb(session.user.hospitalCode);

    // Get or create bed config for this hospital
    let bedConfig = await db.collection("bed_config").findOne({});

    if (!bedConfig) {
      // Create default config
      bedConfig = {
        bedCategories: [],
        departments: ["NA"],
        floors: [],
        wings: ["NA"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("bed_config").insertOne(bedConfig);
    }

    return NextResponse.json({
      bedCategories: bedConfig.bedCategories || [],
      departments: bedConfig.departments || ["NA"],
      floors: bedConfig.floors || [],
      wings: bedConfig.wings || ["NA"],
    });
  } catch (error) {
    console.error("Error fetching bed config:", error);
    return NextResponse.json({ error: "Failed to fetch bed config" }, { status: 500 });
  }
}

// POST - Update custom dropdown options for a hospital
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getHospitalDb(session.user.hospitalCode);
    
    const { field, value } = await request.json();

    if (!field || !value) {
      return NextResponse.json({ error: "Field and value are required" }, { status: 400 });
    }

    // Valid fields
    const validFields = ["bedCategories", "departments", "floors", "wings"];
    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // Update or create bed config
    await db.collection("bed_config").updateOne(
      {},
      {
        $addToSet: { [field]: value },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Get updated config
    const bedConfig = await db.collection("bed_config").findOne({});

    return NextResponse.json({
      success: true,
      bedCategories: bedConfig?.bedCategories || [],
      departments: bedConfig?.departments || ["NA"],
      floors: bedConfig?.floors || [],
      wings: bedConfig?.wings || ["NA"],
    });
  } catch (error) {
    console.error("Error updating bed config:", error);
    return NextResponse.json({ error: "Failed to update bed config" }, { status: 500 });
  }
}
