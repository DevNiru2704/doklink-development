from rest_framework import serializers
from .models import Doctor, Hospital, Treatment, Booking, Payment


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'specialization', 'phone_number', 'email']


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'address', 'city', 'state', 'phone_number', 'latitude', 'longitude']


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
