"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Hospital {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  code: string;
  stats?: {
    beds: number;
    patients: number;
    claims: number;
  };
}

export default function SuperAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showCreateHospital, setShowCreateHospital] = useState(false);

  // Hospital form
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [hospitalEmail, setHospitalEmail] = useState("");

  // Admin form
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminRole, setAdminRole] = useState<"HospitalAdmin" | "BasicUser">("HospitalAdmin");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.role !== "SuperAdmin") {
      router.push("/");
    } else {
      loadHospitals();
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

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/hospitals/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName,
          hospitalAddress,
          hospitalPhone,
          hospitalEmail,
          adminName,
          adminEmail,
          adminPassword,
          adminPhone,
          adminRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create hospital");
      }

      setSuccess("Hospital created successfully!");
      setShowCreateHospital(false);
      
      // Reset form
      setHospitalName("");
      setHospitalAddress("");
      setHospitalPhone("");
      setHospitalEmail("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminPhone("");
      setAdminRole("HospitalAdmin");

      // Reload hospitals
      loadHospitals();
    } catch (err: any) {
      setError(err.message || "Failed to create hospital");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (session?.user?.role !== "SuperAdmin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage hospitals and their administrators
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
            onClick={() => setShowCreateHospital(!showCreateHospital)}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {showCreateHospital ? "Cancel" : "+ Create New Hospital"}
          </Button>
        </div>

        {showCreateHospital && (
          <Card className="mb-6 bg-white border-2 border-black shadow-lg">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-white">Create New Hospital</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateHospital} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Hospital Name *</label>
                    <Input
                      placeholder="City General Hospital"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Hospital Email *</label>
                    <Input
                      type="email"
                      placeholder="contact@hospital.com"
                      value={hospitalEmail}
                      onChange={(e) => setHospitalEmail(e.target.value.toLowerCase())}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Hospital Phone *</label>
                    <Input
                      placeholder="+1-234-567-8900"
                      value={hospitalPhone}
                      onChange={(e) => setHospitalPhone(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Address *</label>
                    <Input
                      placeholder="123 Medical Center Dr"
                      value={hospitalAddress}
                      onChange={(e) => setHospitalAddress(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>
                </div>

                <hr className="my-4" />
                <h3 className="text-lg font-semibold">Hospital Administrator</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Admin Name *</label>
                    <Input
                      placeholder="Dr. John Smith"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Admin Email *</label>
                    <Input
                      type="email"
                      placeholder="admin@hospital.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value.toLowerCase())}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Admin Phone</label>
                    <Input
                      placeholder="+1-234-567-8900"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Admin Role *</label>
                    <select
                      className="flex h-10 w-full rounded-md border-2 border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      value={adminRole}
                      onChange={(e) =>
                        setAdminRole(e.target.value as "HospitalAdmin" | "BasicUser")
                      }
                    >
                      <option value="HospitalAdmin">Hospital Administrator</option>
                      <option value="BasicUser">Basic User</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">Password * (Min 6 chars)</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="border-2 border-gray-200 focus:border-black"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  {loading ? "Creating..." : "Create Hospital & Admin"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-2 border-black shadow-lg">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-white">All Hospitals ({hospitals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hospitals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hospitals yet. Create your first hospital above.
                </p>
              ) : (
                hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="border-2 border-black rounded-lg p-4 hover:bg-gray-50 bg-white transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-black">{hospital.name}</h3>
                        <p className="text-sm text-gray-600">
                          Code: {hospital.code}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email: {hospital.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phone: {hospital.phone}
                        </p>
                        <p className="text-sm text-gray-600">
                          Address: {hospital.address}
                        </p>
                        
                        {hospital.stats && (
                          <div className="mt-3 flex gap-4">
                            <div className="bg-gray-100 border border-black px-3 py-1 rounded">
                              <span className="text-xs font-medium text-black">
                                🛏️ {hospital.stats.beds} Beds
                              </span>
                            </div>
                            <div className="bg-gray-100 border border-black px-3 py-1 rounded">
                              <span className="text-xs font-medium text-black">
                                👥 {hospital.stats.patients} Patients
                              </span>
                            </div>
                            <div className="bg-gray-100 border border-black px-3 py-1 rounded">
                              <span className="text-xs font-medium text-black">
                                📋 {hospital.stats.claims} Claims
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/superadmin/hospitals/${hospital.id}`)}
                      >
                        Manage Users
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
