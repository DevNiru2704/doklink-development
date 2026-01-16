// services/emergencyService.ts
// Service layer for emergency booking functionality

import apiClient from '../config/api';
import {
    EmergencyTriggerRequest,
    EmergencyTriggerResponse,
    NearbyHospitalResponse,
    EmergencyBookingRequest,
    EmergencyBooking,
    BookingStatusUpdate,
    BedAvailability,
    Location,
} from '../utils/emergency/types';

class EmergencyService {
    /**
     * Trigger emergency and get nearby hospitals
     */
    async triggerEmergency(
        location: Location,
        radius: number = 5
    ): Promise<NearbyHospitalResponse[]> {
        try {
            const response = await apiClient.post<EmergencyTriggerResponse>(
                '/healthcare/emergency/trigger/',
                {
                    location,
                    radius,
                }
            );
            return response.data.nearby_hospitals;
        } catch (error) {
            console.error('Error triggering emergency:', error);
            throw error;
        }
    }

    /**
     * Get nearby hospitals based on user location
     */
    async getNearbyHospitals(
        latitude: number,
        longitude: number,
        radius: number = 5
    ): Promise<NearbyHospitalResponse[]> {
        try {
            const response = await apiClient.get<NearbyHospitalResponse[]>(
                '/healthcare/hospitals/nearby/',
                {
                    params: {
                        latitude,
                        longitude,
                        radius,
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching nearby hospitals:', error);
            throw error;
        }
    }

    /**
     * Get bed availability for a specific hospital
     */
    async getBedAvailability(hospitalId: number): Promise<BedAvailability> {
        try {
            const response = await apiClient.get<BedAvailability>(
                `/healthcare/hospitals/${hospitalId}/beds/`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching bed availability:', error);
            throw error;
        }
    }

    /**
     * Book an emergency bed at a hospital
     */
    async bookEmergencyBed(
        bookingData: EmergencyBookingRequest
    ): Promise<EmergencyBooking> {
        try {
            const response = await apiClient.post<EmergencyBooking>(
                '/healthcare/emergency/book-bed/',
                bookingData
            );
            return response.data;
        } catch (error) {
            console.error('Error booking emergency bed:', error);
            throw error;
        }
    }

    /**
     * Get booking details
     */
    async getBooking(bookingId: number): Promise<EmergencyBooking> {
        try {
            const response = await apiClient.get<EmergencyBooking>(
                `/healthcare/emergency/booking/${bookingId}/`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching booking details:', error);
            throw error;
        }
    }

    /**
     * Update booking status
     */
    async updateBookingStatus(
        bookingId: number,
        status: BookingStatusUpdate['status'],
        notes?: string
    ): Promise<EmergencyBooking> {
        try {
            const response = await apiClient.put<EmergencyBooking>(
                `/healthcare/emergency/booking/${bookingId}/status/`,
                {
                    status,
                    notes,
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(
        bookingId: number,
        reason?: string
    ): Promise<EmergencyBooking> {
        try {
            return await this.updateBookingStatus(bookingId, 'cancelled', reason);
        } catch (error) {
            console.error('Error cancelling booking:', error);
            throw error;
        }
    }

    /**
     * Mark patient as arrived
     */
    async markPatientArrived(bookingId: number): Promise<EmergencyBooking> {
        try {
            return await this.updateBookingStatus(
                bookingId,
                'arrived',
                'Patient has arrived at the hospital'
            );
        } catch (error) {
            console.error('Error marking patient as arrived:', error);
            throw error;
        }
    }

    /**
     * Get active booking for current user
     */
    async getActiveBooking(): Promise<EmergencyBooking | null> {
        try {
            const response = await apiClient.get<EmergencyBooking[]>(
                '/healthcare/bookings/',
                {
                    params: {
                        status: 'reserved,confirmed,patient_arrived',
                        booking_type: 'emergency',
                        limit: 1,
                    },
                }
            );
            return response.data.length > 0 ? response.data[0] : null;
        } catch (error) {
            console.error('Error fetching active booking:', error);
            return null;
        }
    }

    /**
     * Get booking history for current user
     */
    async getBookingHistory(): Promise<EmergencyBooking[]> {
        try {
            const response = await apiClient.get<EmergencyBooking[]>(
                '/healthcare/emergency/bookings/',
                {
                    params: {
                        ordering: '-created_at',
                    },
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching booking history:', error);
            throw error;
        }
    }

    /**
     * Calculate estimated arrival time based on distance
     * Simple estimation: distance / average speed
     */
    calculateEstimatedTime(distanceKm: number): number {
        // Assuming average speed of 30 km/h in city traffic
        const averageSpeed = 30;
        const timeInHours = distanceKm / averageSpeed;
        const timeInMinutes = Math.ceil(timeInHours * 60);
        return timeInMinutes;
    }

    /**
     * Format distance for display
     */
    formatDistance(distanceKm: number): string {
        if (distanceKm < 1) {
            return `${Math.round(distanceKm * 1000)} m`;
        }
        return `${distanceKm.toFixed(1)} km`;
    }

    /**
     * Format time for display
     */
    formatTime(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    /**
     * Check if hospital has available beds
     */
    hasAvailableBeds(hospital: NearbyHospitalResponse): boolean {
        const generalBeds = hospital.available_general_beds || 0;
        const icuBeds = hospital.available_icu_beds || 0;
        return generalBeds > 0 || icuBeds > 0;
    }

    /**
     * Get total available beds
     */
    getTotalAvailableBeds(hospital: NearbyHospitalResponse): number {
        const generalBeds = hospital.available_general_beds || 0;
        const icuBeds = hospital.available_icu_beds || 0;
        return generalBeds + icuBeds;
    }
}

export const emergencyService = new EmergencyService();
