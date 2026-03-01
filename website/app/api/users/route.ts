import { NextResponse } from "next/server";
import { getDb, getNextId } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

// Get users (SuperAdmin sees all, HospitalAdmin sees their hospital's users)
export async function GET(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role");
    const hospitalId = request.headers.get("x-hospital-id");
    
    const db = await getDb();
    let query: any = { isActive: true };

    if (userRole === "HospitalAdmin") {
      // Hospital admins can only see users in their hospital
      if (!hospitalId) {
        return NextResponse.json(
          { error: "Hospital ID not found" },
          { status: 400 }
        );
      }
      query.hospitalId = hospitalId;
    } else if (userRole !== "SuperAdmin") {
      // Basic users cannot list users
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const users = await db
      .collection("users")
      .find(query)
      .project({ passwordHash: 0 }) // Don't send password hashes
      .toArray();

    // Get hospital names for users
    const usersWithHospitals = await Promise.all(
      users.map(async (user) => {
        let hospitalName = "N/A";
        if (user.hospitalId) {
          const hospital = await db.collection("hospitals").findOne({
            _id: user.hospitalId,
          });
          if (hospital) {
            hospitalName = hospital.name;
          }
        }
        return {
          ...user,
          id: user._id.toString(),
          hospitalId: user.hospitalId?.toString(),
          hospitalName,
        };
      })
    );

    return NextResponse.json(usersWithHospitals);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Update user role (SuperAdmin only) or deactivate users
export async function PATCH(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role");

    if (userRole !== "SuperAdmin") {
      return NextResponse.json(
        { error: "Unauthorized. Only SuperAdmin can change user roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newRole, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const updateFields: any = { updatedAt: new Date() };

    if (newRole) {
      if (newRole !== "HospitalAdmin" && newRole !== "BasicUser") {
        return NextResponse.json(
          { error: "Invalid role. Can only assign HospitalAdmin or BasicUser" },
          { status: 400 }
        );
      }
      updateFields.role = newRole;
    }

    if (typeof isActive === "boolean") {
      updateFields.isActive = isActive;
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user (deactivate)
export async function DELETE(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role");
    const adminHospitalId = request.headers.get("x-hospital-id");

    if (userRole !== "HospitalAdmin" && userRole !== "SuperAdmin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: userId,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hospital admins can only delete users in their hospital
    if (userRole === "HospitalAdmin") {
      if (user.hospitalId?.toString() !== adminHospitalId) {
        return NextResponse.json(
          { error: "Cannot delete users from other hospitals" },
          { status: 403 }
        );
      }
    }

    // Deactivate user instead of deleting
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
// Create a new user (HospitalAdmin can create users in their hospital)
export async function POST(request: Request) {
  try {
    const userRole = request.headers.get("x-user-role");
    const adminHospitalId = request.headers.get("x-hospital-id");

    // Only HospitalAdmin and SuperAdmin can create users
    if (userRole !== "HospitalAdmin" && userRole !== "SuperAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, department, role, hospitalId } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if email already exists
    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Determine hospitalId and role based on who is creating
    let targetHospitalId: ObjectId | undefined;
    let userRoleToAssign: string;

    if (userRole === "SuperAdmin") {
      // SuperAdmin can create users for any hospital or create hospital admins
      if (role === "SuperAdmin") {
        return NextResponse.json(
          { error: "Cannot create another SuperAdmin" },
          { status: 400 }
        );
      }
      
      if (role === "HospitalAdmin" || role === "BasicUser") {
        if (!hospitalId || hospitalId.trim() === "") {
          return NextResponse.json(
            { error: "Hospital ID required when creating hospital users" },
            { status: 400 }
          );
        }
        
        // Validate hospital ID format (h1, h2, etc.)
        if (!/^h\d+$/.test(hospitalId)) {
          return NextResponse.json(
            { error: "Invalid hospital ID format" },
            { status: 400 }
          );
        }
        
        targetHospitalId = hospitalId;
        userRoleToAssign = role;
      } else {
        return NextResponse.json(
          { error: "Invalid role specified" },
          { status: 400 }
        );
      }
    } else if (userRole === "HospitalAdmin") {
      // Hospital admins can only create BasicUsers in their own hospital
      if (!adminHospitalId) {
        return NextResponse.json(
          { error: "Hospital ID not found" },
          { status: 400 }
        );
      }
      targetHospitalId = adminHospitalId;
      userRoleToAssign = "BasicUser"; // Hospital admins can only create basic users
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verify hospital exists
    if (targetHospitalId) {
      const hospital = await db.collection("hospitals").findOne({
        _id: targetHospitalId,
        isActive: true,
      });

      if (!hospital) {
        return NextResponse.json(
          { error: "Hospital not found or inactive" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate next user ID using atomic counter (numeric)
    const userId = await getNextId(db, "users");

    // Create user
    const newUser = {
      _id: userId,
      hospitalId: targetHospitalId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: userRoleToAssign,
      isActive: true,
      phone: phone || "",
      department: department || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: userId,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
