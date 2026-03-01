from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from .models import (
    HospitalStaff, HospitalBedConfig, HospitalBed, HospitalPatient,
    HospitalDocument, HospitalClaim, HospitalActivity
)
from .serializers import (
    StaffSerializer, StaffLoginSerializer, CreateStaffSerializer,
    DashboardHospitalSerializer, DashboardHospitalWithStatsSerializer,
    HospitalRegistrationSerializer,
    HospitalBedSerializer, CreateBedSerializer, UpdateBedSerializer,
    HospitalPatientSerializer, CreatePatientSerializer,
    PatientDocumentSerializer,
    InsuranceClaimSerializer,
    ActivityLogSerializer,
    BedConfigurationSerializer,
)
from healthcare.models import Hospital

import re


def _get_hospital_code(hospital):
    """Generate a stable code from hospital name + id"""
    sanitized = re.sub(r'[^a-z0-9]', '', hospital.name.lower())[:20]
    return f"{sanitized}_{hospital.id}"


# ============================================================
# AUTH ENDPOINTS
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def staff_login(request):
    """
    Authenticate a hospital staff member.
    Called by NextAuth credentials provider.
    """
    serializer = StaffLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email'].lower()
    password = serializer.validated_data['password']

    # Hardcoded SuperAdmin fallback
    if email == 'superadmin@doklink.com' and password == 'Super@123':
        return Response({
            'id': 'superadmin-001',
            'email': 'superadmin@doklink.com',
            'name': 'Super Administrator',
            'role': 'SuperAdmin',
        })

    try:
        staff = HospitalStaff.objects.select_related('hospital').get(
            email=email, is_active=True
        )
    except HospitalStaff.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials or account inactive'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not staff.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    response_data = {
        'id': str(staff.id),
        'email': staff.email,
        'name': staff.name,
        'role': staff.role,
    }

    if staff.hospital:
        response_data['hospitalId'] = str(staff.hospital.id)
        response_data['hospitalName'] = staff.hospital.name
        response_data['hospitalCode'] = _get_hospital_code(staff.hospital)

    return Response(response_data)


