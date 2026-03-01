"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  department?: string;
  hospitalName?: string;
  isActive: boolean;
}

interface Hospital {
  id: string;
  name: string;
  code: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"HospitalAdmin" | "BasicUser">("BasicUser");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      session?.user?.role !== "HospitalAdmin" &&
      session?.user?.role !== "SuperAdmin"
    ) {
      router.push("/");
    } else {
      loadUsers();
      if (session?.user?.role === "SuperAdmin") {
        loadHospitals();
      }
    }
  }, [status, session, router]);

  const loadHospitals = async () => {
    try {
      const response = await fetch("/api/hospitals");
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error("Failed to load hospitals:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // SuperAdmin must select a hospital
    if (session?.user?.role === "SuperAdmin" && !selectedHospitalId) {
      setError("Please select a hospital");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          department,
          hospitalId: selectedHospitalId || undefined,
          role: session?.user?.role === "SuperAdmin" ? selectedRole : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess("User created successfully!");
      setShowCreateUser(false);

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setDepartment("");
      setSelectedHospitalId("");
      setSelectedRole("BasicUser");

      // Reload users
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("User deactivated successfully");
        loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to deactivate user");
      }
    } catch (error) {
      setError("Failed to deactivate user");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (
    session?.user?.role !== "HospitalAdmin" &&
    session?.user?.role !== "SuperAdmin"
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">
          User Management
        </h1>
        <p className="text-gray-600 mt-2">
          {session.user.role === "HospitalAdmin"
            ? "Manage staff accounts for your hospital"
            : "Manage all users across hospitals"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="mb-6">
        <Button
          onClick={() => setShowCreateUser(!showCreateUser)}
          className="bg-white hover:bg-gray-200 text-black"
        >
          {showCreateUser ? "Cancel" : "+ Add New User"}
        </Button>
      </div>

      {showCreateUser && (
        <Card className="mb-6 bg-black border-2 border-white shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-white">Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Full Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-black text-white border-2 border-gray-700 focus:border-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email *</label>
                  <Input
                    type="email"
                    placeholder="john@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="bg-black text-white border-2 border-gray-700 focus:border-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Password * (Min 6 chars)
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black text-white border-2 border-gray-700 focus:border-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Phone</label>
                  <Input
                    placeholder="+1-234-567-8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-black text-white border-2 border-gray-700 focus:border-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Department</label>
                  <Input
                    placeholder="Emergency, ICU, etc."
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="bg-black text-white border-2 border-gray-700 focus:border-white"
                  />
                </div>

                {/* Hospital selection for SuperAdmin */}
                {session?.user?.role === "SuperAdmin" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Hospital *</label>
                      <select
                        value={selectedHospitalId}
                        onChange={(e) => setSelectedHospitalId(e.target.value)}
                        className="w-full p-2 border-2 border-gray-700 rounded focus:border-white bg-black text-white"
                        required
                      >
                        <option value="">Select Hospital</option>
                        {hospitals.map((hospital) => (
                          <option key={hospital.id} value={hospital.id}>
                            {hospital.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Role *</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as "HospitalAdmin" | "BasicUser")}
                        className="w-full p-2 border-2 border-gray-700 rounded focus:border-white bg-black text-white"
                      >
                        <option value="BasicUser">Basic User</option>
                        <option value="HospitalAdmin">Hospital Admin</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {session?.user?.role === "HospitalAdmin" && (
                <div className="text-sm text-gray-400 bg-gray-900 p-3 rounded border border-gray-700">
                  <strong>Note:</strong> As a Hospital Admin, you can only create{" "}
                  <strong>Basic Users</strong> for your hospital.
                </div>
              )}

              {session?.user?.role === "SuperAdmin" && (
                <div className="text-sm text-gray-400 bg-gray-900 p-3 rounded border border-gray-700">
                  <strong>Note:</strong> As a SuperAdmin, you can create users for any hospital with either{" "}
                  <strong>Hospital Admin</strong> or <strong>Basic User</strong> roles.
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-900 text-white"
              >
                {loading ? "Creating..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-black border-2 border-white shadow-lg">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-white">All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No users found. Create your first user above.
              </p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="border-2 border-white rounded-lg p-4 hover:bg-gray-900 bg-black transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-white">{user.name}</h3>
                        <Badge className="bg-white text-black">
                          {user.role}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-1  ">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-gray-400 mb-1  ">
                          Phone: {user.phone}
                        </p>
                      )}
                      {user.department && (
                        <p className="text-sm text-gray-400 mb-1  ">
                          Department: {user.department}
                        </p>
                      )}
                      {user.hospitalName && (
                        <p className="text-sm text-gray-400 mb-1  ">
                          Hospital: {user.hospitalName}
                        </p>
                      )}
                    </div>
                    {user.isActive &&
                      user.role !== "SuperAdmin" &&
                      user.id !== session?.user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
