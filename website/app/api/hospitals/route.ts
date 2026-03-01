import { NextResponse } from "next/server";
import { getDb, getHospitalDb } from "@/lib/mongodb";

// Get all hospitals with statistics (SuperAdmin and HospitalAdmin can view)
export async function GET(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role");

    if (userRole !== "SuperAdmin" && userRole !== "HospitalAdmin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const hospitals = await db
      .collection("hospitals")
      .find({ isActive: true })
      .project({ name: 1, code: 1, address: 1, phone: 1, email: 1 })
      .toArray();

    // If SuperAdmin, fetch statistics for each hospital
    if (userRole === "SuperAdmin") {
      const hospitalsWithStats = await Promise.all(
        hospitals.map(async (h) => {
          try {
            const hospitalDb = await getHospitalDb(h.code);
            
            const [bedsCount, patientsCount, claimsCount] = await Promise.all([
              hospitalDb.collection("beds").countDocuments(),
              hospitalDb.collection("patients").countDocuments(),
              hospitalDb.collection("claims").countDocuments(),
            ]);

            return {
              id: h._id.toString(),
              name: h.name,
              code: h.code,
              address: h.address,
              phone: h.phone,
              email: h.email,
              stats: {
                beds: bedsCount,
                patients: patientsCount,
                claims: claimsCount,
              },
            };
          } catch (error) {
            // If hospital database doesn't exist yet, return 0 for all stats
            return {
              id: h._id.toString(),
              name: h.name,
              code: h.code,
              address: h.address,
              phone: h.phone,
              email: h.email,
              stats: {
                beds: 0,
                patients: 0,
                claims: 0,
              },
            };
          }
        })
      );

      return NextResponse.json(hospitalsWithStats);
    }

    // For HospitalAdmin, return basic info without stats
    return NextResponse.json(
      hospitals.map((h) => ({
        id: h._id.toString(),
        name: h.name,
        code: h.code,
        address: h.address,
        phone: h.phone,
        email: h.email,
      }))
    );
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return NextResponse.json(
      { error: "Failed to fetch hospitals" },
      { status: 500 }
    );
  }
}
