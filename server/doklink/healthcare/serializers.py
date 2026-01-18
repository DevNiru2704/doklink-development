from rest_framework import serializers
from .models import (
    Doctor, Hospital, Treatment, Booking, Payment, EmergencyBooking, 
    Insurance, InsuranceProvider, HospitalInsurance, InsuranceDependent,
    DailyExpense, OutOfPocketPayment
)
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
    accepted_insurance_providers = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'address', 'city', 'state', 'phone_number', 
            'latitude', 'longitude', 'total_general_beds', 'available_general_beds',
            'total_icu_beds', 'available_icu_beds', 'accepts_insurance',
            'insurance_providers', 'accepted_insurance_providers',
            'estimated_emergency_cost', 'estimated_general_admission_cost', 
            'distance', 'estimated_time'
        ]
    
    def get_accepted_insurance_providers(self, obj):
        """Get list of accepted insurance providers with network status"""
        try:
            hospital_insurances = obj.accepted_insurances.filter(is_active=True).select_related('insurance_provider')
            return [{
                'id': hi.insurance_provider.id,
                'name': hi.insurance_provider.name,
                'provider_code': hi.insurance_provider.provider_code,
                'is_in_network': hi.is_in_network,
                'copay_amount': str(hi.copay_amount)
            } for hi in hospital_insurances]
        except Exception as e:
            # Return empty list if there's any error fetching insurance data
            return []


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
            'arrival_time', 'admission_time', 'discharge_date', 'booking_latitude', 'booking_longitude',
            'estimated_arrival_minutes', 'total_bill_amount', 'insurance_approved_amount',
            'out_of_pocket_amount', 'notes', 'cancellation_reason', 'created_at'
        ]
        read_only_fields = ['reservation_expires_at', 'created_at', 'total_bill_amount', 
                           'insurance_approved_amount', 'out_of_pocket_amount']
    
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
    """Serializer for fetching nearby hospitals with weighted scoring"""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=True)
    radius_km = serializers.FloatField(default=50.0, required=False)
    bed_type = serializers.ChoiceField(choices=['general', 'icu', 'all'], default='all', required=False)
    show_all = serializers.BooleanField(default=False, required=False)
    insurance_provider_id = serializers.IntegerField(required=False, allow_null=True)


class BookEmergencyBedSerializer(serializers.Serializer):
    """Serializer for booking emergency bed"""
    hospital_id = serializers.IntegerField(required=True)
    emergency_type = serializers.CharField(required=True)  # Now accepts multiple types as comma-separated
    bed_type = serializers.ChoiceField(choices=EmergencyBooking.BED_TYPE_CHOICES, required=False, default='general')
    patient_condition = serializers.CharField(required=False, allow_blank=True, default='')
    contact_person = serializers.CharField(required=True, max_length=200)  # REQUIRED
    contact_phone = serializers.CharField(required=True)  # REQUIRED
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    estimated_arrival_minutes = serializers.IntegerField(required=False, allow_null=True)


