"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [hospitalEmail, setHospitalEmail] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const handleNext = () => {
    if (!hospitalName || !hospitalAddress || !hospitalPhone || !hospitalEmail) {
      setError("Please fill in all hospital details");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (adminPassword !== adminPasswordConfirm) {
      setError("Passwords do not match");
      return;
    }

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      alert("Hospital registered successfully! You can now log in.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/5 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/3 animate-pulse delay-1000"></div>
      </div>
      
      <Card className="w-full max-w-2xl shadow-2xl animate-scale-in relative z-10 bg-white border-0">
        <CardHeader className="space-y-1 bg-black text-white rounded-t-lg px-8 py-8">
          <CardTitle className="text-3xl font-bold text-center">
            Register Hospital
          </CardTitle>
          <p className="text-center text-white/80">
            Step {step} of 2: {step === 1 ? "Hospital Details" : "Admin Account"}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Hospital Name *
                </label>
                <Input
                  placeholder="City General Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                  className="border-2 border-gray-200 focus:border-black"
                />
                <p className="text-xs text-gray-500">A unique hospital code will be auto-generated from this name</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Hospital Address *
                </label>
                <Input
                  placeholder="123 Medical Center Dr, City, State"
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  required
                  className="border-2 border-gray-200 focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Hospital Phone *
                  </label>
                  <Input
                    placeholder="+1-234-567-8900"
                    value={hospitalPhone}
                    onChange={(e) => setHospitalPhone(e.target.value)}
                    required
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Hospital Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="contact@hospital.com"
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value.toLowerCase())}
                    required
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Next: Create Admin Account
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black">
                  Admin Name *
                </label>
                <Input
                  placeholder="Dr. John Smith"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  className="border-2 border-gray-200 focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Admin Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@hospital.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value.toLowerCase())}
                    required
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Admin Phone
                  </label>
                  <Input
                    placeholder="+1-234-567-8900"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Password * (Min 6 characters)
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">
                    Confirm Password *
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminPasswordConfirm}
                    onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                    required
                    className="border-2 border-gray-200 focus:border-black"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-black hover:bg-gray-100"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-black hover:underline font-medium"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}