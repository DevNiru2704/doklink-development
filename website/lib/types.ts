/* =========================
   BASE / COMMON
========================= */

export interface BaseDocument {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/* =========================
   ENUM / UNION TYPES
========================= */

export type Gender = "Male" | "Female" | "Other";

export type BedStatus = "available" | "occupied" | "maintenance" | "reserved";

export type BedCategory =
  | "General"
  | "Semi-Private"
  | "Deluxe Cabin"
  | "Premium Cabin"
  | "ICU Bed"
  | "CCU Bed"
  | "Suite Room";

export type Floor = "Ground" | "1st" | "2nd" | "3rd" | "4th" | "5th";

export type Wing = "A" | "B" | "C" | "D";
export type Ward =
  | "General"
  | "ICU"
  | "Pediatric"
  | "Maternity"
  | "Emergency";

export type PatientStatus = "Waiting" | "Admitted" | "Discharged";

export type ClaimStatus = "Pending" | "Approved" | "Rejected" | "Partial";

export type ExpenseStatus = "Pending" | "Approved" | "Rejected";

export type DocumentType =
  | "Report"
  | "Prescription"
  | "Lab Result"
  | "Discharge Summary";

export type ActivityType = "admission" | "discharge" | "claim";

/* =========================
   BED
========================= */

export interface BedEquipment {
  hasMonitor: boolean;
  hasOxygen: boolean;
  hasVentilator: boolean;
}

export interface Bed extends BaseDocument {
  id?: string; // Add id for frontend use
  hospitalId: string; // Multi-tenant field (h1, h2, etc.)
  bedNumber: string;
  bedCategory: BedCategory;
  department?: string; // Optional department field, defaults to "NA"
  floor: Floor;
  wing: Wing;
  dailyRate: number; // in INR - Required
  equipment: BedEquipment;
  status: BedStatus;
  ward?: Ward; // Keeping for backward compatibility
  patientId?: string;
}

/* =========================
   PATIENT
========================= */

export interface AdmissionHistory {
  admissionDate: string;
  dischargeDate?: string;
  diagnosis: string;
  assignedBed?: string;
  medications?: string;
  notes?: string;
}

export interface Patient extends BaseDocument {
  id?: string; // Add id for frontend use
  hospitalId: string; // Multi-tenant field (h1, h2, etc.)
  uhid: string; // Unique Health ID for patient
  name: string;
  age: number;
  gender: Gender;
  admissionDate: Date;
  dischargeDate?: Date;
  diagnosis: string;
  assignedBed?: string;
  status: PatientStatus;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact: string;
  bloodGroup?: string;
  allergies?: string;
  medications?: string;
  admissionHistory?: AdmissionHistory[]; // Store previous admissions
}

/* =========================
   MEDICAL DOCUMENT
========================= */

export interface MedicalDocument extends BaseDocument {
  id?: string; // Add id for frontend use
  hospitalId: string; // Multi-tenant field (h1, h2, etc.)
  patientId: string;
  type: DocumentType;
  name: string;
  date: Date;
  url: string;
}

/* =========================
   DAILY EXPENSE
========================= */

export interface DailyExpense {
  _id?: string;
  date: Date;
  description: string;
  amount: number;
  status: ExpenseStatus;
  approvedAmount?: number;
  notes?: string;
}

/* =========================
   APPROVAL HISTORY
========================= */

export interface ApprovalHistory {
  _id?: string;
  date: Date;
  description: string;
  amount: number;
  status: ExpenseStatus;
}

/* =========================
   CLAIM / INSURANCE
========================= */

export interface Claim extends BaseDocument {
  hospitalId: string; // Multi-tenant field (h1, h2, etc.)
  patientId: string;
  patientName: string;
  policyNumber: string;
  insurer: string;
  claimAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  status: ClaimStatus;
  submissionDate: Date;
  diagnosis: string;
  treatment: string;
  expenses: DailyExpense[];
  approvalHistory: ApprovalHistory[];
}

/* =========================
   ACTIVITY LOG
========================= */

export interface Activity extends BaseDocument {
  hospitalId: string; // Multi-tenant field (h1, h2, etc.)
  type: ActivityType;
  description: string;
  referenceId?: string;
  time: Date;
}

/* =========================
   HOSPITAL (Multi-Tenant)
========================= */

export interface Hospital extends BaseDocument {
  name: string;
  code: string; // Auto-generated unique identifier from hospital name (DB-safe, used as database name)
  address: string;
  phone: string;
  email: string; // Must be unique across all hospitals
  isActive: boolean;
  logo?: string;
  registrationNumber?: string;
}

/* =========================
   USER / AUTH (NextAuth)
========================= */

// SuperAdmin: Can create hospitals and manage hospital admins
// HospitalAdmin: Can manage users within their hospital
// BasicUser: Regular hospital staff with limited permissions
export type UserRole = "SuperAdmin" | "HospitalAdmin" | "BasicUser";

export interface User extends BaseDocument {
  hospitalId?: string; // Optional for SuperAdmin (not tied to any hospital), format: h1, h2, etc.
  name: string;
  email: string; // Must be unique across all users in all hospitals
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
  permissions?: string[]; // Optional: granular permissions for BasicUser
}

/* =========================
   FRONTEND SAFE TYPES
   (Used after mapping _id → id)
========================= */

export interface UIEntity {
  id: string;
}

export type UIPatient = Patient & UIEntity;
export type UIBed = Bed & UIEntity;
export type UIClaim = Claim & UIEntity;
