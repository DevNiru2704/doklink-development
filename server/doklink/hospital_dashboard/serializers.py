from rest_framework import serializers
from .models import (
    HospitalStaff, HospitalBedConfig, HospitalBed, HospitalPatient,
    HospitalDocument, HospitalClaim, HospitalActivity
)
from healthcare.models import Hospital


# ============================================================
# Hospital Serializers
# ============================================================

class DashboardHospitalSerializer(serializers.ModelSerializer):
    """Hospital info as seen by the website dashboard"""
    code = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = ['id', 'name', 'code', 'address', 'phone_number', 'email']

    def get_code(self, obj):
        """Generate a stable code from hospital name for DB compatibility"""
        import re
        sanitized = re.sub(r'[^a-z0-9]', '', obj.name.lower())[:20]
        return f"{sanitized}_{obj.id}"


class DashboardHospitalWithStatsSerializer(DashboardHospitalSerializer):
    """Hospital with statistics for SuperAdmin view"""
    stats = serializers.SerializerMethodField()

    class Meta(DashboardHospitalSerializer.Meta):
        fields = DashboardHospitalSerializer.Meta.fields + ['stats']

    def get_stats(self, obj):
        return {
            'beds': obj.dashboard_beds.count(),
            'patients': obj.dashboard_patients.count(),
            'claims': obj.dashboard_claims.count(),
        }


# ============================================================
# Hospital Registration
# ============================================================

class HospitalRegistrationSerializer(serializers.Serializer):
    hospitalName = serializers.CharField(max_length=300)
    hospitalAddress = serializers.CharField()
    hospitalPhone = serializers.CharField(max_length=20)
    hospitalEmail = serializers.EmailField()
    adminName = serializers.CharField(max_length=200)
    adminEmail = serializers.EmailField()
    adminPassword = serializers.CharField(min_length=6)
    adminPhone = serializers.CharField(max_length=20, required=False, default='')
    adminRole = serializers.ChoiceField(
        choices=['HospitalAdmin', 'BasicUser'],
        default='HospitalAdmin'
    )


# ============================================================
# Staff / Auth Serializers
# ============================================================

class StaffLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class StaffSerializer(serializers.ModelSerializer):
    hospital_name = serializers.SerializerMethodField()

    class Meta:
        model = HospitalStaff
        fields = [
            'id', 'hospital', 'hospital_name', 'name', 'email',
            'role', 'is_active', 'phone', 'department',
            'created_at', 'updated_at'
        ]
        # Never expose password_hash
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_hospital_name(self, obj):
        return obj.hospital.name if obj.hospital else "N/A"


class CreateStaffSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6)
    phone = serializers.CharField(max_length=20, required=False, default='')
    department = serializers.CharField(max_length=100, required=False, default='')
    role = serializers.ChoiceField(
        choices=['HospitalAdmin', 'BasicUser'],
        required=False,
        default='BasicUser'
    )
    hospitalId = serializers.IntegerField(required=False)


# ============================================================
# Bed Serializers
# ============================================================

class BedEquipmentSerializer(serializers.Serializer):
    hasMonitor = serializers.BooleanField(default=False)
    hasOxygen = serializers.BooleanField(default=False)
    hasVentilator = serializers.BooleanField(default=False)


class HospitalBedSerializer(serializers.ModelSerializer):
    """
    Serializer that matches the MongoDB format expected by the Next.js frontend.
    Translates between Django snake_case and JS camelCase.
    """
    id = serializers.IntegerField(source='pk', read_only=True)
    bedNumber = serializers.CharField(source='bed_number')
    bedCategory = serializers.CharField(source='bed_category')
    dailyRate = serializers.DecimalField(source='daily_rate', max_digits=10, decimal_places=2)
    hospitalId = serializers.IntegerField(source='hospital_id', read_only=True)
    patientId = serializers.SerializerMethodField()
    equipment = serializers.SerializerMethodField()

    class Meta:
        model = HospitalBed
        fields = [
            'id', 'hospitalId', 'bedNumber', 'bedCategory', 'department',
            'floor', 'wing', 'dailyRate', 'equipment', 'status', 'patientId',
        ]

    def get_patientId(self, obj):
        return str(obj.patient_id) if obj.patient_id else None

    def get_equipment(self, obj):
        return {
            'hasMonitor': obj.has_monitor,
            'hasOxygen': obj.has_oxygen,
            'hasVentilator': obj.has_ventilator,
        }


class CreateBedSerializer(serializers.Serializer):
    """Accepts camelCase input from frontend"""
    bedNumber = serializers.CharField(max_length=50)
    bedCategory = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=100, required=False, default='NA')
    floor = serializers.CharField(max_length=20)
    wing = serializers.CharField(max_length=20, required=False, default='NA')
    dailyRate = serializers.DecimalField(max_digits=10, decimal_places=2)
    equipment = BedEquipmentSerializer(required=False)
    status = serializers.ChoiceField(
        choices=['available', 'occupied', 'maintenance', 'reserved'],
        default='available'
    )


