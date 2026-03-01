"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Patient, PatientStatus, DocumentType } from "@/lib/types";
import type { MedicalDocument, Bed, Claim } from "@/lib/types";
import {
  Plus,
  Search,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Pill,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Filter,
  UserMinus,
  Users,
  Clock,
  UserCheck,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "All">("All");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDischargeDialog, setShowDischargeDialog] = useState(false);
  const [showReAdmitDialog, setShowReAdmitDialog] = useState(false);
  const [claimInsurance, setClaimInsurance] = useState<boolean | null>(null);
  const [policyNumber, setPolicyNumber] = useState("");
  const [patientClaim, setPatientClaim] = useState<Claim | null>(null);
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [documentFilter, setDocumentFilter] = useState<DocumentType | "All">("All");
  const [loading, setLoading] = useState(true);
  const [newPatient, setNewPatient] = useState({
    uhid: "",
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    bloodGroup: "A+",
    emergencyContact: "",
    diagnosis: "",
    allergies: "",
    medications: "",
    assignedBed: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, docsRes, bedsRes, claimsRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/documents"),
          fetch("/api/beds"),
          fetch("/api/claims"),
        ]);
        
        const patientsData = await patientsRes.json();
        const docsData = await docsRes.json();
        const bedsData = await bedsRes.json();
        const claimsData = await claimsRes.json();
        
        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setDocuments(Array.isArray(docsData) ? docsData : []);
        setBeds(Array.isArray(bedsData) ? bedsData : []);
        setClaims(Array.isArray(claimsData) ? claimsData : []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setPatients([]);
        setDocuments([]);
        setBeds([]);
        setClaims([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle UHID search for existing patients
  const handleUhidSearch = () => {
    if (!newPatient.uhid.trim()) {
      alert("Please enter a UHID to search");
      return;
    }

    const existingPatient = patients.find(p => p.uhid?.toLowerCase() === newPatient.uhid.toLowerCase());
    
    if (existingPatient) {
      if (existingPatient.status === "Discharged") {
        // Found a discharged patient - allow re-admission
        setFoundPatient(existingPatient);
        setShowReAdmitDialog(true);
        setShowAddDialog(false);
      } else {
        alert(`Patient with UHID ${newPatient.uhid} is already ${existingPatient.status.toLowerCase()} in the hospital.`);
      }
    } else {
      // No existing patient, allow new registration with this UHID
      setFoundPatient(null);
      alert("No existing patient found with this UHID. You can proceed to register as a new patient.");
    }
  };

  // Handle adding a new patient
  const handleAddPatient = async () => {
    try {
      if (!newPatient.name || !newPatient.age || !newPatient.phone) {
        alert("Please fill in all required fields (Name, Age, Phone)");
        return;
      }

      // Auto-generate UHID
      const allPatients = patients;
      let nextUhidNumber = 1;
      
      if (allPatients.length > 0) {
        const uhidNumbers = allPatients
          .map(p => {
            if (p.uhid) {
              const match = p.uhid.match(/^P(\d+)$/);
              return match ? parseInt(match[1]) : 0;
            }
            return 0;
          })
          .filter(num => num > 0);
        
        if (uhidNumbers.length > 0) {
          nextUhidNumber = Math.max(...uhidNumbers) + 1;
        }
      }
      
      const uhid = `P${nextUhidNumber.toString().padStart(6, '0')}`;
      const patientId = `p${Date.now()}`;

      const patientData = {
        id: patientId,
        uhid: uhid,
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        phone: newPatient.phone,
        email: newPatient.email,
        address: newPatient.address,
        bloodGroup: newPatient.bloodGroup,
        emergencyContact: newPatient.emergencyContact,
        diagnosis: newPatient.diagnosis,
        allergies: newPatient.allergies || "None",
        medications: newPatient.medications || "None",
        admissionDate: new Date().toISOString(),
        status: (newPatient.assignedBed ? "Admitted" : "Waiting") as PatientStatus,
        assignedBed: newPatient.assignedBed || undefined,
        admissionHistory: [],
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add patient");
      }

      const addedPatient = await response.json();

      // If a bed was assigned, update the bed status
      if (newPatient.assignedBed) {
        const selectedBed = beds.find(b => b.bedNumber === newPatient.assignedBed);
        if (selectedBed) {
          await fetch(`/api/beds`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedBed.id,
              status: "occupied",
              patientId: addedPatient.id,
              bedNumber: selectedBed.bedNumber,
              ward: selectedBed.ward,
            }),
          });
          // Update local beds state to reflect the change
          setBeds(beds.map(b => 
            b.id === selectedBed.id 
              ? { ...b, status: "occupied", patientId: addedPatient.id }
              : b
          ));
        }
      }

      setPatients([...patients, addedPatient]);

      setNewPatient({
        uhid: "",
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        address: "",
        bloodGroup: "A+",
        emergencyContact: "",
        diagnosis: "",
        allergies: "",
        medications: "",
        assignedBed: "",
      });
      setShowAddDialog(false);

      alert("Patient added successfully!");
    } catch (error) {
      console.error("Error adding patient:", error);
      alert(`Failed to add patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle re-admitting a discharged patient
  const handleReAdmitPatient = async () => {
    try {
      if (!foundPatient) return;

      // Move current admission to history
      const currentAdmission = {
        admissionDate: foundPatient.admissionDate,
        dischargeDate: foundPatient.dischargeDate,
        diagnosis: foundPatient.diagnosis,
        assignedBed: foundPatient.assignedBed,
        medications: foundPatient.medications,
        notes: `Discharged on ${foundPatient.dischargeDate}`,
      };

      const updatedPatientData = {
        id: foundPatient.id,
        uhid: foundPatient.uhid,
        name: newPatient.name || foundPatient.name,
        age: newPatient.age ? parseInt(newPatient.age) : foundPatient.age,
        gender: newPatient.gender || foundPatient.gender,
        phone: newPatient.phone || foundPatient.phone,
        email: newPatient.email || foundPatient.email,
        address: newPatient.address || foundPatient.address,
        bloodGroup: newPatient.bloodGroup || foundPatient.bloodGroup,
        emergencyContact: newPatient.emergencyContact || foundPatient.emergencyContact,
        diagnosis: newPatient.diagnosis || foundPatient.diagnosis,
        allergies: newPatient.allergies || foundPatient.allergies,
        medications: newPatient.medications || foundPatient.medications,
        admissionDate: new Date().toISOString(),
        dischargeDate: null,
        status: (newPatient.assignedBed ? "Admitted" : "Waiting") as PatientStatus,
        assignedBed: newPatient.assignedBed || undefined,
        admissionHistory: [...(foundPatient.admissionHistory || []), currentAdmission],
      };

      const response = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatientData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to re-admit patient");
      }

      const updatedPatient = await response.json();

      // If a bed was assigned, update the bed status
      if (newPatient.assignedBed) {
        const selectedBed = beds.find(b => b.bedNumber === newPatient.assignedBed);
        if (selectedBed) {
          await fetch(`/api/beds`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedBed.id,
              status: "occupied",
              patientId: foundPatient.id,
              bedNumber: selectedBed.bedNumber,
              ward: selectedBed.ward,
            }),
          });
          setBeds(beds.map(b => 
            b.id === selectedBed.id 
              ? { ...b, status: "occupied", patientId: foundPatient.id }
              : b
          ));
        }
      }

      // Update local state
      setPatients(patients.map(p => p.id === foundPatient.id ? updatedPatient : p));

      setNewPatient({
        uhid: "",
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        email: "",
        address: "",
        bloodGroup: "A+",
        emergencyContact: "",
        diagnosis: "",
        allergies: "",
        medications: "",
        assignedBed: "",
      });
      setShowReAdmitDialog(false);
      setFoundPatient(null);

      alert("Patient re-admitted successfully!");
    } catch (error) {
      console.error("Error re-admitting patient:", error);
      alert(`Failed to re-admit patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const patientDocuments = selectedPatient
    ? documents.filter((doc) => {
        const matchesPatient = doc.patientId === selectedPatient.id;
        const matchesType = documentFilter === "All" || doc.type === documentFilter;
        return matchesPatient && matchesType;
      })
    : [];

  const availableBeds = beds.filter(b => b.status === "available");

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case "Waiting":
        return <Badge variant="warning">Waiting</Badge>;
      case "Admitted":
        return <Badge variant="default">Admitted</Badge>;
      case "Discharged":
        return <Badge variant="secondary">Discharged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date | string | undefined, formatStr: string) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr);
  };

  const waitingPatients = patients.filter(p => p.status === "Waiting").length;
  const admittedPatients = patients.filter(p => p.status === "Admitted").length;
  const dischargedPatients = patients.filter(p => p.status === "Discharged").length;

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="flex items-center justify-between mb-8 animate-fadeIn">
        <div>
          <h1 className="text-4xl font-black text-white">Patient Management</h1>
          <p className="text-gray-400 mt-2 text-lg">Manage patient records, admissions, and medical care</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-white hover:bg-gray-200 text-black shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <Plus className="h-5 w-5 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Patients</p>
                <p className="text-3xl font-bold text-white mt-1">{patients.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Waiting</p>
                <p className="text-3xl font-bold text-white mt-1">{waitingPatients}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/30 bg-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Admitted</p>
                <p className="text-3xl font-bold text-white mt-1">{admittedPatients}</p>
              </div>
              <UserCheck className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-500/30 bg-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Discharged</p>
                <p className="text-3xl font-bold text-white mt-1">{dischargedPatients}</p>
              </div>
              <UserMinus className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 animate-slideUp border-2 border-white shadow-lg bg-black">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-gray-700 focus:border-white focus:ring-white transition-colors bg-black text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PatientStatus | "All")}
                className="w-40 h-10 rounded-md border-2 border-gray-700 focus:border-white bg-black text-white px-3 py-2"
              >
                <option value="All">All Status</option>
                <option value="Waiting">Waiting</option>
                <option value="Admitted">Admitted</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient, idx) => (
          <Card
            key={patient.id}
            style={{ animationDelay: `${idx * 100}ms` }}
            className="animate-fadeIn hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white shadow-lg bg-black hover:bg-gray-900"
            onClick={() => setSelectedPatient(patient)}
          >
            <CardHeader className="pb-3 border-b border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                    <User className="h-6 w-6 text-black" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">{patient.name}</CardTitle>
                    <p className="text-sm text-gray-500">UHID: {patient.uhid || patient.id}</p>
                  </div>
                </div>
                {getStatusBadge(patient.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-400">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  {patient.age} years, {patient.gender}
                </div>
                <div className="flex items-center text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  Admitted: {formatDate(patient.admissionDate, "MMM dd, yyyy")}
                </div>
                <div className="flex items-center text-gray-400">
                  <Heart className="h-4 w-4 mr-2" />
                  {patient.diagnosis}
                </div>
                {patient.assignedBed && (
                  <div className="mt-3 pt-3 border-t">
                    <Badge variant="outline">Bed: {patient.assignedBed}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card className="bg-black border-2 border-white">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No patients found matching your criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onClose={() => setSelectedPatient(null)}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedPatient?.name}</DialogTitle>
                <DialogDescription>UHID: {selectedPatient?.uhid}</DialogDescription>
              </div>
              {selectedPatient && getStatusBadge(selectedPatient.status)}
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="history">Admission History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Personal Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <User className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">UHID</p>
                        <p className="font-medium">{selectedPatient?.uhid || "Not assigned"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <User className="h-4 w-4 mr-2 mt-0.5 text-gray-600" />
                      <div>
                        <p className="text-gray-500">Age & Gender</p>
                        <p className="font-medium text-white">
                          {selectedPatient?.age} years, {selectedPatient?.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="font-medium">{selectedPatient?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="font-medium">{selectedPatient?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="font-medium">{selectedPatient?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{selectedPatient?.emergencyContact}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Admission Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Admission Date</p>
                        <p className="font-medium">
                          {selectedPatient &&
                            formatDate(selectedPatient.admissionDate, "PPP")}
                        </p>
                      </div>
                    </div>
                    {selectedPatient?.dischargeDate && (
                      <div className="flex items-start">
                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Discharge Date</p>
                          <p className="font-medium">
                            {formatDate(selectedPatient.dischargeDate, "PPP")}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start">
                      <Heart className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Diagnosis</p>
                        <p className="font-medium">{selectedPatient?.diagnosis}</p>
                      </div>
                    </div>
                    {selectedPatient?.assignedBed && (
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-gray-500">Assigned Bed</p>
                          <Badge variant="outline">{selectedPatient.assignedBed}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medical" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    <h3 className="font-semibold">Blood Group</h3>
                  </div>
                  <p className="text-lg font-medium">{selectedPatient?.bloodGroup}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
                    <h3 className="font-semibold">Allergies</h3>
                  </div>
                  <p>{selectedPatient?.allergies}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Pill className="h-5 w-5 mr-2 text-gray-500" />
                    <h3 className="font-semibold">Current Medications</h3>
                  </div>
                  <p>{selectedPatient?.medications}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Patient Documents</h3>
                <select
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value as DocumentType | "All")}
                  className="w-48 h-10 rounded-md border-2 border-gray-700 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="All">All Documents</option>
                  <option value="Report">Reports</option>
                  <option value="Prescription">Prescriptions</option>
                  <option value="Lab Result">Lab Results</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                </select>
              </div>

              <div className="space-y-3">
                {patientDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.type} • {formatDate(doc.date, "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {patientDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No documents found for this patient
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <h3 className="font-semibold text-lg">Previous Admissions</h3>
              {selectedPatient?.admissionHistory && selectedPatient.admissionHistory.length > 0 ? (
                <div className="space-y-3">
                  {selectedPatient.admissionHistory.map((admission, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Admission Date</p>
                          <p className="font-medium">
                            {formatDate(admission.admissionDate, "PPP")}
                          </p>
                        </div>
                        {admission.dischargeDate && (
                          <div>
                            <p className="text-gray-500">Discharge Date</p>
                            <p className="font-medium">
                              {formatDate(admission.dischargeDate, "PPP")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Diagnosis</p>
                          <p className="font-medium">{admission.diagnosis}</p>
                        </div>
                        {admission.assignedBed && (
                          <div>
                            <p className="text-gray-500">Bed</p>
                            <p className="font-medium">{admission.assignedBed}</p>
                          </div>
                        )}
                        {admission.medications && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Medications</p>
                            <p className="font-medium">{admission.medications}</p>
                          </div>
                        )}
                        {admission.notes && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Notes</p>
                            <p className="font-medium text-gray-600">{admission.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No previous admissions found for this patient
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-6 border-t mt-6">
            <Button variant="outline" onClick={() => setSelectedPatient(null)}>
              Close
            </Button>
            {selectedPatient?.status === "Admitted" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDischargeDialog(true);
                  setClaimInsurance(null);
                  setPolicyNumber("");
                  const existingClaim = claims.find(c => 
                    c.patientName === selectedPatient.name
                  );
                  setPatientClaim(existingClaim || null);
                }}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Initiate Discharge
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={showDischargeDialog} onOpenChange={() => {
        setShowDischargeDialog(false);
        setClaimInsurance(null);
        setPolicyNumber("");
        setPatientClaim(null);
      }}>
        <DialogContent className="max-w-2xl bg-black border-2 border-white text-white" onClose={() => {
          setShowDischargeDialog(false);
          setClaimInsurance(null);
          setPolicyNumber("");
          setPatientClaim(null);
        }}>
          <DialogHeader>
            <DialogTitle className="text-white">Initiate Discharge Process</DialogTitle>
            <DialogDescription className="text-gray-400">
              Discharge process for {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            {claimInsurance === null && (
              <>
                <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                  <p className="text-sm font-semibold text-white mb-2">
                    Does the patient want to claim insurance?
                  </p>
                  <p className="text-sm text-gray-400">
                    Select whether the patient wants to file an insurance claim before discharge.
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setClaimInsurance(false)}
                    className="flex-1"
                  >
                    No, Discharge Directly
                  </Button>
                  <Button
                    onClick={() => setClaimInsurance(true)}
                    className="flex-1 bg-white hover:bg-gray-200 text-black font-semibold"
                  >
                    Yes, Claim Insurance
                  </Button>
                </div>
              </>
            )}

            {claimInsurance === false && (
              <>
                <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                  <p className="text-sm text-white">
                    Patient will be discharged without insurance claim.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setClaimInsurance(null)}
                  >
                    Back
                  </Button>
                  <Button onClick={async () => {
                    if (selectedPatient) {
                      // Update patient status in database
                      await fetch('/api/patients', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: selectedPatient.id,
                          status: 'Discharged',
                        }),
                      });

                      // Update patient status in local state
                      const updatedPatients = patients.map(p => 
                        p.id === selectedPatient.id 
                          ? { ...p, status: "Discharged" as const }
                          : p
                      );
                      setPatients(updatedPatients);
                      setSelectedPatient({ ...selectedPatient, status: "Discharged" });

                      // Free up the bed if one was assigned
                      if (selectedPatient.assignedBed) {
                        const assignedBed = beds.find(b => b.bedNumber === selectedPatient.assignedBed);
                        if (assignedBed) {
                          await fetch(`/api/beds`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: assignedBed.id,
                              status: "available",
                              patientId: null,
                              bedNumber: assignedBed.bedNumber,
                              ward: assignedBed.ward,
                            }),
                          });
                          setBeds(beds.map(b => 
                            b.id === assignedBed.id 
                              ? { ...b, status: "available", patientId: undefined }
                              : b
                          ));
                        }
                      }
                    }
                    setShowDischargeDialog(false);
                    setClaimInsurance(null);
                    alert("Patient discharged successfully!");
                  }} className="bg-white hover:bg-gray-200 text-black font-semibold">
                    Confirm Discharge
                  </Button>
                </div>
              </>
            )}

            {claimInsurance === true && (
              <>
                {patientClaim ? (
                  <>
                    <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                      <p className="text-sm font-semibold text-white mb-3">
                        Existing Insurance Claim Found
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Policy Number:</span>
                          <span className="font-medium text-white">{patientClaim.policyNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Insurer:</span>
                          <span className="font-medium text-white">{patientClaim.insurer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Claim Amount:</span>
                          <span className="font-medium text-white">${patientClaim.claimAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="font-medium text-white">{patientClaim.status}</span>
                        </div>
                        {patientClaim.status === "Approved" && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Approved Amount:</span>
                            <span className="font-medium text-green-600">${patientClaim.approvedAmount?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                      <p className="text-sm text-white">
                        Insurance claim is <strong>{patientClaim.status}</strong>. You can now proceed with discharge.
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setClaimInsurance(null)}
                      >
                        Back
                      </Button>
                      <Button onClick={async () => {
                        if (selectedPatient) {
                          // Update patient status in database
                          await fetch('/api/patients', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: selectedPatient.id,
                              status: 'Discharged',
                            }),
                          });

                          // Update patient status in local state
                          const updatedPatients = patients.map(p => 
                            p.id === selectedPatient.id 
                              ? { ...p, status: "Discharged" as const }
                              : p
                          );
                          setPatients(updatedPatients);
                          setSelectedPatient({ ...selectedPatient, status: "Discharged" });

                          // Free up the bed if one was assigned
                          if (selectedPatient.assignedBed) {
                            const assignedBed = beds.find(b => b.bedNumber === selectedPatient.assignedBed);
                            if (assignedBed) {
                              await fetch(`/api/beds`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: assignedBed.id,
                                  status: "available",
                                  patientId: null,
                                  bedNumber: assignedBed.bedNumber,
                                  ward: assignedBed.ward,
                                }),
                              });
                              setBeds(beds.map(b => 
                                b.id === assignedBed.id 
                                  ? { ...b, status: "available", patientId: undefined }
                                  : b
                              ));
                            }
                          }
                        }
                        setShowDischargeDialog(false);
                        setClaimInsurance(null);
                        setPatientClaim(null);
                        alert("Patient discharged successfully with insurance claim!");
                      }} className="bg-white hover:bg-gray-200 text-black font-semibold">
                        Confirm Discharge
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                      <p className="text-sm text-white mb-2">
                        No existing claim found. Please enter policy details.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block text-white">Policy Number</label>
                      <Input
                        placeholder="Enter policy number"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        className="bg-black text-white border-2 border-gray-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setClaimInsurance(null)}
                      >
                        Back
                      </Button>
                      <Button onClick={async () => {
                        if (!policyNumber) {
                          alert("Please enter a policy number");
                          return;
                        }
                        if (selectedPatient) {
                          // Update patient status in database
                          await fetch('/api/patients', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: selectedPatient.id,
                              status: 'Discharged',
                            }),
                          });

                          // Update patient status in local state
                          const updatedPatients = patients.map(p => 
                            p.id === selectedPatient.id 
                              ? { ...p, status: "Discharged" as const }
                              : p
                          );
                          setPatients(updatedPatients);
                          setSelectedPatient({ ...selectedPatient, status: "Discharged" });

                          // Free up the bed if one was assigned
                          if (selectedPatient.assignedBed) {
                            const assignedBed = beds.find(b => b.bedNumber === selectedPatient.assignedBed);
                            if (assignedBed) {
                              await fetch(`/api/beds`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: assignedBed.id,
                                  status: "available",
                                  patientId: null,
                                  bedNumber: assignedBed.bedNumber,
                                  ward: assignedBed.ward,
                                }),
                              });
                              setBeds(beds.map(b => 
                                b.id === assignedBed.id 
                                  ? { ...b, status: "available", patientId: undefined }
                                  : b
                              ));
                            }
                          }
                        }
                        setShowDischargeDialog(false);
                        setClaimInsurance(null);
                        setPolicyNumber("");
                        alert("Patient discharged and insurance claim created!");
                      }} className="bg-white hover:bg-gray-200 text-black font-semibold">
                        Create Claim & Discharge
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={() => {
        setShowAddDialog(false);
        setNewPatient({
          uhid: "",
          name: "",
          age: "",
          gender: "Male",
          phone: "",
          email: "",
          address: "",
          bloodGroup: "A+",
          emergencyContact: "",
          diagnosis: "",
          allergies: "",
          medications: "",
          assignedBed: "",
        });
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Enter patient admission details. UHID will be auto-generated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
              <p className="text-sm text-white mb-2">
                <strong>Search Existing Patient:</strong> Enter UHID to check if patient was previously registered.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter UHID (e.g., P000001)"
                  value={newPatient.uhid}
                  onChange={(e) => setNewPatient({ ...newPatient, uhid: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
                <Button onClick={handleUhidSearch} variant="outline">
                  Search
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Full Name *</label>
                <Input
                  placeholder="John Doe"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Age *</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Gender</label>
                <select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                  className="w-full h-10 rounded-md bg-black text-white border-2 border-gray-700 px-3 py-2"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Phone *</label>
                <Input
                  placeholder="+1234567890"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Blood Group</label>
                <select
                  value={newPatient.bloodGroup}
                  onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                  className="w-full h-10 rounded-md bg-black text-white border-2 border-gray-700 px-3 py-2"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block text-white">Address</label>
                <Input
                  placeholder="123 Main St, City"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Emergency Contact</label>
                <Input
                  placeholder="+1234567890"
                  value={newPatient.emergencyContact}
                  onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Diagnosis</label>
                <Input
                  placeholder="Primary diagnosis"
                  value={newPatient.diagnosis}
                  onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Allergies</label>
                <Input
                  placeholder="None"
                  value={newPatient.allergies}
                  onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Medications</label>
                <Input
                  placeholder="Current medications"
                  value={newPatient.medications}
                  onChange={(e) => setNewPatient({ ...newPatient, medications: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Assign Bed</label>
                <select
                  value={newPatient.assignedBed}
                  onChange={(e) => setNewPatient({ ...newPatient, assignedBed: e.target.value })}
                  className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="">Select a bed (optional)</option>
                  {availableBeds.map((bed) => (
                    <option key={bed.id} value={bed.bedNumber}>
                      {bed.bedNumber} ({bed.ward})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPatient} className="bg-white hover:bg-gray-200 text-black font-semibold">
                Add Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-Admit Dialog */}
      <Dialog open={showReAdmitDialog} onOpenChange={() => {
        setShowReAdmitDialog(false);
        setFoundPatient(null);
        setNewPatient({
          uhid: "",
          name: "",
          age: "",
          gender: "Male",
          phone: "",
          email: "",
          address: "",
          bloodGroup: "A+",
          emergencyContact: "",
          diagnosis: "",
          allergies: "",
          medications: "",
          assignedBed: "",
        });
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Re-Admit Patient</DialogTitle>
            <DialogDescription>
              Patient found with UHID: {foundPatient?.uhid}. Update details for re-admission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            {foundPatient && (
              <div className="bg-gray-900 border-2 border-white rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Previous Patient Details:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-white">
                  <div><strong>Name:</strong> {foundPatient.name}</div>
                  <div><strong>Age:</strong> {foundPatient.age} years</div>
                  <div><strong>Gender:</strong> {foundPatient.gender}</div>
                  <div><strong>Phone:</strong> {foundPatient.phone}</div>
                  <div><strong>Blood Group:</strong> {foundPatient.bloodGroup}</div>
                  <div><strong>Last Diagnosis:</strong> {foundPatient.diagnosis}</div>
                  {foundPatient.admissionHistory && foundPatient.admissionHistory.length > 0 && (
                    <div className="col-span-2 mt-2">
                      <strong>Previous Admissions:</strong> {foundPatient.admissionHistory.length}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-400">
              You can update the information below or keep the existing details. Only fill in the fields you want to change.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Name</label>
                <Input
                  placeholder={foundPatient?.name}
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Age</label>
                <Input
                  type="number"
                  placeholder={foundPatient?.age?.toString()}
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Phone</label>
                <Input
                  placeholder={foundPatient?.phone}
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Diagnosis</label>
                <Input
                  placeholder={foundPatient?.diagnosis}
                  value={newPatient.diagnosis}
                  onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Medications</label>
                <Input
                  placeholder={foundPatient?.medications}
                  value={newPatient.medications}
                  onChange={(e) => setNewPatient({ ...newPatient, medications: e.target.value })}
                  className="bg-black text-white border-2 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Assign Bed</label>
                <select
                  value={newPatient.assignedBed}
                  onChange={(e) => setNewPatient({ ...newPatient, assignedBed: e.target.value })}
                  className="w-full h-10 rounded-md bg-black text-white border-2 border-gray-700 px-3 py-2"
                >
                  <option value="">Select a bed (optional)</option>
                  {availableBeds.map((bed) => (
                    <option key={bed.id} value={bed.bedNumber}>
                      {bed.bedNumber} ({bed.ward})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowReAdmitDialog(false);
                setFoundPatient(null);
                setNewPatient({
                  uhid: "",
                  name: "",
                  age: "",
                  gender: "Male",
                  phone: "",
                  email: "",
                  address: "",
                  bloodGroup: "A+",
                  emergencyContact: "",
                  diagnosis: "",
                  allergies: "",
                  medications: "",
                  assignedBed: "",
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleReAdmitPatient} className="bg-white hover:bg-gray-200 text-black font-semibold">
                Re-Admit Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
