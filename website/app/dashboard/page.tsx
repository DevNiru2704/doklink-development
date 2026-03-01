"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Bed as BedIcon,
  Users,
  UserCheck,
  FileText,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ================= TYPES ================= */

type BedStatus = "available" | "occupied" | "maintenance";
type PatientStatus = "Admitted" | "Discharged";
type ClaimStatus = "Pending" | "Approved" | "Rejected" | "Partial";

interface Bed {
  _id?: string;
  id: string;
  bedNumber: string;
  ward: string;
  status: BedStatus;
}

interface Patient {
  _id?: string;
  id: string;
  name: string;
  diagnosis: string;
  admissionDate: string | Date;
  status: PatientStatus;
  assignedBed?: string;
}

interface Claim {
  _id?: string;
  id: string;
  status: ClaimStatus;
}

interface Activity {
  _id?: string;
  id: string;
  type: "admission" | "discharge" | "claim";
  description: string;
  time: string | Date;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role === "SuperAdmin") {
      router.push("/superadmin");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      async function fetchData() {
        try {
          const [bedsRes, patientsRes, claimsRes, activitiesRes] =
            await Promise.all([
              fetch("/api/beds"),
              fetch("/api/patients"),
              fetch("/api/claims"),
              fetch("/api/activities"),
            ]);

          const bedsData = await bedsRes.json();
          const patientsData = await patientsRes.json();
          const claimsData = await claimsRes.json();
          const activitiesData = await activitiesRes.json();

          setBeds(bedsData.map((b: Bed) => ({ ...b, id: b._id || b.id })));
          setPatients(patientsData.map((p: Patient) => ({ ...p, id: p._id || p.id })));
          setClaims(claimsData.map((c: Claim) => ({ ...c, id: c._id || c.id })));
          setActivities(activitiesData.map((a: Activity) => ({ ...a, id: a._id || a.id })));
        } catch (err) {
          console.error("Dashboard fetch failed", err);
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="p-8 text-lg text-white">Loading dashboard...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === "occupied").length;
  const availableBeds = beds.filter(b => b.status === "available").length;
  const totalPatients = patients.length;
  const activeClaims = claims.filter(c => c.status !== "Approved").length;
  const currentPatients = patients.filter(p => p.status === "Admitted").slice(0, 5);

  return (
    <div className="min-h-screen p-8 bg-black">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-2">
          Hospital Dashboard
        </h1>
        <p className="text-gray-400 text-lg">
          Welcome back! Here's what's happening at your hospital today.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        <Card className="border-2 border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Beds</p>
                <p className="text-3xl font-bold text-white mt-1">{totalBeds}</p>
              </div>
              <BedIcon className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-500/30 bg-red-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Occupied Beds</p>
                <p className="text-3xl font-bold text-white mt-1">{occupiedBeds}</p>
              </div>
              <UserCheck className="h-10 w-10 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/30 bg-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Available Beds</p>
                <p className="text-3xl font-bold text-white mt-1">{availableBeds}</p>
              </div>
              <BedIcon className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-500/30 bg-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Patients</p>
                <p className="text-3xl font-bold text-white mt-1">{totalPatients}</p>
              </div>
              <Users className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Claims</p>
                <p className="text-3xl font-bold text-white mt-1">{activeClaims}</p>
              </div>
              <FileText className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* BEDS */}
        <Card className="lg:col-span-2 bg-black text-white border-2 border-white shadow-xl hover-lift">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
              <BedIcon className="h-6 w-6" />
              <span>Bed Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {["General", "ICU", "Pediatric", "Maternity", "Emergency"].map((ward) => {
              const wardBeds = beds.filter(b => b.ward === ward);
              return (
                <div key={ward}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-white text-lg">{ward}</span>
                    <span className="text-sm text-white bg-white/20 px-3 py-1 rounded-full">
                      {wardBeds.filter(b => b.status === "occupied").length}/{wardBeds.length}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {wardBeds.map(bed => (
                      <Link
                        key={bed.id}
                        href="/beds"
                        className={`w-12 h-12 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-110
                          ${bed.status === "available" ? "bg-white text-black hover:bg-gray-200" : ""}
                          ${bed.status === "occupied" ? "bg-gray-600 text-white hover:bg-gray-500" : ""}
                          ${bed.status === "maintenance" ? "bg-gray-400 text-black hover:bg-gray-300" : ""}`}
                      >
                        {bed.bedNumber.split("-")[1] || bed.bedNumber}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* ACTIVITY */}
        <Card className="bg-black border-2 border-white shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center space-x-3">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="p-3 bg-white/5 border border-white/20 rounded-lg">
                <p className="font-semibold text-white text-sm">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(activity.time), "PPp")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CURRENT PATIENTS */}
      <Card className="bg-black border-2 border-white shadow-xl hover-lift">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
            <Users className="h-6 w-6" />
            <span>Current Patients</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPatients.map((p) => (
            <Link
              key={p.id}
              href="/patients"
              className="block p-4 border-2 border-white/20 rounded-xl hover:border-white hover:bg-white/5 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">{p.name}</p>
                  <p className="text-sm text-gray-400 mt-1">{p.diagnosis}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Admitted: {format(new Date(p.admissionDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <Badge className="bg-white text-black font-semibold hover:bg-gray-200">
                  {p.assignedBed ?? "—"}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="bg-black border-2 border-white shadow-lg hover-lift group cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-sm font-bold text-white group-hover:text-gray-300 transition-colors">
          {title}
        </CardTitle>
        <div className="p-2 bg-white rounded-lg text-black group-hover:bg-gray-200 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white group-hover:scale-110 transition-transform origin-left">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}