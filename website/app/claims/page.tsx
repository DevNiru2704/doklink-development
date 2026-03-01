"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Bed, BedStatus, BedCategory, Floor, Wing } from "@/lib/types";
import { Plus, Filter, FileText, CheckCircle, XCircle, Clock, IndianRupee, Search, Eye, Building2, Calendar, TrendingUp, AlertCircle, RefreshCw, History } from "lucide-react";
import { format, parseISO } from "date-fns";

type VerificationStatus = "verified" | "pending" | "rejected" | "approved";
type ExpenseCategory = "room" | "medication" | "procedure" | "consultation" | "lab" | "other";
type ClaimStatus = "pending" | "under_review" | "approved" | "rejected" | "partial";
type ExpenseStatus = "pending" | "approved" | "rejected";

interface DailyExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  approvalStatus: ExpenseStatus;
  approvedAmount?: number;
  insuranceRemarks?: string;
  notes?: string;
}

interface ApprovalHistory {
  id: string;
  date: string;
  status: ExpenseStatus | "partial";
  approvedAmount: number;
  requestedAmount: number;
  remarks: string;
}

interface VerificationDetails {
  documentVerification: VerificationStatus;
  medicalNecessity: VerificationStatus;
  policyValidation: VerificationStatus;
  preAuthStatus: VerificationStatus;
}

interface Claim {
  id: string;
  patientName: string;
  patientId: string;
  mrNumber: string;
  policyNumber: string;
  insurer: string;
  claimAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  status: ClaimStatus;
  submissionDate: string;
  diagnosis: string;
  treatment: string;
  department: string;
  admissionDate: string;
  dischargeDate?: string;
  remarks?: string;
  verificationDetails: VerificationDetails;
  expenses: DailyExpense[];
  approvalHistory: ApprovalHistory[];
}

interface Patient {
  id: string;
  name: string;
  uhid: string;
  diagnosis: string;
  status: string;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [selectedClaimForExpense, setSelectedClaimForExpense] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [expenseView, setExpenseView] = useState<"daily" | "history">("daily");
  
  const [newClaim, setNewClaim] = useState({
    patientId: "",
    policyNumber: "",
    insurer: "",
    claimAmount: "",
    diagnosis: "",
    treatment: "",
    department: "",
  });

