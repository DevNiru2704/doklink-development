import { NextRequest, NextResponse } from "next/server";
import { getHospitalDb, getNextId } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getHospitalDb(session.user.hospitalCode);
    const claims = await db.collection("claims").find({}).toArray();

    // Transform _id to id for frontend
    const transformedClaims = claims.map((claim: any) => ({
      ...claim,
      id: claim._id?.toString(),
      patientId: claim.patientId?.toString(),
    }));

    return NextResponse.json(transformedClaims);
  } catch (error) {
    console.error("Failed to fetch claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const db = await getHospitalDb(session.user.hospitalCode);

    // Generate next claim ID using atomic counter (c1, c2, c3...)
    const claimId = await getNextId(db, "claims", "c");

    const claimData = {
      _id: claimId,
      ...body,
      hospitalId: session.user.hospitalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("claims").insertOne(claimData);

    return NextResponse.json(
      { ...claimData, id: claimId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, _id, ...updateData } = body;
    
    // Use either id or _id from the body
    const claimId = id || _id;
    
    if (!claimId) {
      return NextResponse.json(
        { error: "Claim ID is required for update" },
        { status: 400 }
      );
    }

    const db = await getHospitalDb(session.user.hospitalCode);

    // Update the claim document
    const result = await db.collection("claims").updateOne(
      { _id: claimId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // Fetch and return the updated claim
    const updatedClaim = await db.collection("claims").findOne({ _id: claimId });
    
    return NextResponse.json({
      ...updatedClaim,
      id: updatedClaim?._id?.toString(),
      patientId: updatedClaim?.patientId?.toString(),
    });
  } catch (error) {
    console.error("Failed to update claim:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}