# ============================================================
# HOSPITAL MANAGEMENT (SuperAdmin)
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def list_hospitals(request):
    """Get all hospitals. SuperAdmin gets stats, others get basic info."""
    role = request.headers.get('X-User-Role', '')

    hospitals = Hospital.objects.filter(
        # Only return hospitals that are actually used
    ).all()

    if role == 'SuperAdmin':
        serializer = DashboardHospitalWithStatsSerializer(hospitals, many=True)
    else:
        serializer = DashboardHospitalSerializer(hospitals, many=True)

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_hospital(request):
    """Register a new hospital + first admin user. SuperAdmin only."""
    role = request.headers.get('X-User-Role', '')
    if role != 'SuperAdmin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    serializer = HospitalRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Check if hospital email already exists
    if Hospital.objects.filter(email=data['hospitalEmail'].lower()).exists():
        return Response({'error': 'Hospital email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if admin email already exists
    if HospitalStaff.objects.filter(email=data['adminEmail'].lower()).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # Create hospital
    hospital = Hospital.objects.create(
        name=data['hospitalName'],
        address=data['hospitalAddress'],
        city='',  # Can be parsed later
        state='',
        pin_code='000000',  # Default placeholder
        phone_number=data['hospitalPhone'],
        email=data['hospitalEmail'].lower(),
    )

    # Create admin user
    staff = HospitalStaff(
        hospital=hospital,
        name=data['adminName'],
        email=data['adminEmail'].lower(),
        role=data['adminRole'],
        is_active=True,
        phone=data.get('adminPhone', ''),
        department='Administration',
    )
    staff.set_password(data['adminPassword'])
    staff.save()

    return Response({
        'success': True,
        'message': 'Hospital registered successfully',
        'hospitalId': str(hospital.id),
    }, status=status.HTTP_201_CREATED)


# ============================================================
# USER MANAGEMENT
# ============================================================

@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@permission_classes([AllowAny])
def manage_users(request):
    """CRUD for hospital staff users"""
    role = request.headers.get('X-User-Role', '')
    hospital_id = request.headers.get('X-Hospital-Id', '')

    if request.method == 'GET':
        return _list_users(role, hospital_id)
    elif request.method == 'POST':
        return _create_user(request, role, hospital_id)
    elif request.method == 'PATCH':
        return _update_user(request, role)
    elif request.method == 'DELETE':
        return _delete_user(request, role, hospital_id)


def _list_users(role, hospital_id):
    if role not in ('SuperAdmin', 'HospitalAdmin'):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    queryset = HospitalStaff.objects.filter(is_active=True).select_related('hospital')

    if role == 'HospitalAdmin' and hospital_id:
        queryset = queryset.filter(hospital_id=hospital_id)

    serializer = StaffSerializer(queryset, many=True)
    return Response(serializer.data)


def _create_user(request, role, hospital_id):
    if role not in ('SuperAdmin', 'HospitalAdmin'):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CreateStaffSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if HospitalStaff.objects.filter(email=data['email'].lower()).exists():
        return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

    # Determine hospital and role
    if role == 'SuperAdmin':
        target_role = data.get('role', 'BasicUser')
        target_hospital_id = data.get('hospitalId')
        if not target_hospital_id:
            return Response({'error': 'Hospital ID required'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        target_role = 'BasicUser'
        target_hospital_id = hospital_id

    try:
        hospital = Hospital.objects.get(id=target_hospital_id)
    except Hospital.DoesNotExist:
        return Response({'error': 'Hospital not found'}, status=status.HTTP_400_BAD_REQUEST)

    staff = HospitalStaff(
        hospital=hospital,
        name=data['name'],
        email=data['email'].lower(),
        role=target_role,
        is_active=True,
        phone=data.get('phone', ''),
        department=data.get('department', ''),
    )
    staff.set_password(data['password'])
    staff.save()

    return Response({
        'success': True,
        'message': 'User created successfully',
        'userId': str(staff.id),
    }, status=status.HTTP_201_CREATED)


def _update_user(request, role):
    if role != 'SuperAdmin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('userId')
    new_role = request.data.get('newRole')
    is_active = request.data.get('isActive')

    if not user_id:
        return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        staff = HospitalStaff.objects.get(id=user_id)
    except HospitalStaff.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if new_role and new_role in ('HospitalAdmin', 'BasicUser'):
        staff.role = new_role
    if isinstance(is_active, bool):
        staff.is_active = is_active
    staff.save()

    return Response({'success': True, 'message': 'User updated successfully'})


def _delete_user(request, role, hospital_id):
    if role not in ('SuperAdmin', 'HospitalAdmin'):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.query_params.get('userId')
    if not user_id:
        return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        staff = HospitalStaff.objects.get(id=user_id)
    except HospitalStaff.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if role == 'HospitalAdmin' and str(staff.hospital_id) != str(hospital_id):
        return Response({'error': 'Cannot delete users from other hospitals'}, status=status.HTTP_403_FORBIDDEN)

    staff.is_active = False
    staff.save()

    return Response({'success': True, 'message': 'User deactivated successfully'})


# ============================================================
# BED MANAGEMENT
# ============================================================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([AllowAny])
def manage_beds(request):
    """CRUD for hospital beds, scoped to the authenticated user's hospital"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        beds = HospitalBed.objects.filter(hospital=hospital)
        serializer = HospitalBedSerializer(beds, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        ser = CreateBedSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        equipment = d.get('equipment', {})

        bed = HospitalBed.objects.create(
            hospital=hospital,
            bed_number=d['bedNumber'],
            bed_category=d['bedCategory'],
            department=d.get('department', 'NA'),
            floor=d['floor'],
            wing=d.get('wing', 'NA'),
            daily_rate=d['dailyRate'],
            status=d.get('status', 'available'),
            has_monitor=equipment.get('hasMonitor', False),
            has_oxygen=equipment.get('hasOxygen', False),
            has_ventilator=equipment.get('hasVentilator', False),
        )
        return Response(HospitalBedSerializer(bed).data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        ser = UpdateBedSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        bed_id = d.get('id') or request.data.get('_id') or request.data.get('id')

        if not bed_id:
            return Response({'error': 'Bed ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bed = HospitalBed.objects.get(id=bed_id, hospital=hospital)
        except HospitalBed.DoesNotExist:
            return Response({'error': 'Bed not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'bedNumber' in d:
            bed.bed_number = d['bedNumber']
        if 'bedCategory' in d:
            bed.bed_category = d['bedCategory']
        if 'department' in d:
            bed.department = d['department']
        if 'floor' in d:
            bed.floor = d['floor']
        if 'wing' in d:
            bed.wing = d['wing']
        if 'dailyRate' in d:
            bed.daily_rate = d['dailyRate']
        if 'status' in d:
            bed.status = d['status']
        if 'patientId' in d:
            patient_id = d['patientId']
            if patient_id:
                try:
                    bed.patient = HospitalPatient.objects.get(id=patient_id)
                except HospitalPatient.DoesNotExist:
                    bed.patient = None
            else:
                bed.patient = None
        if 'equipment' in d:
            eq = d['equipment']
            bed.has_monitor = eq.get('hasMonitor', bed.has_monitor)
            bed.has_oxygen = eq.get('hasOxygen', bed.has_oxygen)
            bed.has_ventilator = eq.get('hasVentilator', bed.has_ventilator)

        bed.save()
        return Response(HospitalBedSerializer(bed).data)


# ============================================================
# PATIENT MANAGEMENT
# ============================================================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([AllowAny])
def manage_patients(request):
    """CRUD for hospital patients"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        patients = HospitalPatient.objects.filter(hospital=hospital)
        serializer = HospitalPatientSerializer(patients, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        ser = CreatePatientSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        patient = HospitalPatient.objects.create(
            hospital=hospital,
            uhid=d.get('uhid', ''),
            name=d['name'],
            age=d['age'],
            gender=d['gender'],
            phone=d['phone'],
            email=d.get('email', ''),
            address=d.get('address', ''),
            blood_group=d.get('bloodGroup', ''),
            emergency_contact=d['emergencyContact'],
            allergies=d.get('allergies', ''),
            medications=d.get('medications', ''),
            diagnosis=d['diagnosis'],
            assigned_bed=d.get('assignedBed', ''),
            status=d.get('status', 'Admitted'),
        )
        # Auto-generate UHID if not provided
        if not patient.uhid:
            patient.uhid = f"P{patient.id}"
            patient.save(update_fields=['uhid'])

        return Response(HospitalPatientSerializer(patient).data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        data = request.data
        patient_id = data.get('id') or data.get('_id')
        if not patient_id:
            return Response({'error': 'Patient ID required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = HospitalPatient.objects.get(id=patient_id, hospital=hospital)
        except HospitalPatient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update fields from camelCase input
        field_map = {
            'name': 'name', 'age': 'age', 'gender': 'gender',
            'phone': 'phone', 'email': 'email', 'address': 'address',
            'bloodGroup': 'blood_group', 'emergencyContact': 'emergency_contact',
            'allergies': 'allergies', 'medications': 'medications',
            'diagnosis': 'diagnosis', 'assignedBed': 'assigned_bed',
            'status': 'status', 'uhid': 'uhid',
            'admissionHistory': 'admission_history',
        }
        for js_key, py_key in field_map.items():
            if js_key in data:
                setattr(patient, py_key, data[js_key])

        # Handle discharge
        if data.get('status') == 'Discharged' and not patient.discharge_date:
            patient.discharge_date = timezone.now()
        if 'dischargeDate' in data:
            patient.discharge_date = data['dischargeDate']

        patient.save()
        return Response(HospitalPatientSerializer(patient).data)


# ============================================================
# CLAIMS MANAGEMENT
# ============================================================

@api_view(['GET', 'POST', 'PUT'])
@permission_classes([AllowAny])
def manage_claims(request):
    """CRUD for insurance claims"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        claims = HospitalClaim.objects.filter(hospital=hospital)
        serializer = InsuranceClaimSerializer(claims, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        patient_id = data.get('patientId')
        try:
            patient = HospitalPatient.objects.get(id=patient_id, hospital=hospital)
        except HospitalPatient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_400_BAD_REQUEST)

        claim = HospitalClaim.objects.create(
            hospital=hospital,
            patient=patient,
            patient_name=data.get('patientName', patient.name),
            policy_number=data.get('policyNumber', ''),
            insurer=data.get('insurer', ''),
            claim_amount=data.get('claimAmount', 0),
            approved_amount=data.get('approvedAmount', 0),
            pending_amount=data.get('pendingAmount', 0),
            rejected_amount=data.get('rejectedAmount', 0),
            status=data.get('status', 'Pending'),
            diagnosis=data.get('diagnosis', ''),
            treatment=data.get('treatment', ''),
            expenses=data.get('expenses', []),
            approval_history=data.get('approvalHistory', []),
        )
        return Response(InsuranceClaimSerializer(claim).data, status=status.HTTP_201_CREATED)

    elif request.method == 'PUT':
        data = request.data
        claim_id = data.get('id') or data.get('_id')
        if not claim_id:
            return Response({'error': 'Claim ID required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            claim = HospitalClaim.objects.get(id=claim_id, hospital=hospital)
        except HospitalClaim.DoesNotExist:
            return Response({'error': 'Claim not found'}, status=status.HTTP_404_NOT_FOUND)

        field_map = {
            'patientName': 'patient_name', 'policyNumber': 'policy_number',
            'insurer': 'insurer', 'claimAmount': 'claim_amount',
            'approvedAmount': 'approved_amount', 'pendingAmount': 'pending_amount',
            'rejectedAmount': 'rejected_amount', 'status': 'status',
            'diagnosis': 'diagnosis', 'treatment': 'treatment',
            'expenses': 'expenses', 'approvalHistory': 'approval_history',
        }
        for js_key, py_key in field_map.items():
            if js_key in data:
                setattr(claim, py_key, data[js_key])
        claim.save()
        return Response(InsuranceClaimSerializer(claim).data)


# ============================================================
# ACTIVITIES
# ============================================================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_activities(request):
    """Activity log for the hospital"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        activities = HospitalActivity.objects.filter(hospital=hospital)[:50]
        serializer = ActivityLogSerializer(activities, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        HospitalActivity.objects.create(
            hospital=hospital,
            activity_type=data.get('type', 'admission'),
            description=data.get('description', ''),
            reference_id=data.get('referenceId', ''),
        )
        return Response({'success': True})


# ============================================================
# DOCUMENTS
# ============================================================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_documents(request):
    """Medical documents for patients"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        documents = HospitalDocument.objects.filter(hospital=hospital)
        serializer = PatientDocumentSerializer(documents, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        patient_id = data.get('patientId')
        try:
            patient = HospitalPatient.objects.get(id=patient_id, hospital=hospital)
        except HospitalPatient.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_400_BAD_REQUEST)

        doc = HospitalDocument.objects.create(
            hospital=hospital,
            patient=patient,
            doc_type=data.get('type', 'Report'),
            name=data.get('name', ''),
            url=data.get('url', ''),
        )
        return Response(PatientDocumentSerializer(doc).data, status=status.HTTP_201_CREATED)


# ============================================================
# BED CONFIGURATION
# ============================================================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def manage_bed_config(request):
    """Custom dropdown options for bed management"""
    hospital = _get_hospital_from_headers(request)
    if not hospital:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        config, created = HospitalBedConfig.objects.get_or_create(
            hospital=hospital,
            defaults={
                'bed_categories': [],
                'departments': ['NA'],
                'floors': [],
                'wings': ['NA'],
            }
        )
        return Response(BedConfigurationSerializer(config).data)

    elif request.method == 'POST':
        data = request.data
        field = data.get('field')
        value = data.get('value')

        if not field or not value:
            return Response({'error': 'Field and value are required'}, status=status.HTTP_400_BAD_REQUEST)

        valid_fields = {
            'bedCategories': 'bed_categories',
            'departments': 'departments',
            'floors': 'floors',
            'wings': 'wings',
        }
        if field not in valid_fields:
            return Response({'error': 'Invalid field'}, status=status.HTTP_400_BAD_REQUEST)

        config, created = HospitalBedConfig.objects.get_or_create(
            hospital=hospital,
            defaults={
                'bed_categories': [],
                'departments': ['NA'],
                'floors': [],
                'wings': ['NA'],
            }
        )

        py_field = valid_fields[field]
        current_list = getattr(config, py_field) or []
        if value not in current_list:
            current_list.append(value)
            setattr(config, py_field, current_list)
            config.save()

        return Response({
            'success': True,
            'bedCategories': config.bed_categories or [],
            'departments': config.departments or ['NA'],
            'floors': config.floors or [],
            'wings': config.wings or ['NA'],
        })


# ============================================================
# HELPER
# ============================================================

def _get_hospital_from_headers(request):
    """
    Extract hospital from the session headers set by NextAuth middleware.
    The Next.js middleware forwards x-hospital-id from the JWT token.
    """
    hospital_id = request.headers.get('X-Hospital-Id', '')
    if not hospital_id:
        # Try from query param for direct Django API calls
        hospital_id = request.query_params.get('hospital_id', '')

    if not hospital_id:
        return None

    try:
        return Hospital.objects.get(id=int(hospital_id))
    except (Hospital.DoesNotExist, ValueError):
        return None
