from rest_framework import serializers
from .models import Doctor, Hospital, Treatment, Booking, Payment, EmergencyBooking
from django.utils import timezone
from datetime import timedelta


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'specialization', 'phone_number', 'email']


class HospitalSerializer(serializers.ModelSerializer):
    # Calculated fields for emergency booking
    distance = serializers.FloatField(read_only=True, required=False)
    estimated_time = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'address', 'city', 'state', 'phone_number', 
            'latitude', 'longitude', 'total_general_beds', 'available_general_beds',
            'total_icu_beds', 'available_icu_beds', 'accepts_insurance',
            'insurance_providers', 'estimated_emergency_cost', 
            'estimated_general_admission_cost', 'distance', 'estimated_time'
        ]


class TreatmentSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    hospital = HospitalSerializer(read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id', 'treatment_name', 'doctor', 'hospital', 
            'started_date', 'expected_end_date', 'status', 'notes'
        ]


class BookingSerializer(serializers.ModelSerializer):
    hospital = HospitalSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    booking_type_display = serializers.CharField(source='get_booking_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'booking_type', 'booking_type_display', 'hospital', 'doctor',
            'booking_date', 'booking_time', 'status', 'status_display',
            'location_details', 'notes'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hospital = HospitalSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_type', 'payment_type_display', 'title', 
            'provider_name', 'amount', 'due_date', 'paid_date',
            'status', 'status_display', 'hospital', 'doctor', 'notes'
        ]


class DashboardSerializer(serializers.Serializer):
    """Optimized serializer for dashboard data"""
    ongoing_treatments = TreatmentSerializer(many=True, read_only=True)
    upcoming_bookings = BookingSerializer(many=True, read_only=True)
    upcoming_payments = PaymentSerializer(many=True, read_only=True)
    
    # Summary statistics
    total_treatments = serializers.IntegerField(read_only=True)
    total_bookings = serializers.IntegerField(read_only=True)
    total_pending_payments = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


class EmergencyBookingSerializer(serializers.ModelSerializer):
    """Serializer for emergency bed bookings"""
    hospital = HospitalSerializer(read_only=True)
    hospital_id = serializers.IntegerField(write_only=True)
    emergency_type_display = serializers.CharField(source='get_emergency_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    bed_type_display = serializers.CharField(source='get_bed_type_display', read_only=True)
    
    class Meta:
        model = EmergencyBooking
        fields = [
            'id', 'hospital', 'hospital_id', 'emergency_type', 'emergency_type_display',
            'bed_type', 'bed_type_display', 'patient_condition', 'contact_person',
            'contact_phone', 'status', 'status_display', 'reservation_expires_at',
            'arrival_time', 'admission_time', 'booking_latitude', 'booking_longitude',
            'estimated_arrival_minutes', 'notes', 'cancellation_reason', 'created_at'
        ]
        read_only_fields = ['reservation_expires_at', 'created_at']
    
    def create(self, validated_data):
        # Set reservation expiry time to 30 minutes from now
        validated_data['reservation_expires_at'] = timezone.now() + timedelta(minutes=30)
        return super().create(validated_data)


class EmergencyTriggerSerializer(serializers.Serializer):
    """Serializer for triggering emergency"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    emergency_type = serializers.ChoiceField(choices=EmergencyBooking.EMERGENCY_TYPE_CHOICES, required=False)


class NearbyHospitalSerializer(serializers.Serializer):
    """Serializer for fetching nearby hospitals"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    radius_km = serializers.FloatField(default=10.0, required=False)
    bed_type = serializers.ChoiceField(choices=['general', 'icu', 'all'], default='all', required=False)


class BookEmergencyBedSerializer(serializers.Serializer):
    """Serializer for booking emergency bed"""
    hospital_id = serializers.IntegerField(required=True)
    emergency_type = serializers.ChoiceField(choices=EmergencyBooking.EMERGENCY_TYPE_CHOICES, required=True)
    bed_type = serializers.ChoiceField(choices=EmergencyBooking.BED_TYPE_CHOICES, required=True)
    patient_condition = serializers.CharField(required=True)
    contact_person = serializers.CharField(required=True)
    contact_phone = serializers.CharField(required=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class UpdateBookingStatusSerializer(serializers.Serializer):
    """Serializer for updating booking status"""
    status = serializers.ChoiceField(choices=EmergencyBooking.STATUS_CHOICES, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

