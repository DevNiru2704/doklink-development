"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Bed, BedStatus, BedCategory, Floor, Wing } from "@/lib/types";
import { Plus, Filter, Bed as BedIcon } from "lucide-react";

export default function BedManagementPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [patients, setPatients] = useState([]);
  const [selectedBedCategory, setSelectedBedCategory] = useState<BedCategory | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<BedStatus | "All">("All");
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPatientForBed, setSelectedPatientForBed] = useState("");
  const [customBedCategories, setCustomBedCategories] = useState<string[]>([]);
  const [customDepartments, setCustomDepartments] = useState<string[]>(["NA"]);
  const [customFloors, setCustomFloors] = useState<string[]>([]);
  const [customWings, setCustomWings] = useState<string[]>(["NA"]);
  const [showBedCategoryInput, setShowBedCategoryInput] = useState(false);
  const [showDepartmentInput, setShowDepartmentInput] = useState(false);
  const [showFloorInput, setShowFloorInput] = useState(false);
  const [showWingInput, setShowWingInput] = useState(false);
  const [newBedCategoryValue, setNewBedCategoryValue] = useState("");
  const [newDepartmentValue, setNewDepartmentValue] = useState("");
  const [newFloorValue, setNewFloorValue] = useState("");
  const [newWingValue, setNewWingValue] = useState("");
  const [newBed, setNewBed] = useState({ 
    bedNumber: "", 
    bedCategory: "" as BedCategory,
    department: "",
    floor: "" as Floor,
    wing: "" as Wing,
    dailyRate: 0,
    equipment: {
      hasMonitor: false,
      hasOxygen: false,
      hasVentilator: false
    }
  });
  const [loading, setLoading] = useState(true);

  // Load custom options from MongoDB on mount
  useEffect(() => {
    async function loadBedConfig() {
      try {
        const response = await fetch("/api/bed-config");
        if (response.ok) {
          const config = await response.json();
          setCustomBedCategories(config.bedCategories || []);
          setCustomDepartments(config.departments || ["NA"]);
          setCustomFloors(config.floors || []);
          setCustomWings(config.wings || ["NA"]);
        }
      } catch (error) {
        console.error("Failed to load bed config:", error);
      }
    }
    loadBedConfig();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bedsRes, patientsRes] = await Promise.all([
          fetch("/api/beds", { cache: 'no-store' }),
          fetch("/api/patients", { cache: 'no-store' }),
        ]);
        
        const bedsData = await bedsRes.json();
        const patientsData = await patientsRes.json();
        
        setBeds(Array.isArray(bedsData) ? bedsData : []);
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setBeds([]);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddBed = async () => {
    try {
      if (!newBed.bedNumber || !newBed.bedCategory || !newBed.floor || !newBed.wing || !newBed.dailyRate) {
        alert("Please fill in all required fields (Bed Number, Bed Category, Floor, Wing, Daily Rate)");
        return;
      }

      if (beds.some(b => b.bedNumber === newBed.bedNumber)) {
        alert("Bed number already exists!");
        return;
      }

      const bedData = {
        bedNumber: newBed.bedNumber,
        bedCategory: newBed.bedCategory,
        department: newBed.department || "NA",
        floor: newBed.floor,
        wing: newBed.wing,
        dailyRate: newBed.dailyRate,
        equipment: newBed.equipment,
        status: "available" as BedStatus,
      };

      const response = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const addedBed = await response.json();
      setBeds([...beds, addedBed]);
      setNewBed({ 
        bedNumber: "", 
        bedCategory: "" as BedCategory,
        department: "",
        floor: "" as Floor,
        wing: "" as Wing,
        dailyRate: 0,
        equipment: {
          hasMonitor: false,
          hasOxygen: false,
          hasVentilator: false
        }
      });
      setShowAddDialog(false);
      alert("Bed added successfully!");
    } catch (error) {
      console.error("Error adding bed:", error);
      alert(`Failed to add bed: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };

  const handleAssignPatient = async () => {
    try {
      if (!selectedBed || !selectedPatientForBed) {
        alert("Please select a patient");
        return;
      }

      const selectedPatient = patients.find(p => p.id === selectedPatientForBed);
      if (!selectedPatient) {
        alert("Patient not found");
        return;
      }

      const bedResponse = await fetch("/api/beds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBed.id,
          status: "occupied",
          patientId: selectedPatientForBed,
          bedNumber: selectedBed.bedNumber,
          bedCategory: selectedBed.bedCategory,
          department: selectedBed.department || "NA",
          floor: selectedBed.floor,
          wing: selectedBed.wing,
          dailyRate: selectedBed.dailyRate,
          equipment: selectedBed.equipment,
        }),
      });

      if (!bedResponse.ok) {
        throw new Error("Failed to update bed");
      }

      const updatedBed = await bedResponse.json();

      const patientResponse = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPatientForBed,
          assignedBed: selectedBed.bedNumber,
          status: "Admitted",
        }),
      });

      if (!patientResponse.ok) {
        throw new Error("Failed to update patient");
      }

      setBeds(beds.map(b => b.id === selectedBed.id ? updatedBed : b));
      setPatients(patients.map(p => 
        p.id === selectedPatientForBed 
          ? { ...p, assignedBed: selectedBed.bedNumber, status: "Admitted" }
          : p
      ));

      setShowAssignDialog(false);
      setSelectedBed(null);
      setSelectedPatientForBed("");
      alert("Patient assigned to bed successfully!");
    } catch (error) {
      console.error("Error assigning patient:", error);
      alert(`Failed to assign patient: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };

  const handleDischargePatient = async () => {
    try {
      if (!selectedBed || !selectedBed.patientId) {
        alert("No patient assigned to this bed");
        return;
      }

      const bedResponse = await fetch("/api/beds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBed.id,
          status: "available",
          patientId: null,
          bedNumber: selectedBed.bedNumber,
          bedCategory: selectedBed.bedCategory,
          department: selectedBed.department || "NA",
          floor: selectedBed.floor,
          wing: selectedBed.wing,
          dailyRate: selectedBed.dailyRate,
          equipment: selectedBed.equipment,
        }),
      });

      if (!bedResponse.ok) {
        throw new Error("Failed to update bed");
      }

      const updatedBed = await bedResponse.json();

      const patientResponse = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBed.patientId,
          assignedBed: null,
          status: "Discharged",
        }),
      });

      if (!patientResponse.ok) {
        throw new Error("Failed to update patient");
      }

      setBeds(beds.map(b => b.id === selectedBed.id ? updatedBed : b));
      setPatients(patients.map(p => 
        p.id === selectedBed.patientId 
          ? { ...p, assignedBed: null, status: "Discharged" }
          : p
      ));

      setSelectedBed(null);
      alert("Patient discharged from bed successfully!");
    } catch (error) {
      console.error("Error discharging patient:", error);
      alert(`Failed to discharge patient: ${error instanceof Error ? error.message : "Please try again."}`);
    }
  };

  const handleSaveBedCategory = async () => {
    if (newBedCategoryValue && newBedCategoryValue.trim()) {
      try {
        const response = await fetch("/api/bed-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "bedCategories", value: newBedCategoryValue.trim() }),
        });
        if (response.ok) {
          const config = await response.json();
          setCustomBedCategories(config.bedCategories);
          setNewBed({ ...newBed, bedCategory: newBedCategoryValue.trim() as BedCategory });
          setNewBedCategoryValue("");
          setShowBedCategoryInput(false);
        }
      } catch (error) {
        console.error("Failed to save bed category:", error);
      }
    }
  };

  const handleSaveDepartment = async () => {
    if (newDepartmentValue && newDepartmentValue.trim()) {
      try {
        const response = await fetch("/api/bed-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "departments", value: newDepartmentValue.trim() }),
        });
        if (response.ok) {
          const config = await response.json();
          setCustomDepartments(config.departments);
          setNewBed({ ...newBed, department: newDepartmentValue.trim() });
          setNewDepartmentValue("");
          setShowDepartmentInput(false);
        }
      } catch (error) {
        console.error("Failed to save department:", error);
      }
    }
  };

  const handleSaveFloor = async () => {
    if (newFloorValue && newFloorValue.trim()) {
      try {
        const response = await fetch("/api/bed-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "floors", value: newFloorValue.trim() }),
        });
        if (response.ok) {
          const config = await response.json();
          setCustomFloors(config.floors);
          setNewBed({ ...newBed, floor: newFloorValue.trim() as Floor });
          setNewFloorValue("");
          setShowFloorInput(false);
        }
      } catch (error) {
        console.error("Failed to save floor:", error);
      }
    }
  };

  const handleSaveWing = async () => {
    if (newWingValue && newWingValue.trim()) {
      try {
        const response = await fetch("/api/bed-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "wings", value: newWingValue.trim() }),
        });
        if (response.ok) {
          const config = await response.json();
          setCustomWings(config.wings);
          setNewBed({ ...newBed, wing: newWingValue.trim() as Wing });
          setNewWingValue("");
          setShowWingInput(false);
        }
      } catch (error) {
        console.error("Failed to save wing:", error);
      }
    }
  };

  // Dynamically generate bed category stats - will automatically include new bed categories
  const bedCategoryStats = React.useMemo(() => {
    const stats: { [key: string]: Bed[] } = {};
    
    // Get all unique bed categories from beds
    const uniqueBedCategories = [...new Set(beds.map(b => b.bedCategory))].filter(Boolean);
    
    // Generate stats for each bed category
    uniqueBedCategories.forEach(bedCategory => {
      stats[bedCategory] = beds.filter((b) => b.bedCategory === bedCategory);
    });
    
    return stats;
  }, [beds]);

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  const filteredBeds = beds.filter((bed) => {
    const bedCategoryMatch = selectedBedCategory === "All" || bed.bedCategory === selectedBedCategory;
    const statusMatch = selectedStatus === "All" || bed.status === selectedStatus;
    return bedCategoryMatch && statusMatch;
  });

  const getPatientForBed = (bedId: string) => {
    const bed = beds.find((b) => b.id === bedId);
    if (!bed?.patientId) return null;
    return patients.find((p) => p.id === bed.patientId);
  };

  const getBedStatusColor = (status: BedStatus) => {
    switch (status) {
      case "available":
        return "bg-white";
      case "occupied":
        return "bg-gray-600";
      case "maintenance":
        return "bg-gray-400";
      case "reserved":
        return "bg-yellow-600";
      default:
        return "bg-white";
    }
  };

  const getBedStatusBadge = (status: BedStatus) => {
    switch (status) {
      case "available":
        return <Badge className="bg-white text-black">Available</Badge>;
      case "occupied":
        return <Badge className="bg-gray-700 text-white">Occupied</Badge>;
      case "maintenance":
        return <Badge className="bg-gray-500 text-white">Maintenance</Badge>;
      case "reserved":
        return <Badge className="bg-yellow-600 text-white">Reserved</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-white">Bed Management</h1>
          <p className="text-gray-400 mt-2 text-lg">Manage hospital beds and assignments across all wards</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-white hover:bg-gray-200 text-black shadow-lg font-semibold">
          <Plus className="h-5 w-5 mr-2" />
          Add New Bed
        </Button>
      </div>

      {/* Stats Cards - Dynamically shows all bed categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(bedCategoryStats).map(([bedCategory, bedCategoryBeds], index) => {
          const occupied = bedCategoryBeds.filter((b) => b.status === "occupied").length;
          const total = bedCategoryBeds.length;
          const colors = [
            { border: "border-blue-500/30", bg: "bg-blue-500/10", icon: "text-blue-400" },
            { border: "border-green-500/30", bg: "bg-green-500/10", icon: "text-green-400" },
            { border: "border-purple-500/30", bg: "bg-purple-500/10", icon: "text-purple-400" },
            { border: "border-orange-500/30", bg: "bg-orange-500/10", icon: "text-orange-400" },
            { border: "border-pink-500/30", bg: "bg-pink-500/10", icon: "text-pink-400" },
            { border: "border-yellow-500/30", bg: "bg-yellow-500/10", icon: "text-yellow-400" },
          ];
          const color = colors[index % colors.length];
          return (
            <Card key={bedCategory} className={`border-2 ${color.border} ${color.bg} shadow-lg hover:shadow-xl transition-all`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 font-medium">{bedCategory}</p>
                    <p className="text-3xl font-black text-white mt-1">
                      {occupied}/{total}
                    </p>
                    <p className="text-sm font-medium text-gray-400 mt-2">
                      {total > 0 ? ((occupied / total) * 100).toFixed(0) : 0}% occupied
                    </p>
                  </div>
                  <BedIcon className={`h-10 w-10 ${color.icon}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6 border-2 border-white shadow-lg bg-black">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-white" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Bed Category</label>
                <select
                  value={selectedBedCategory}
                  onChange={(e) => setSelectedBedCategory(e.target.value as BedCategory | "All")}
                  className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="All">All Bed Categories</option>
                  {customBedCategories.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as BedStatus | "All")}
                  className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="All">All Status</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bed Grid */}
      <Card className="border-2 border-white shadow-lg bg-black">
        <CardHeader className="bg-black text-white border-b-2 border-white">
          <CardTitle className="text-white font-bold">Bed Overview ({filteredBeds.length} beds)</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-black">
          {filteredBeds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No beds found. Click &quot;Add New Bed&quot; to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredBeds.map((bed) => (
                <button
                  key={bed.id}
                  onClick={() => setSelectedBed(bed)}
                  className={`
                    p-4 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg cursor-pointer
                    ${bed.status === "available" ? "border-white bg-black text-white" : ""}
                    ${bed.status === "occupied" ? "border-white bg-gray-700 text-white" : ""}
                    ${bed.status === "maintenance" ? "border-gray-400 bg-gray-500 text-white" : ""}
                    ${bed.status === "reserved" ? "border-yellow-400 bg-yellow-700 text-white" : ""}
                  `}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-3 h-3 rounded-full mb-2 ${getBedStatusColor(bed.status)} border border-current`}
                    />
                    <div className="font-bold text-sm">{bed.bedNumber}</div>
                    <div className="text-xs opacity-70 mt-1">{bed.bedCategory}</div>
                    {bed.status === "occupied" && bed.patientId && (
                      <div className="text-xs opacity-70 mt-1">
                        {patients.find((p) => p.id === bed.patientId)?.name.split(" ")[0]}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bed Details Dialog */}
      <Dialog open={!!selectedBed} onOpenChange={() => setSelectedBed(null)}>
        <DialogContent className="max-w-2xl bg-black border-2 border-white text-white" onClose={() => setSelectedBed(null)}>
          <DialogHeader>
            <DialogTitle className="text-white">Bed Details - {selectedBed?.bedNumber}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedBed?.bedCategory}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            {/* Bed Information */}
            <div className="border-2 border-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg text-white">Bed Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Bed Number:</span>
                  <p className="font-medium text-white">{selectedBed?.bedNumber}</p>
                </div>
                <div>
                  <span className="text-gray-400">Bed Category:</span>
                  <p className="font-medium text-white">{selectedBed?.bedCategory}</p>
                </div>
                <div>
                  <span className="text-gray-400">Department:</span>
                  <p className="font-medium text-white">{selectedBed?.department || "NA"}</p>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  {selectedBed && getBedStatusBadge(selectedBed.status)}
                </div>
                {selectedBed?.floor && (
                  <div>
                    <span className="text-gray-400">Floor:</span>
                    <p className="font-medium text-white">{selectedBed.floor}</p>
                  </div>
                )}
                {selectedBed?.wing && (
                  <div>
                    <span className="text-gray-400">Wing:</span>
                    <p className="font-medium text-white">{selectedBed.wing}</p>
                  </div>
                )}
                {selectedBed?.dailyRate && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Daily Rate:</span>
                    <p className="font-medium text-white">₹{selectedBed.dailyRate.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
              
              {/* Equipment */}
              {selectedBed?.equipment && (
                <div className="mt-4 pt-4 border-t-2 border-white/20">
                  <h4 className="font-semibold text-white mb-2">Equipment Available:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBed.equipment.hasMonitor && (
                      <Badge className="bg-blue-600 text-white">Monitor</Badge>
                    )}
                    {selectedBed.equipment.hasOxygen && (
                      <Badge className="bg-green-600 text-white">Oxygen</Badge>
                    )}
                    {selectedBed.equipment.hasVentilator && (
                      <Badge className="bg-red-600 text-white">Ventilator</Badge>
                    )}
                    {!selectedBed.equipment.hasMonitor && !selectedBed.equipment.hasOxygen && !selectedBed.equipment.hasVentilator && (
                      <span className="text-gray-400 text-sm">No special equipment</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedBed?.status === "occupied" && selectedBed.patientId && (
              <>
                {(() => {
                  const patient = getPatientForBed(selectedBed.id);
                  if (!patient) return null;
                  return (
                    <div className="border-2 border-white rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-lg text-white">Patient Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <p className="font-medium text-white">{patient.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Age:</span>
                          <p className="font-medium text-white">
                            {patient.age} years ({patient.gender})
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-400">Patient ID:</span>
                          <p className="font-medium text-white">{patient.id}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Admission Date:</span>
                          <p className="font-medium text-white">{patient.admissionDate}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Diagnosis:</span>
                          <p className="font-medium text-white">{patient.diagnosis}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-400">Contact:</span>
                          <p className="font-medium text-white">{patient.phone}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {selectedBed?.status === "available" && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">This bed is available for new patients</p>
                <Button onClick={() => setShowAssignDialog(true)} className="bg-white hover:bg-gray-200 text-black font-semibold">Assign Patient</Button>
              </div>
            )}

            {selectedBed?.status === "maintenance" && (
              <div className="bg-white/10 border-2 border-white/30 rounded-lg p-4">
                <p className="text-white">
                  This bed is currently under maintenance and not available for use.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t-2 border-white/20">
              <Button variant="outline" onClick={() => setSelectedBed(null)} className="border-2 border-white hover:bg-white hover:text-black text-white">
                Close
              </Button>
              {selectedBed?.status === "occupied" && (
                <Button onClick={handleDischargePatient} className="bg-white hover:bg-gray-200 text-black font-semibold">Discharge Patient</Button>
              )}
              {selectedBed?.status === "available" && (
                <Button onClick={() => setShowAssignDialog(true)} className="bg-white hover:bg-gray-200 text-black font-semibold">Assign Patient</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bed Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent onClose={() => setShowAddDialog(false)} className="max-w-3xl bg-black border-2 border-white text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Bed</DialogTitle>
            <DialogDescription className="text-gray-400">Create a new bed in the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Bed Number *</label>
                <Input
                  placeholder="e.g., C-204"
                  value={newBed.bedNumber}
                  onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Bed Category *</label>
                {showBedCategoryInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new bed category"
                      value={newBedCategoryValue}
                      onChange={(e) => setNewBedCategoryValue(e.target.value)}
                      className="border-2 border-white/20 focus:border-white bg-black text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveBedCategory()}
                    />
                    <Button onClick={handleSaveBedCategory} className="bg-green-600 hover:bg-green-700 text-white px-3">✓</Button>
                    <Button onClick={() => { setShowBedCategoryInput(false); setNewBedCategoryValue(""); }} className="bg-red-600 hover:bg-red-700 text-white px-3">✕</Button>
                  </div>
                ) : (
                  <select
                    value={newBed.bedCategory}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowBedCategoryInput(true);
                      } else {
                        setNewBed({ ...newBed, bedCategory: e.target.value as BedCategory });
                      }
                    }}
                    className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                  >
                    <option value="">Select Bed Category</option>
                    {customBedCategories.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-green-400">+ Add New Bed Category</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Department</label>
                {showDepartmentInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new department"
                      value={newDepartmentValue}
                      onChange={(e) => setNewDepartmentValue(e.target.value)}
                      className="border-2 border-white/20 focus:border-white bg-black text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveDepartment()}
                    />
                    <Button onClick={handleSaveDepartment} className="bg-green-600 hover:bg-green-700 text-white px-3">✓</Button>
                    <Button onClick={() => { setShowDepartmentInput(false); setNewDepartmentValue(""); }} className="bg-red-600 hover:bg-red-700 text-white px-3">✕</Button>
                  </div>
                ) : (
                  <select
                    value={newBed.department || "NA"}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowDepartmentInput(true);
                      } else {
                        setNewBed({ ...newBed, department: e.target.value === "NA" ? "" : e.target.value });
                      }
                    }}
                    className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                  >
                    <option value="NA">NA</option>
                    {customDepartments.filter(d => d !== "NA").map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-green-400">+ Add New Department</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Floor *</label>
                {showFloorInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new floor"
                      value={newFloorValue}
                      onChange={(e) => setNewFloorValue(e.target.value)}
                      className="border-2 border-white/20 focus:border-white bg-black text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveFloor()}
                    />
                    <Button onClick={handleSaveFloor} className="bg-green-600 hover:bg-green-700 text-white px-3">✓</Button>
                    <Button onClick={() => { setShowFloorInput(false); setNewFloorValue(""); }} className="bg-red-600 hover:bg-red-700 text-white px-3">✕</Button>
                  </div>
                ) : (
                  <select
                    value={newBed.floor || ""}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowFloorInput(true);
                      } else {
                        setNewBed({ ...newBed, floor: e.target.value as Floor });
                      }
                    }}
                    className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                  >
                    <option value="">Select Floor</option>
                    {customFloors.map((floor) => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-green-400">+ Add New Floor</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Wing *</label>
                {showWingInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new wing"
                      value={newWingValue}
                      onChange={(e) => setNewWingValue(e.target.value)}
                      className="border-2 border-white/20 focus:border-white bg-black text-white"
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveWing()}
                    />
                    <Button onClick={handleSaveWing} className="bg-green-600 hover:bg-green-700 text-white px-3">✓</Button>
                    <Button onClick={() => { setShowWingInput(false); setNewWingValue(""); }} className="bg-red-600 hover:bg-red-700 text-white px-3">✕</Button>
                  </div>
                ) : (
                  <select
                    value={newBed.wing || ""}
                    onChange={(e) => {
                      if (e.target.value === "__ADD_NEW__") {
                        setShowWingInput(true);
                      } else {
                        setNewBed({ ...newBed, wing: e.target.value as Wing });
                      }
                    }}
                    className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                  >
                    <option value="">Select Wing</option>
                    {customWings.map((wing) => (
                      <option key={wing} value={wing}>{wing}</option>
                    ))}
                    <option value="__ADD_NEW__" className="font-bold text-green-400">+ Add New Wing</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Daily Rate (₹) *</label>
                <Input
                  type="number"
                  placeholder="e.g., 2000"
                  value={newBed.dailyRate || ""}
                  onChange={(e) => setNewBed({ ...newBed, dailyRate: e.target.value ? parseFloat(e.target.value) : 0 })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
            </div>
            
            {/* Equipment Section */}
            <div className="border-2 border-white/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Equipment Available</h3>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBed.equipment.hasMonitor}
                    onChange={(e) => setNewBed({ 
                      ...newBed, 
                      equipment: { ...newBed.equipment, hasMonitor: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-white/20"
                  />
                  <span className="text-sm text-white">Monitor</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBed.equipment.hasOxygen}
                    onChange={(e) => setNewBed({ 
                      ...newBed, 
                      equipment: { ...newBed.equipment, hasOxygen: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-white/20"
                  />
                  <span className="text-sm text-white">Oxygen</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBed.equipment.hasVentilator}
                    onChange={(e) => setNewBed({ 
                      ...newBed, 
                      equipment: { ...newBed.equipment, hasVentilator: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-white/20"
                  />
                  <span className="text-sm text-white">Ventilator</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-white/20">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-2 border-white hover:bg-gray-200 hover:text-black text-black font-semibold">
                Cancel
              </Button>
              <Button onClick={handleAddBed} className="bg-white hover:bg-gray-200 text-black font-semibold">
                Add Bed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Patient Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent onClose={() => setShowAssignDialog(false)} className="bg-black border-2 border-white text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Assign Patient to Bed {selectedBed?.bedNumber}</DialogTitle>
            <DialogDescription className="text-gray-400">Select a patient to assign to this bed</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <div>
              <label className="text-sm font-medium mb-1 block text-white">Select Patient</label>
              <select
                value={selectedPatientForBed}
                onChange={(e) => setSelectedPatientForBed(e.target.value)}
                className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
              >
                <option value="">Choose a patient...</option>
                {patients
                  .filter((p) => (p.status === "Waiting" || p.status === "Admitted") && !p.assignedBed)
                  .map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.id} ({patient.diagnosis})
                    </option>
                  ))}
              </select>
              {patients.filter((p) => (p.status === "Waiting" || p.status === "Admitted") && !p.assignedBed).length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No patients available for assignment</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAssignDialog(false);
                setSelectedPatientForBed("");
              }} className="border-2 border-white hover:bg-white hover:text-black text-black">
                Cancel
              </Button>
              <Button 
                onClick={handleAssignPatient}
                disabled={!selectedPatientForBed}
                className="bg-white hover:bg-gray-200 text-black font-semibold disabled:opacity-50"
              >
                Assign Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}