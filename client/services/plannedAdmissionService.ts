/**
 * Planned Admission Service
 * Handles all API calls for planned admission workflow
 */

import apiClient from '../config/api';

// Types
export interface MedicalProcedure {
    id: number;
    name: string;
    category: string;
    category_display: string;
    description: string;
    typical_duration: string;
    recovery_time: string;
    estimated_cost_min: number;
    estimated_cost_max: number;
    cost_range: string;
    requires_overnight_stay: boolean;
    pre_requirements: string;
    is_active: boolean;
}

export interface ProcedureCategory {
    value: string;
    label: string;
    count: number;
}

export interface Hospital {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    available_general_beds: number;
    available_icu_beds: number;
    accepts_insurance: boolean;
    insurance_providers: string;
    estimated_emergency_cost: number;
    estimated_general_admission_cost: number;
}

export interface AITriageResult {
    urgency: 'critical' | 'urgent' | 'moderate' | 'low';
    confidence: number;
    recommendation: string;
    findings: string[];
    next_steps: string[];
    disclaimer: string;
}

export interface PlannedAdmission {
    id: number;
    user_name: string;
    hospital: Hospital | null;
    doctor_name: string | null;
    admission_type: string;
    admission_type_display: string;
    procedure_category: string;
    procedure_category_display: string;
    procedure_name: string;
    symptoms: string;
    preferred_date: string | null;
    alternate_date: string | null;
    flexible_dates: boolean;
    scheduled_date: string | null;
    scheduled_time: string | null;
    status: string;
    status_display: string;
    estimated_cost: number;
    estimated_insurance_coverage: number;
    estimated_out_of_pocket: number;
    ai_triage_result: AITriageResult | null;
    ai_recommended_urgency: string;
    ai_confidence_score: number | null;
    pre_admission_checklist: PreAdmissionChecklist;
    checklist_completion: number;
    doctor_notes: string;
    patient_notes: string;
    cancellation_reason: string;
    created_at: string;
    updated_at: string;
}

export interface PreAdmissionChecklist {
    medical_tests: ChecklistItem[];
    documents: ChecklistItem[];
    medications: ChecklistItem[];
    instructions: ChecklistItem[];
}

export interface ChecklistItem {
    name: string;
    completed?: boolean;
    uploaded?: boolean;
    acknowledged?: boolean;
    due_date?: string;
    instruction?: string;
    description?: string;
}

export interface CreatePlannedAdmissionData {
    admission_type: 'surgery' | 'treatment' | 'diagnostic' | 'specialist' | 'other';
    procedure_category?: string;
    procedure_name?: string;
    symptoms?: string;
    hospital_id?: number;
    preferred_date?: string;
    alternate_date?: string;
    flexible_dates?: boolean;
    patient_notes?: string;
}

export interface UpdatePlannedAdmissionData {
    hospital_id?: number;
    procedure_category?: string;
    procedure_name?: string;
    symptoms?: string;
    preferred_date?: string;
    alternate_date?: string;
    flexible_dates?: boolean;
    patient_notes?: string;
}

// Service functions
const plannedAdmissionService = {
    /**
     * Get all procedure categories
     */
    async getProcedureCategories(): Promise<ProcedureCategory[]> {
        const response = await apiClient.get('/healthcare/procedures/categories/');
        return response.data;
    },

    /**
     * Get procedures by category
     */
    async getProceduresByCategory(category: string): Promise<MedicalProcedure[]> {
        const response = await apiClient.get('/healthcare/procedures/by_category/', {
            params: { category }
        });
        return response.data;
    },

    /**
     * Search procedures
     */
    async searchProcedures(query: string): Promise<MedicalProcedure[]> {
        const response = await apiClient.get('/healthcare/procedures/search/', {
            params: { q: query }
        });
        return response.data;
    },

    /**
     * Get all procedures
     */
    async getAllProcedures(): Promise<MedicalProcedure[]> {
        const response = await apiClient.get('/healthcare/procedures/');
        return response.data;
    },

    /**
     * Create a new planned admission
     */
    async createPlannedAdmission(data: CreatePlannedAdmissionData): Promise<PlannedAdmission> {
        const response = await apiClient.post('/healthcare/planned-admissions/', data);
        return response.data;
    },

    /**
     * Get all planned admissions for user
     */
    async getPlannedAdmissions(): Promise<PlannedAdmission[]> {
        const response = await apiClient.get('/healthcare/planned-admissions/');
        return response.data;
    },

    /**
     * Get active planned admissions
     */
    async getActivePlannedAdmissions(): Promise<PlannedAdmission[]> {
        const response = await apiClient.get('/healthcare/planned-admissions/active/');
        return response.data;
    },

    /**
     * Get a specific planned admission
     */
    async getPlannedAdmission(id: number): Promise<PlannedAdmission> {
        const response = await apiClient.get(`/healthcare/planned-admissions/${id}/`);
        return response.data;
    },

    /**
     * Update a planned admission
     */
    async updatePlannedAdmission(id: number, data: UpdatePlannedAdmissionData): Promise<PlannedAdmission> {
        const response = await apiClient.put(`/healthcare/planned-admissions/${id}/`, data);
        return response.data;
    },

    /**
     * Cancel a planned admission
     */
    async cancelPlannedAdmission(id: number, reason?: string): Promise<void> {
        await apiClient.delete(`/healthcare/planned-admissions/${id}/`, {
            data: { cancellation_reason: reason }
        });
    },

    /**
     * Update checklist item
     */
    async updateChecklistItem(
        admissionId: number,
        category: 'medical_tests' | 'documents' | 'medications' | 'instructions',
        itemIndex: number,
        field: 'completed' | 'uploaded' | 'acknowledged',
        value: boolean
    ): Promise<{ message: string; checklist: PreAdmissionChecklist; completion_percentage: number }> {
        const response = await apiClient.post(`/healthcare/planned-admissions/${admissionId}/update_checklist/`, {
            category,
            item_index: itemIndex,
            field,
            value
        });
        return response.data;
    },

    /**
     * Get AI triage analysis
     */
    async getAITriage(symptoms: string, medicalHistory?: string, currentMedications?: string, admissionId?: number): Promise<AITriageResult> {
        const response = await apiClient.post('/healthcare/planned-admissions/ai_triage/', {
            symptoms,
            medical_history: medicalHistory,
            current_medications: currentMedications,
            admission_id: admissionId
        });
        return response.data;
    },

    /**
     * Get nearby hospitals for planned admission
     */
    async getNearbyHospitals(latitude: number, longitude: number, radiusKm: number = 50): Promise<Hospital[]> {
        // Round to 6 decimal places (backend serializer limit)
        const lat = Math.round(latitude * 1000000) / 1000000;
        const lng = Math.round(longitude * 1000000) / 1000000;
        
        const response = await apiClient.get('/healthcare/emergency/hospitals/nearby/', {
            params: {
                latitude: lat,
                longitude: lng,
                radius_km: radiusKm,
                show_all: true
            }
        });
        return response.data.hospitals || response.data;
    }
};

export default plannedAdmissionService;