class UpdateBedSerializer(serializers.Serializer):
    """Accepts camelCase input from frontend for updates"""
    id = serializers.IntegerField(required=False)
    bedNumber = serializers.CharField(max_length=50, required=False)
    bedCategory = serializers.CharField(max_length=100, required=False)
    department = serializers.CharField(max_length=100, required=False)
    floor = serializers.CharField(max_length=20, required=False)
    wing = serializers.CharField(max_length=20, required=False)
    dailyRate = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    equipment = BedEquipmentSerializer(required=False)
    status = serializers.ChoiceField(
        choices=['available', 'occupied', 'maintenance', 'reserved'],
        required=False
    )
    patientId = serializers.CharField(required=False, allow_null=True, allow_blank=True)


# ============================================================
# Patient Serializers
# ============================================================

class HospitalPatientSerializer(serializers.ModelSerializer):
    """Matches MongoDB format: camelCase field names"""
    id = serializers.IntegerField(source='pk', read_only=True)
    hospitalId = serializers.IntegerField(source='hospital_id', read_only=True)
    admissionDate = serializers.DateTimeField(source='admission_date', read_only=True)
    dischargeDate = serializers.DateTimeField(source='discharge_date', read_only=True)
    assignedBed = serializers.CharField(source='assigned_bed')
    emergencyContact = serializers.CharField(source='emergency_contact')
    bloodGroup = serializers.CharField(source='blood_group')
    admissionHistory = serializers.JSONField(source='admission_history', read_only=True)

    class Meta:
        model = HospitalPatient
        fields = [
            'id', 'hospitalId', 'uhid', 'name', 'age', 'gender',
            'phone', 'email', 'address', 'bloodGroup', 'emergencyContact',
            'allergies', 'medications', 'admissionDate', 'dischargeDate',
            'diagnosis', 'assignedBed', 'status', 'admissionHistory',
        ]


class CreatePatientSerializer(serializers.Serializer):
    uhid = serializers.CharField(max_length=50, required=False, default='')
    name = serializers.CharField(max_length=200)
    age = serializers.IntegerField()
    gender = serializers.ChoiceField(choices=['Male', 'Female', 'Other'])
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    bloodGroup = serializers.CharField(required=False, allow_blank=True, default='')
    emergencyContact = serializers.CharField(max_length=20)
    allergies = serializers.CharField(required=False, allow_blank=True, default='')
    medications = serializers.CharField(required=False, allow_blank=True, default='')
    diagnosis = serializers.CharField()
    assignedBed = serializers.CharField(required=False, allow_blank=True, default='')
    status = serializers.ChoiceField(
        choices=['Waiting', 'Admitted', 'Discharged'],
        default='Admitted'
    )


# ============================================================
# Document Serializer
# ============================================================

class PatientDocumentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    hospitalId = serializers.IntegerField(source='hospital_id', read_only=True)
    patientId = serializers.IntegerField(source='patient_id')
    type = serializers.CharField(source='doc_type')

    class Meta:
        model = HospitalDocument
        fields = ['id', 'hospitalId', 'patientId', 'type', 'name', 'date', 'url']


# ============================================================
# Claims Serializer
# ============================================================

class InsuranceClaimSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    hospitalId = serializers.IntegerField(source='hospital_id', read_only=True)
    patientId = serializers.IntegerField(source='patient_id')
    patientName = serializers.CharField(source='patient_name')
    policyNumber = serializers.CharField(source='policy_number')
    claimAmount = serializers.DecimalField(source='claim_amount', max_digits=10, decimal_places=2)
    approvedAmount = serializers.DecimalField(source='approved_amount', max_digits=10, decimal_places=2)
    pendingAmount = serializers.DecimalField(source='pending_amount', max_digits=10, decimal_places=2)
    rejectedAmount = serializers.DecimalField(source='rejected_amount', max_digits=10, decimal_places=2)
    submissionDate = serializers.DateTimeField(source='submission_date', read_only=True)
    approvalHistory = serializers.JSONField(source='approval_history')

    class Meta:
        model = HospitalClaim
        fields = [
            'id', 'hospitalId', 'patientId', 'patientName', 'policyNumber',
            'insurer', 'claimAmount', 'approvedAmount', 'pendingAmount',
            'rejectedAmount', 'status', 'submissionDate', 'diagnosis',
            'treatment', 'expenses', 'approvalHistory',
        ]


# ============================================================
# Activity Serializer
# ============================================================

class ActivityLogSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    hospitalId = serializers.IntegerField(source='hospital_id', read_only=True)
    referenceId = serializers.CharField(source='reference_id')
    type = serializers.CharField(source='activity_type')

    class Meta:
        model = HospitalActivity
        fields = ['id', 'hospitalId', 'type', 'description', 'referenceId', 'time']


# ============================================================
# Bed Configuration Serializer
# ============================================================

class BedConfigurationSerializer(serializers.ModelSerializer):
    bedCategories = serializers.ListField(source='bed_categories')
    departments = serializers.ListField()
    floors = serializers.ListField()
    wings = serializers.ListField()

    class Meta:
        model = HospitalBedConfig
        fields = ['bedCategories', 'departments', 'floors', 'wings']
