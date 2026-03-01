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
    const patients = await db.collection("patients").find({}).toArray();

    // Transform _id to id for frontend
    const transformedPatients = patients.map((patient: any) => ({
      ...patient,
      id: patient._id?.toString(),
      assignedBed: patient.assignedBed?.toString(),
    }));

    return NextResponse.json(transformedPatients);
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
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

    // Generate next patient ID using atomic counter (p1, p2, p3...)
    const patientId = await getNextId(db, "patients", "p");

    const patientData = {
      _id: patientId,
      ...body,
      hospitalId: session.user.hospitalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("patients").insertOne(patientData);

    return NextResponse.json(
      { ...patientData, id: patientId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
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
    const patientId = id || _id;
    
    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required for update" },
        { status: 400 }
      );
    }

    const db = await getHospitalDb(session.user.hospitalCode);

    // Update the patient document
    const result = await db.collection("patients").updateOne(
      { _id: patientId },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Fetch and return the updated patient
    const updatedPatient = await db.collection("patients").findOne({ _id: patientId });
    
    return NextResponse.json({
      ...updatedPatient,
      id: updatedPatient?._id?.toString(),
      assignedBed: updatedPatient?.assignedBed?.toString(),
    });
  } catch (error) {
    console.error("Failed to update patient:", error);
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}