  const [newExpense, setNewExpense] = useState({
    claimId: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    category: "room" as ExpenseCategory,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [claimsRes, patientsRes] = await Promise.all([
        fetch("/api/claims"),
        fetch("/api/patients"),
      ]);
      
      const claimsData = await claimsRes.json();
      const patientsData = await patientsRes.json();
      
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setClaims([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  const handleAddClaim = async () => {
    try {
      if (!newClaim.patientId?.trim() || !newClaim.policyNumber?.trim() || !newClaim.insurer?.trim()) {
        alert("Please fill in all required fields");
        return;
      }

      const selectedPatient = patients.find(p => p.id === newClaim.patientId);
      if (!selectedPatient) {
        alert("Selected patient not found");
        return;
      }

      const claimData = {
        patientName: selectedPatient.name,
        patientId: newClaim.patientId,
        mrNumber: selectedPatient.uhid,
        policyNumber: newClaim.policyNumber,
        insurer: newClaim.insurer,
        claimAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
        status: "pending" as ClaimStatus,
        submissionDate: new Date().toISOString(),
        diagnosis: newClaim.diagnosis || selectedPatient.diagnosis,
        treatment: newClaim.treatment,
        department: newClaim.department || "General",
        admissionDate: new Date().toISOString(),
        verificationDetails: {
          documentVerification: "pending" as VerificationStatus,
          medicalNecessity: "pending" as VerificationStatus,
          policyValidation: "pending" as VerificationStatus,
          preAuthStatus: "pending" as VerificationStatus,
        },
        expenses: [],
        approvalHistory: [
          {
            id: `HIST-${Date.now()}`,
            date: new Date().toISOString(),
            status: "pending" as ExpenseStatus,
            approvedAmount: 0,
            requestedAmount: parseFloat(newClaim.claimAmount),
            remarks: "Claim submitted for review",
          },
        ],
      };

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimData),
      });

      if (!response.ok) throw new Error("Failed to create claim");

      const addedClaim = await response.json();
      setClaims([...claims, addedClaim]);

      setNewClaim({
        patientId: "",
        policyNumber: "",
        insurer: "",
        claimAmount: "",
        diagnosis: "",
        treatment: "",
        department: "",
      });
      setShowAddDialog(false);
      alert("Claim created successfully!");
    } catch (error) {
      console.error("Error creating claim:", error);
      alert("Failed to create claim. Please try again.");
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!newExpense.claimId || !newExpense.description || !newExpense.amount) {
        alert("Please fill in all required fields");
        return;
      }

      const claim = claims.find(c => c.id === newExpense.claimId);
      if (!claim) {
        alert("Claim not found");
        return;
      }

      const expense: DailyExpense = {
        id: `EXP-${Date.now()}`,
        date: newExpense.date,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        approvalStatus: "pending",
        notes: newExpense.notes,
      };

      const updatedClaim = {
        ...claim,
        expenses: [...claim.expenses, expense],
        claimAmount: claim.claimAmount + expense.amount,
        pendingAmount: claim.pendingAmount + expense.amount,
      };

      const response = await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClaim),
      });

      if (!response.ok) throw new Error("Failed to add expense");

      const updated = await response.json();
      setClaims(claims.map(c => c.id === updated.id ? updated : c));
      
      setNewExpense({
        claimId: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        category: "room",
        notes: "",
      });
      setShowAddExpense(false);
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense. Please try again.");
    }
  };

  const handleUpdateClaimStatus = async (claimId: string, newStatus: ClaimStatus) => {
    try {
      const claim = claims.find(c => c.id === claimId);
      if (!claim) return;

      const updatedClaim = {
        ...claim,
        status: newStatus,
      };

      const response = await fetch("/api/claims", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClaim),
      });

      if (!response.ok) throw new Error("Failed to update claim");

      const updated = await response.json();
      setClaims(claims.map(c => c.id === updated.id ? updated : c));
      alert("Claim status updated successfully!");
    } catch (error) {
      console.error("Error updating claim:", error);
      alert("Failed to update claim status.");
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = 
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && claim.status === activeTab;
  });

  const stats = {
    total: claims.length,
    approved: claims.filter((c) => c.status === "approved").length,
    pending: claims.filter((c) => c.status === "pending" || c.status === "under_review").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
    totalAmount: claims.reduce((sum, c) => sum + c.claimAmount, 0),
    approvedAmount: claims.reduce((sum, c) => sum + c.approvedAmount, 0),
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const styles = {
      approved: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-black",
      under_review: "bg-blue-500 text-white",
      rejected: "bg-red-500 text-white",
      partial: "bg-orange-500 text-white",
    };
    const labels = {
      approved: "Approved",
      pending: "Pending",
      under_review: "Under Review",
      rejected: "Rejected",
      partial: "Partial",
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getExpenseStatusBadge = (status: ExpenseStatus) => {
    const styles = {
      approved: "bg-green-500 text-white text-xs",
      pending: "bg-yellow-500 text-black text-xs",
      rejected: "bg-red-500 text-white text-xs",
    };
    return <Badge className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getVerificationIcon = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    const labels = {
      room: "Room Charges",
      medication: "Medication",
      procedure: "Procedure",
      consultation: "Consultation",
      lab: "Lab Tests",
      other: "Other",
    };
    return labels[category];
  };

  const groupExpensesByDate = (expenses: DailyExpense[]) => {
    const grouped: Record<string, DailyExpense[]> = {};
    expenses.forEach((expense) => {
      if (!grouped[expense.date]) {
        grouped[expense.date] = [];
      }
      grouped[expense.date].push(expense);
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-white">Insurance & Claims</h1>
          <p className="text-gray-400 mt-2 text-lg">Manage insurance claims, approvals, and reimbursements</p>
        </div>
        <div className="flex gap-3">

          <Button onClick={() => setShowAddDialog(true)} className="bg-white hover:bg-gray-200 text-black shadow-lg font-semibold">
            <Plus className="h-5 w-5 mr-2" />
            Create Claim
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-blue-500/30 bg-blue-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Claims</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/30 bg-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-500/30 bg-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved Amount</p>
                <p className="text-2xl font-bold text-white mt-1">₹{stats.approvedAmount.toLocaleString()}</p>
              </div>
              <IndianRupee className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-2 border-white shadow-lg bg-black">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, claim ID, policy number, or insurer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-white/20 focus:border-white bg-black text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-white shadow-lg bg-black">
        <CardHeader className="bg-black text-white border-b-2 border-white">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-black">
                All Claims ({claims.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                Pending ({claims.filter(c => c.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="under_review" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Under Review ({claims.filter(c => c.status === "under_review").length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Approved ({claims.filter(c => c.status === "approved").length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                Rejected ({claims.filter(c => c.status === "rejected").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No claims found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-white/20">
                  <TableHead className="text-white">Patient</TableHead>
                  <TableHead className="text-white">MR Number</TableHead>
                  <TableHead className="text-white">Policy Number</TableHead>
                  <TableHead className="text-white">Insurer</TableHead>
                  <TableHead className="text-right text-white">Claim Amount</TableHead>
                  <TableHead className="text-right text-white">Approved</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Submitted</TableHead>
                  <TableHead className="text-white">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{claim.patientName}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-400">{claim.mrNumber}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-400">{claim.policyNumber}</TableCell>
                    <TableCell className="text-gray-300">{claim.insurer}</TableCell>
                    <TableCell className="text-right font-bold text-white">
                      ₹{claim.claimAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-500">
                      ₹{claim.approvedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {claim.submissionDate ? format(parseISO(claim.submissionDate), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClaim(claim)}
                          className="hover:bg-white/10 hover:text-white text-gray-300"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClaimForExpense(claim.id);
                            setNewExpense({ ...newExpense, claimId: claim.id });
                            setShowAddExpense(true);
                          }}
                          className="hover:bg-green-500/20 hover:text-green-400 text-gray-300"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Expense
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-black border-2 border-white text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-2xl">Claim Details - {selectedClaim?.patientName}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Claim ID: {selectedClaim?.id} | Policy: {selectedClaim?.policyNumber}
                </DialogDescription>
              </div>
              {selectedClaim && getStatusBadge(selectedClaim.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {selectedClaim?.verificationDetails && (
              <div className="grid grid-cols-4 gap-4 border-2 border-white/20 rounded-lg p-4 bg-white/5">
                <div className="flex items-center gap-2">
                  {getVerificationIcon(selectedClaim.verificationDetails.documentVerification)}
                  <div>
                    <p className="text-xs text-gray-400">Document Verification</p>
                    <p className="text-sm font-medium text-white capitalize">
                      {selectedClaim.verificationDetails.documentVerification}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getVerificationIcon(selectedClaim.verificationDetails.medicalNecessity)}
                  <div>
                    <p className="text-xs text-gray-400">Medical Necessity</p>
                    <p className="text-sm font-medium text-white capitalize">
                      {selectedClaim.verificationDetails.medicalNecessity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getVerificationIcon(selectedClaim.verificationDetails.policyValidation)}
                  <div>
                    <p className="text-xs text-gray-400">Policy Validation</p>
                    <p className="text-sm font-medium text-white capitalize">
                      {selectedClaim.verificationDetails.policyValidation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getVerificationIcon(selectedClaim.verificationDetails.preAuthStatus)}
                  <div>
                    <p className="text-xs text-gray-400">Pre-Auth Status</p>
                    <p className="text-sm font-medium text-white capitalize">
                      {selectedClaim.verificationDetails.preAuthStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 border-2 border-white/20 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-white">Claim Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <Building2 className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-gray-400">Insurance Provider</p>
                      <p className="font-medium text-white">{selectedClaim?.insurer}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-gray-400">Admission Date</p>
                      <p className="font-medium text-white">
                        {selectedClaim?.admissionDate && format(parseISO(selectedClaim.admissionDate), "PPP")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-gray-400">Department</p>
                      <p className="font-medium text-white">{selectedClaim?.department}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    <div>
                      <p className="text-gray-400">Treatment</p>
                      <p className="font-medium text-white">{selectedClaim?.treatment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-2 border-white/20 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-white">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <span className="text-sm font-medium text-white">Total Claim Amount</span>
                    <span className="text-lg font-bold text-blue-400">
                      ₹{selectedClaim?.claimAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <span className="text-sm font-medium text-white">Approved Amount</span>
                    <span className="text-lg font-bold text-green-400">
                      ₹{selectedClaim?.approvedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <span className="text-sm font-medium text-white">Pending Amount</span>
                    <span className="text-lg font-bold text-yellow-400">
                      ₹{selectedClaim?.pendingAmount.toLocaleString()}
                    </span>
                  </div>
                  {selectedClaim && selectedClaim.rejectedAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <span className="text-sm font-medium text-white">Rejected Amount</span>
                      <span className="text-lg font-bold text-red-400">
                        ₹{selectedClaim.rejectedAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedClaim && selectedClaim.expenses.length > 0 && (
              <div className="border-2 border-white/20 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center text-white">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Expense Breakdown Summary
                </h3>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      ₹{selectedClaim.claimAmount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <Progress value={100} className="h-2 bg-white/20" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Approved</p>
                    <p className="text-2xl font-bold text-green-400">
                      ₹{selectedClaim.approvedAmount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <Progress
                        value={(selectedClaim.approvedAmount / selectedClaim.claimAmount) * 100}
                        className="h-2 bg-white/20 [&>div]:bg-green-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {((selectedClaim.approvedAmount / selectedClaim.claimAmount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      ₹{selectedClaim.pendingAmount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <Progress
                        value={(selectedClaim.pendingAmount / selectedClaim.claimAmount) * 100}
                        className="h-2 bg-white/20 [&>div]:bg-yellow-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {((selectedClaim.pendingAmount / selectedClaim.claimAmount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Rejected</p>
                    <p className="text-2xl font-bold text-red-400">
                      ₹{selectedClaim.rejectedAmount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <Progress
                        value={(selectedClaim.rejectedAmount / selectedClaim.claimAmount) * 100}
                        className="h-2 bg-white/20 [&>div]:bg-red-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {((selectedClaim.rejectedAmount / selectedClaim.claimAmount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white/10 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">Patient Liability (Remaining Amount)</span>
                    <span className="text-xl font-bold text-white">
                      ₹{(selectedClaim.claimAmount - selectedClaim.approvedAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedClaim && selectedClaim.expenses.length > 0 && (
              <div className="border-2 border-white/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-white">Expense Details</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={expenseView === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpenseView("daily")}
                      className={expenseView === "daily" ? "bg-white text-black" : "border-white text-white hover:bg-white/10"}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Daily Expenses
                    </Button>
                    <Button
                      variant={expenseView === "history" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpenseView("history")}
                      className={expenseView === "history" ? "bg-white text-black" : "border-white text-white hover:bg-white/10"}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Approval History
                    </Button>
                  </div>
                </div>

                {expenseView === "daily" ? (
                  <div className="space-y-4">
                    {Object.entries(groupExpensesByDate(selectedClaim.expenses)).map(([date, expenses]) => (
                      <div key={date} className="border border-white/10 rounded-lg p-4 bg-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {date ? format(parseISO(date), "EEEE, MMMM dd, yyyy") : "Unknown Date"}
                          </h4>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Daily Total</p>
                            <p className="font-bold text-white">
                              ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {expenses.map((expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-black/50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {expense.approvalStatus === "approved" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : expense.approvalStatus === "rejected" ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-yellow-500" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-white">{expense.description}</p>
                                    <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                                      {getCategoryLabel(expense.category)}
                                    </Badge>
                                  </div>
                                  {expense.insuranceRemarks && (
                                    <p className="text-xs text-orange-400 mt-1 flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      {expense.insuranceRemarks}
                                    </p>
                                  )}
                                  {expense.notes && (
                                    <p className="text-xs text-gray-500 mt-1">{expense.notes}</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <p className="font-bold text-white">₹{expense.amount.toLocaleString()}</p>
                                  {expense.approvedAmount !== undefined && expense.approvedAmount !== expense.amount && (
                                    <p className="text-sm text-green-400">
                                      Approved: ₹{expense.approvedAmount.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                                {getExpenseStatusBadge(expense.approvalStatus)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedClaim.approvalHistory.map((history, index) => (
                      <div key={history.id} className="flex items-start space-x-4">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                              history.status === "approved"
                                ? "bg-green-500/20 border-green-500"
                                : history.status === "rejected"
                                ? "bg-red-500/20 border-red-500"
                                : history.status === "partial"
                                ? "bg-orange-500/20 border-orange-500"
                                : "bg-yellow-500/20 border-yellow-500"
                            }`}
                          >
                            {history.status === "approved" ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : history.status === "rejected" ? (
                              <XCircle className="h-5 w-5 text-red-400" />
                            ) : history.status === "partial" ? (
                              <AlertCircle className="h-5 w-5 text-orange-400" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-400" />
                            )}
                          </div>
                          {index < selectedClaim.approvalHistory.length - 1 && (
                            <div className="absolute left-1/2 top-10 w-0.5 h-12 bg-white/20 -translate-x-1/2" />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-white">{history.remarks}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {history.date ? format(parseISO(history.date), "PPP") : "Unknown Date"}
                                </p>
                              </div>
                              <Badge
                                className={`ml-4 ${
                                  history.status === "approved"
                                    ? "bg-green-500"
                                    : history.status === "rejected"
                                    ? "bg-red-500"
                                    : history.status === "partial"
                                    ? "bg-orange-500"
                                    : "bg-yellow-500"
                                } text-white`}
                              >
                                {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/10">
                              <div>
                                <p className="text-xs text-gray-400">Requested Amount</p>
                                <p className="text-lg font-bold text-white">
                                  ₹{history.requestedAmount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Approved Amount</p>
                                <p className={`text-lg font-bold ${
                                  history.approvedAmount > 0 ? "text-green-400" : "text-gray-400"
                                }`}>
                                  ₹{history.approvedAmount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedClaim?.remarks && (
              <div className="border-2 border-orange-500/30 bg-orange-500/10 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Important Notes</h4>
                    <p className="text-gray-300">{selectedClaim.remarks}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 pt-6 border-t-2 border-white/20">
              <div className="flex gap-2">
                {selectedClaim?.status === "pending" && (
                  <>
                    <Button
                      onClick={() => selectedClaim && handleUpdateClaimStatus(selectedClaim.id, "under_review")}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mark Under Review
                    </Button>
                    <Button
                      onClick={() => selectedClaim && handleUpdateClaimStatus(selectedClaim.id, "approved")}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Claim
                    </Button>
                  </>
                )}
                {selectedClaim?.status === "under_review" && (
                  <>
                    <Button
                      onClick={() => selectedClaim && handleUpdateClaimStatus(selectedClaim.id, "approved")}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => selectedClaim && handleUpdateClaimStatus(selectedClaim.id, "partial")}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Partial Approval
                    </Button>
                    <Button
                      onClick={() => selectedClaim && handleUpdateClaimStatus(selectedClaim.id, "rejected")}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedClaim(null)}
                className="border-2 border-white hover:bg-white hover:text-black text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border-2 border-white text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Claim</DialogTitle>
            <DialogDescription className="text-gray-400">Submit a new insurance claim</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Patient *</label>
                <select
                  value={newClaim.patientId}
                  onChange={(e) => setNewClaim({ ...newClaim, patientId: e.target.value })}
                  className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="">Select Patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} ({patient.uhid})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Policy Number *</label>
                <Input
                  placeholder="POL-XXXX-XXX"
                  value={newClaim.policyNumber}
                  onChange={(e) => setNewClaim({ ...newClaim, policyNumber: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Insurance Provider *</label>
                <Input
                  placeholder="Insurance company name"
                  value={newClaim.insurer}
                  onChange={(e) => setNewClaim({ ...newClaim, insurer: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Department</label>
                <Input
                  placeholder="e.g., Cardiology, Orthopedics"
                  value={newClaim.department}
                  onChange={(e) => setNewClaim({ ...newClaim, department: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Diagnosis</label>
                <Input
                  placeholder="Enter diagnosis (optional)"
                  value={newClaim.diagnosis}
                  onChange={(e) => setNewClaim({ ...newClaim, diagnosis: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block text-white">Treatment Details</label>
                <Input
                  placeholder="Describe treatment provided"
                  value={newClaim.treatment}
                  onChange={(e) => setNewClaim({ ...newClaim, treatment: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-white/20">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-2 border-white hover:bg-white hover:text-black text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleAddClaim} className="bg-white hover:bg-gray-200 text-black font-semibold">
                Create Claim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddExpense} onOpenChange={(open) => {
        setShowAddExpense(open);
        if (!open) {
          setSelectedClaimForExpense(null);
          setNewExpense({
            claimId: "",
            date: new Date().toISOString().split('T')[0],
            description: "",
            amount: "",
            category: "room" as ExpenseCategory,
            notes: "",
          });
        }
      }}>
        <DialogContent className="max-w-2xl bg-black border-2 border-white text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Daily Expense</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedClaimForExpense 
                ? `Adding expense for ${claims.find(c => c.id === selectedClaimForExpense)?.patientName} (${claims.find(c => c.id === selectedClaimForExpense)?.insurer})`
                : "Add a new expense to an existing claim"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Date *</label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Category *</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                  className="w-full h-10 rounded-md border-2 border-white/20 focus:border-white bg-black text-white px-3 py-2"
                >
                  <option value="room">Room Charges</option>
                  <option value="medication">Medication</option>
                  <option value="procedure">Procedure</option>
                  <option value="consultation">Consultation</option>
                  <option value="lab">Lab Tests</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Description *</label>
                <Input
                  placeholder="e.g., ICU Room Charges"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block text-white">Amount (₹) *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block text-white">Notes (Optional)</label>
                <Input
                  placeholder="Additional notes or comments"
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="border-2 border-white/20 focus:border-white bg-black text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t-2 border-white/20">
              <Button
                variant="outline"
                onClick={() => setShowAddExpense(false)}
                className="border-2 border-white hover:bg-white hover:text-black text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleAddExpense} className="bg-white hover:bg-gray-200 text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}