class UpdateBookingStatusSerializer(serializers.Serializer):
    """Serializer for updating booking status"""
    status = serializers.ChoiceField(choices=EmergencyBooking.STATUS_CHOICES, required=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class InsuranceDependentSerializer(serializers.ModelSerializer):
    """Serializer for Insurance Dependent model"""
    
    age = serializers.ReadOnlyField()
    
    class Meta:
        model = InsuranceDependent
        fields = [
            'id', 'insurance', 'name', 'relationship', 'date_of_birth', 
            'age', 'is_covered', 'created_at', 'updated_at'
        ]
        read_only_fields = ['insurance', 'age', 'created_at', 'updated_at']
    
    def validate_date_of_birth(self, value):
        """Ensure date of birth is not in the future"""
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value


class InsuranceSerializer(serializers.ModelSerializer):
    """Serializer for Insurance model (Section 2.2)"""
    
    user_name = serializers.SerializerMethodField(read_only=True)
    is_expired = serializers.SerializerMethodField(read_only=True)
    days_until_expiry = serializers.SerializerMethodField(read_only=True)
    dependents = InsuranceDependentSerializer(many=True, read_only=True)
    dependents_data = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)
    
    class Meta:
        model = Insurance
        fields = [
            'id', 'user', 'provider_name', 'policy_number', 'policy_expiry',
            'coverage_type', 'coverage_amount', 'is_active', 'user_name',
            'is_expired', 'days_until_expiry', 'dependents', 'dependents_data',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        """Return username"""
        return obj.user.get_full_name() or obj.user.username
    
    def get_is_expired(self, obj):
        """Check if policy is expired"""
        from datetime import date
        return obj.policy_expiry < date.today()
    
    def get_days_until_expiry(self, obj):
        """Calculate days until expiry"""
        from datetime import date
        delta = obj.policy_expiry - date.today()
        return delta.days
    
    def validate_policy_number(self, value):
        """Ensure policy number is unique"""
        if self.instance:
            # Update case - exclude current instance
            if Insurance.objects.exclude(pk=self.instance.pk).filter(policy_number=value).exists():
                raise serializers.ValidationError("This policy number already exists")
        else:
            # Create case
            if Insurance.objects.filter(policy_number=value).exists():
                raise serializers.ValidationError("This policy number already exists")
        return value
    
    def validate_policy_expiry(self, value):
        """Ensure policy expiry is in the future for new policies"""
        from datetime import date
        if not self.instance and value < date.today():
            raise serializers.ValidationError("Policy expiry date cannot be in the past")
        return value
    
    def create(self, validated_data):
        """Create insurance with dependents"""
        dependents_data = validated_data.pop('dependents_data', [])
        insurance = Insurance.objects.create(**validated_data)
        
        # Create dependents
        for dependent_data in dependents_data:
            InsuranceDependent.objects.create(insurance=insurance, **dependent_data)
        
        return insurance
    
    def update(self, instance, validated_data):
        """Update insurance and dependents"""
        dependents_data = validated_data.pop('dependents_data', None)
        
        # Update insurance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update dependents if provided
        if dependents_data is not None:
            # Delete existing dependents
            instance.dependents.all().delete()
            
            # Create new dependents
            for dependent_data in dependents_data:
                InsuranceDependent.objects.create(insurance=instance, **dependent_data)
        
        return instance


class InsuranceProviderSerializer(serializers.ModelSerializer):
    """Serializer for Insurance Provider model"""
    
    class Meta:
        model = InsuranceProvider
        fields = ['id', 'name', 'provider_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class HospitalInsuranceSerializer(serializers.ModelSerializer):
    """Serializer for Hospital-Insurance relationship"""
    insurance_provider_name = serializers.CharField(source='insurance_provider.name', read_only=True)
    insurance_provider_code = serializers.CharField(source='insurance_provider.provider_code', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    network_status = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = HospitalInsurance
        fields = [
            'id', 'hospital', 'hospital_name', 'insurance_provider', 
            'insurance_provider_name', 'insurance_provider_code',
            'is_in_network', 'network_status', 'copay_amount', 
            'notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_network_status(self, obj):
        """Return human-readable network status"""
        return "In-Network" if obj.is_in_network else "Out-of-Network"


class InsuranceVerificationSerializer(serializers.Serializer):
    """Serializer for verifying insurance at a hospital"""
    hospital_id = serializers.IntegerField(required=True)
    insurance_provider_id = serializers.IntegerField(required=True)
    
    def validate_hospital_id(self, value):
        """Ensure hospital exists"""
        if not Hospital.objects.filter(id=value).exists():
            raise serializers.ValidationError("Hospital not found")
        return value
    
    def validate_insurance_provider_id(self, value):
        """Ensure insurance provider exists"""
        if not InsuranceProvider.objects.filter(id=value).exists():
            raise serializers.ValidationError("Insurance provider not found")
        return value


class DailyExpenseSerializer(serializers.ModelSerializer):
    """Serializer for DailyExpense model (Phase 2 - Section 8.2)"""
    
    expense_type_display = serializers.CharField(source='get_expense_type_display', read_only=True)
    admission_details = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = DailyExpense
        fields = [
            'id', 'admission', 'admission_details', 'date', 'expense_type', 
            'expense_type_display', 'description', 'amount', 'insurance_covered',
            'patient_share', 'verified', 'verification_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_admission_details(self, obj):
        """Return basic admission information"""
        return {
            'id': obj.admission.id,
            'hospital_name': obj.admission.hospital.name,
            'status': obj.admission.status,
            'admission_date': obj.admission.admission_time
        }
    
    def validate(self, data):
        """Ensure patient_share + insurance_covered = amount"""
        if 'amount' in data:
            insurance = data.get('insurance_covered', 0)
            patient = data.get('patient_share', 0)
            
            # Auto-calculate patient_share if not provided
            if insurance and not patient:
                data['patient_share'] = data['amount'] - insurance
            # Auto-calculate insurance_covered if not provided
            elif patient and not insurance:
                data['insurance_covered'] = data['amount'] - patient
            # Validate that they add up to amount
            elif insurance + patient != data['amount']:
                raise serializers.ValidationError(
                    "Insurance covered + Patient share must equal the total amount"
                )
        
        return data


class OutOfPocketPaymentSerializer(serializers.ModelSerializer):
    """Serializer for OutOfPocketPayment model (Phase 2 - Section 10.1)"""
    
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    admission_details = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = OutOfPocketPayment
        fields = [
            'id', 'admission', 'admission_details', 'total_amount', 'insurance_covered',
            'out_of_pocket', 'payment_status', 'payment_status_display', 'razorpay_order_id',
            'razorpay_payment_id', 'razorpay_signature', 'payment_method', 'payment_date',
            'transaction_receipt', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['razorpay_order_id', 'created_at', 'updated_at']
    
    def get_admission_details(self, obj):
        """Return basic admission information"""
        return {
            'id': obj.admission.id,
            'hospital_name': obj.admission.hospital.name,
            'patient_name': obj.admission.user.get_full_name() or obj.admission.user.username,
            'admission_date': obj.admission.admission_time,
            'discharge_date': obj.admission.discharge_date
        }


class CreateRazorpayOrderSerializer(serializers.Serializer):
    """Serializer for creating Razorpay order"""
    admission_id = serializers.IntegerField(required=True)
    
    def validate_admission_id(self, value):
        """Ensure admission exists and has out-of-pocket payment"""
        try:
            admission = EmergencyBooking.objects.get(id=value)
            if admission.status != 'discharged':
                raise serializers.ValidationError("Patient must be discharged to make payment")
        except EmergencyBooking.DoesNotExist:
            raise serializers.ValidationError("Admission not found")
        return value


class VerifyRazorpayPaymentSerializer(serializers.Serializer):
    """Serializer for verifying Razorpay payment"""
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)
    payment_method = serializers.CharField(required=False, allow_blank=True)
