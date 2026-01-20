// utils/emergency/types.ts
// TypeScript types and interfaces for emergency booking system

export interface Location {
    latitude: number;
    longitude: number;
}

export interface InsuranceProvider {
    id: number;
    name: string;
    provider_code: string;
    is_in_network: boolean;
    copay_amount: string;
}

export interface Hospital {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    pin_code: string;
    phone_number?: string;
    email?: string;
    website?: string;
    latitude: number;
    longitude: number;
    distance?: number; // Distance in km from user's location
    estimated_time?: number; // Estimated travel time in minutes

    // Bed availability
    total_general_beds?: number;
    available_general_beds?: number;
    total_icu_beds?: number;
    available_icu_beds?: number;

    // Insurance
    accepts_insurance?: boolean;
    insurance_providers?: string;
    accepted_insurance_providers?: InsuranceProvider[];

    // Cost estimation
    estimated_emergency_cost?: number;
    estimated_general_admission_cost?: number;

    created_at?: string;
    updated_at?: string;
}

export interface NearbyHospitalResponse extends Hospital {
    distance: number;
    available_beds?: number;
    accepts_insurance?: boolean;
    total_vacancy: number;
    insurance_match: boolean;
    priority_score: number;
    recommended?: boolean;
}

export interface BedAvailability {
    hospital_id: number;
    general_beds: {
        total: number;
        available: number;
        occupied: number;
    };
    icu_beds: {
        total: number;
        available: number;
        occupied: number;
    };
    last_updated: string;
}

export interface EmergencyBookingRequest {
    hospital_id: number;
    emergency_type: string;
    bed_type?: 'general' | 'icu';
    patient_name?: string;
    patient_condition?: string;
    contact_person?: string;
    contact_phone?: string;
    arrival_time?: string;
    user_location?: Location;
    insurance_provider?: string;
    policy_number?: string;
    notes?: string;
    estimated_arrival_minutes?: number;
}

export interface EmergencyBooking {
    id: number;
    hospital: Hospital;
    booking_type: 'emergency';
    emergency_type: string;
    patient_name?: string;
    patient_condition?: string;
    contact_person?: string;
    contact_phone?: string;
    status: 'reserved' | 'patient_on_way' | 'arrived' | 'admitted' | 'discharged' | 'cancelled' | 'expired';
    arrival_time?: string;
    booking_date: string;
    booking_time: string;
    reservation_expires_at?: string;
    location_details?: string;
    notes?: string;
    created_at: string;
    updated_at: string;

    // Display properties (may be returned from API)
    status_display?: string;
    emergency_type_display?: string;
    bed_type?: string;
    bed_type_display?: string;
    estimated_arrival_minutes?: number;
    admission_time?: string;

    // Financial tracking fields (Phase 2)
    discharge_date?: string;
    total_bill_amount?: string;
    insurance_approved_amount?: string;
    out_of_pocket_amount?: string;
}

export interface BookingStatusUpdate {
    booking_id: number;
    status: 'reserved' | 'patient_on_way' | 'arrived' | 'admitted' | 'discharged' | 'cancelled' | 'expired';
    notes?: string;
}

export interface EmergencyTriggerRequest {
    location: Location;
    emergency_type?: string;
    radius?: number; // in km, default 5
}

export interface EmergencyTriggerResponse {
    nearby_hospitals: NearbyHospitalResponse[];
    user_location: Location;
    timestamp: string;
}

// Insurance related types
export interface Insurance {
    id: number;
    provider_name: string;
    policy_number: string;
    policy_expiry?: string;
    coverage_type?: string;
    is_active: boolean;
}

export interface InsuranceVerification {
    hospital_id: number;
    insurance_id: number;
    is_in_network: boolean;
    copay_amount?: number;
    estimated_coverage?: number;
    notes?: string;
}

// Emergency types
export const EMERGENCY_TYPES = [
    'Chest Pain',
    'Difficulty Breathing',
    'Severe Bleeding',
    'Head Injury',
    'Stroke Symptoms',
    'Severe Abdominal Pain',
    'Allergic Reaction',
    'Fracture/Trauma',
    'Other',
] as const;

export type EmergencyType = typeof EMERGENCY_TYPES[number];

// Booking status display
export const BOOKING_STATUS_DISPLAY: Record<string, string> = {
    reserved: 'Reserved',
    arrived: 'Arrived',
    admitted: 'Admitted',
    discharged: 'Discharged',
    cancelled: 'Cancelled',
    expired: 'Expired',
};

// Booking status colors
export const BOOKING_STATUS_COLORS: Record<string, string> = {
    reserved: '#FFA500', // Orange
    patient_on_way: '#10B981', // Green
    arrived: '#3B82F6', // Blue
    admitted: '#8B5CF6', // Purple
    cancelled: '#EF4444', // Red
    expired: '#6B7280', // Gray
};
