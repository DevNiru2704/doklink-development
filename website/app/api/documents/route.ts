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
    const documents = await db.collection("documents").find({}).toArray();

    // Transform _id to id for frontend
    const transformedDocs = documents.map((doc: any) => ({
      ...doc,
      id: doc._id?.toString(),
      patientId: doc.patientId?.toString(),
    }));

    return NextResponse.json(transformedDocs);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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

    // Generate next document ID using atomic counter (d1, d2, d3...)
    const docId = await getNextId(db, "documents", "d");

    const documentData = {
      _id: docId,
      ...body,
      hospitalId: session.user.hospitalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("documents").insertOne(documentData);

    return NextResponse.json(
      { ...documentData, id: docId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
