from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Prefetch, F
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from math import radians, sin, cos, sqrt, atan2
import hashlib
import json

from .models import Doctor, Hospital, Treatment, Booking, Payment, EmergencyBooking, Insurance, InsuranceProvider, HospitalInsurance
from .serializers import (
    DoctorSerializer, HospitalSerializer, TreatmentSerializer,
    BookingSerializer, PaymentSerializer, DashboardSerializer,
    EmergencyBookingSerializer, EmergencyTriggerSerializer,
    NearbyHospitalSerializer, BookEmergencyBedSerializer,
    UpdateBookingStatusSerializer, InsuranceSerializer,
    InsuranceProviderSerializer, HospitalInsuranceSerializer,
    InsuranceVerificationSerializer
)


class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for doctors - read only for patients"""
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]


class HospitalViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for hospitals - read only for patients"""
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'], url_path='accepted-insurances')
    def accepted_insurances(self, request, pk=None):
        """Get accepted insurances for a specific hospital"""
        hospital = self.get_object()
        hospital_insurances = HospitalInsurance.objects.filter(
            hospital=hospital,
            is_active=True
        ).select_related('insurance_provider')
        
        return Response(HospitalInsuranceSerializer(hospital_insurances, many=True).data)
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """Get nearby hospitals based on user's location"""
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius = request.query_params.get('radius', 10)  # Default 10km
        
        if not latitude or not longitude:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(latitude)
            lon = float(longitude)
            radius = float(radius)
        except ValueError:
            return Response(
                {'error': 'Invalid coordinates'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all hospitals with coordinates
        hospitals = Hospital.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False
        )
        
        # Calculate distance and filter (simple approximation)
        # For production, use PostGIS or more accurate distance calculation
        nearby_hospitals = []
        for hospital in hospitals:
            # Simple distance calculation (not accurate for large distances)
            lat_diff = abs(float(hospital.latitude) - lat)
            lon_diff = abs(float(hospital.longitude) - lon)
            distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111  # Rough km conversion
            
            if distance <= radius:
                hospital_data = HospitalSerializer(hospital).data
                hospital_data['distance'] = round(distance, 2)
                nearby_hospitals.append(hospital_data)
        
        # Sort by distance
        nearby_hospitals.sort(key=lambda x: x['distance'])
        
        return Response(nearby_hospitals)
    
    @action(detail=False, methods=['get'])
    def search_google(self, request):
        """Search nearby hospitals using Google Places API (proxy endpoint)"""
        import requests
        from django.conf import settings
        
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius = request.query_params.get('radius', 5000)  # Default 5km in meters
        
        if not latitude or not longitude:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get API key from settings
        api_key = settings.GOOGLE_PLACES_API_KEY
        if not api_key:
            return Response(
                {'error': 'Google Places API key not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            # Call Google Places API
            url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
            params = {
                'location': f'{latitude},{longitude}',
                'radius': radius,
                'type': 'hospital',
                'key': api_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if data.get('status') == 'OK':
                return Response(data)
            else:
                return Response(
                    {'error': f"Google Places API error: {data.get('status')}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except requests.RequestException as e:
            return Response(
                {'error': f'Failed to fetch from Google Places API: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TreatmentViewSet(viewsets.ModelViewSet):
    """ViewSet for patient treatments"""
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optimized query with select_related"""
        return Treatment.objects.filter(
            user=self.request.user
        ).select_related('doctor', 'hospital').order_by('-started_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for patient bookings"""
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optimized query with select_related"""
        return Booking.objects.filter(
            user=self.request.user
        ).select_related('hospital', 'doctor').order_by('booking_date', 'booking_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for patient payments"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optimized query with select_related"""
        return Payment.objects.filter(
            user=self.request.user
        ).select_related('hospital', 'doctor', 'booking').order_by('due_date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get payment history (all payments including paid ones)"""
        payments = Payment.objects.filter(
            user=request.user
        ).select_related('hospital', 'doctor').order_by('-paid_date', '-due_date')
        
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


class InsuranceViewSet(viewsets.ModelViewSet):
    """ViewSet for patient insurance management (Section 2.2) with Redis caching"""
    serializer_class = InsuranceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return insurance policies for current user"""
        return Insurance.objects.filter(user=self.request.user).order_by('-is_active', '-created_at')
    
    def list(self, request, *args, **kwargs):
        """List insurances with caching (5 minutes TTL)"""
        cache_key = f"user_insurances:{request.user.id}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=300)  # 5 minutes
        return response
    
    def perform_create(self, serializer):
        """Automatically set user when creating insurance and invalidate cache"""
        serializer.save(user=self.request.user)
        # Invalidate user's insurance cache
        cache.delete(f"user_insurances:{self.request.user.id}")
    
    def perform_update(self, serializer):
        """Update insurance and invalidate cache"""
        serializer.save()
        cache.delete(f"user_insurances:{self.request.user.id}")
    
    def perform_destroy(self, instance):
        """Delete insurance and invalidate cache"""
        super().perform_destroy(instance)
        cache.delete(f"user_insurances:{self.request.user.id}")
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active insurance policies"""
        active_policies = Insurance.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-created_at')
        
        serializer = self.get_serializer(active_policies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an insurance policy and invalidate cache"""
        insurance = self.get_object()
        insurance.is_active = False
        insurance.save()
        
        # Invalidate cache
        cache.delete(f"user_insurances:{request.user.id}")
        
        serializer = self.get_serializer(insurance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Reactivate an insurance policy and invalidate cache"""
        insurance = self.get_object()
        insurance.is_active = True
        insurance.save()
        
        # Invalidate cache
        cache.delete(f"user_insurances:{request.user.id}")
        
        serializer = self.get_serializer(insurance)
        return Response(serializer.data)


class DashboardViewSet(viewsets.ViewSet):
    """Optimized dashboard endpoint with single query"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get dashboard summary with optimized queries
        Uses select_related to minimize database hits
        """
        user = request.user
        today = timezone.now().date()
        
        # Ongoing treatments (optimized with select_related)
        ongoing_treatments = Treatment.objects.filter(
            user=user,
            status='ongoing'
        ).select_related('doctor', 'hospital')[:5]  # Limit to 5 most recent
        
        # Upcoming bookings (next 30 days, optimized)
        upcoming_bookings = Booking.objects.filter(
            user=user,
            booking_date__gte=today,
            booking_date__lte=today + timedelta(days=30),
            status__in=['confirmed', 'pending']
        ).select_related('hospital', 'doctor').order_by('booking_date', 'booking_time')[:10]
        
        # Upcoming payments (next 30 days, optimized)
        upcoming_payments = Payment.objects.filter(
            user=user,
            due_date__gte=today,
            due_date__lte=today + timedelta(days=30),
            status='pending'
        ).select_related('hospital', 'doctor').order_by('due_date')[:10]
        
        # Summary statistics (single aggregation query)
        total_treatments = Treatment.objects.filter(user=user, status='ongoing').count()
        total_bookings = Booking.objects.filter(
            user=user,
            booking_date__gte=today,
            status__in=['confirmed', 'pending']
        ).count()
        total_pending_payments = Payment.objects.filter(
            user=user,
            status='pending'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Serialize data
        data = {
            'ongoing_treatments': TreatmentSerializer(ongoing_treatments, many=True).data,
            'upcoming_bookings': BookingSerializer(upcoming_bookings, many=True).data,
            'upcoming_payments': PaymentSerializer(upcoming_payments, many=True).data,
            'total_treatments': total_treatments,
            'total_bookings': total_bookings,
            'total_pending_payments': float(total_pending_payments),
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)

    def list(self, request):
        """Default list action redirects to summary"""
        return self.summary(request)


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    # Earth radius in kilometers
    radius = 6371
    distance = radius * c
    
    return distance


def invalidate_hospital_cache(hospital):
    """
    Invalidate all nearby hospital caches that might include this hospital
    This is called when bed availability changes
    """
    # Delete cache patterns for this hospital's area
    # In production, you might want to use a more sophisticated pattern matching
    # For now, we'll use a simple approach: delete by pattern
    try:
        # Get all cache keys matching the pattern
        cache_pattern = "nearby_hospitals:*"
        # Note: django-redis supports delete_pattern
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        
        # Find all keys matching the pattern
        keys = redis_conn.keys(f"doklink:{cache_pattern}")
        if keys:
            redis_conn.delete(*keys)
    except Exception as e:
        # If cache invalidation fails, log it but don't break the request
        print(f"Cache invalidation error: {e}")
        pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_emergency(request):
    """
    Trigger emergency and get immediate response with nearby hospitals
    POST /api/v1/healthcare/emergency/trigger/
    """
    serializer = EmergencyTriggerSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    latitude = float(serializer.validated_data['latitude'])
    longitude = float(serializer.validated_data['longitude'])
    
    # Get hospitals with available beds
    hospitals = Hospital.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    ).filter(
        Q(available_general_beds__gt=0) | Q(available_icu_beds__gt=0)
    )
    
    # Calculate distances and filter by radius (50km)
    nearby_hospitals = []
    for hospital in hospitals:
        distance = calculate_distance(
            latitude, longitude,
            float(hospital.latitude), float(hospital.longitude)
        )
        
        if distance <= 50:  # 50km radius
            # Estimate travel time (average 40 km/h in emergency)
            estimated_time = int((distance / 40) * 60)  # minutes
            
            hospital_data = HospitalSerializer(hospital).data
            hospital_data['distance'] = round(distance, 2)
            hospital_data['estimated_time'] = estimated_time
            nearby_hospitals.append(hospital_data)
    
    # Sort by distance
    nearby_hospitals.sort(key=lambda x: x['distance'])
    
    return Response({
        'success': True,
        'message': 'Emergency triggered successfully',
        'nearby_hospitals': nearby_hospitals[:10],  # Top 10 closest
        'emergency_number': '108',  # India emergency number
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_nearby_hospitals(request):
    """
    Get nearby hospitals with bed availability (with Redis caching)
    GET /api/v1/healthcare/hospitals/nearby/
    Cache TTL: 30 seconds (bed availability changes frequently)
    """
    serializer = NearbyHospitalSerializer(data=request.query_params)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    latitude = float(serializer.validated_data['latitude'])
    longitude = float(serializer.validated_data['longitude'])
    radius_km = serializer.validated_data.get('radius_km', 10.0)
    bed_type = serializer.validated_data.get('bed_type', 'all')
    
    # Create cache key based on parameters
    cache_key = f"nearby_hospitals:{latitude}:{longitude}:{radius_km}:{bed_type}"
    
    # Try to get from cache
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Filter hospitals with coordinates
    hospitals = Hospital.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    )
    
    # Filter by bed availability
    if bed_type == 'general':
        hospitals = hospitals.filter(available_general_beds__gt=0)
    elif bed_type == 'icu':
        hospitals = hospitals.filter(available_icu_beds__gt=0)
    elif bed_type == 'all':
        hospitals = hospitals.filter(
            Q(available_general_beds__gt=0) | Q(available_icu_beds__gt=0)
        )
    
    # Calculate distances
    nearby_hospitals = []
    for hospital in hospitals:
        distance = calculate_distance(
            latitude, longitude,
            float(hospital.latitude), float(hospital.longitude)
        )
        
        if distance <= radius_km:
            estimated_time = int((distance / 40) * 60)  # minutes at 40 km/h
            
            hospital_data = HospitalSerializer(hospital).data
            hospital_data['distance'] = round(distance, 2)
            hospital_data['estimated_time'] = estimated_time
            nearby_hospitals.append(hospital_data)
    
    # Sort by distance
    nearby_hospitals.sort(key=lambda x: x['distance'])
    
    # Cache the results for 30 seconds (bed availability changes frequently)
    cache.set(cache_key, nearby_hospitals, timeout=30)
    
    return Response(nearby_hospitals)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_emergency_bed(request):
    """
    Book an emergency bed at a hospital
    POST /api/v1/healthcare/emergency/book-bed/
    Invalidates hospital cache after booking
    """
    serializer = BookEmergencyBedSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    hospital_id = serializer.validated_data['hospital_id']
    bed_type = serializer.validated_data['bed_type']
    
    try:
        hospital = Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return Response(
            {'error': 'Hospital not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check bed availability
    if bed_type == 'general' and hospital.available_general_beds <= 0:
        return Response(
            {'error': 'No general beds available'},
            status=status.HTTP_400_BAD_REQUEST
        )
    elif bed_type == 'icu' and hospital.available_icu_beds <= 0:
        return Response(
            {'error': 'No ICU beds available'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate estimated arrival time if coordinates provided
    user_lat = serializer.validated_data.get('latitude')
    user_lon = serializer.validated_data.get('longitude')
    
    if user_lat and user_lon:
        distance = calculate_distance(
            float(user_lat), float(user_lon),
            float(hospital.latitude), float(hospital.longitude)
        )
        estimated_arrival_minutes = int((distance / 40) * 60)
    else:
        # Use provided estimated_arrival_minutes or default to 30
        estimated_arrival_minutes = serializer.validated_data.get('estimated_arrival_minutes', 30)
    
    # Calculate dynamic reservation expiry based on distance
    # Minimum 30 minutes, add 50% buffer to estimated arrival time
    reservation_minutes = max(30, int(estimated_arrival_minutes * 1.5))
    
    # Create emergency booking
    emergency_booking = EmergencyBooking.objects.create(
        user=request.user,
        hospital=hospital,
        emergency_type=serializer.validated_data['emergency_type'],
        bed_type=bed_type,
        patient_condition=serializer.validated_data.get('patient_condition', ''),
        contact_person=serializer.validated_data['contact_person'],  # REQUIRED
        contact_phone=serializer.validated_data['contact_phone'],  # REQUIRED
        booking_latitude=float(user_lat) if user_lat else None,
        booking_longitude=float(user_lon) if user_lon else None,
        estimated_arrival_minutes=estimated_arrival_minutes,
        notes=serializer.validated_data.get('notes', ''),
        reservation_expires_at=timezone.now() + timedelta(minutes=reservation_minutes)
    )
    
    # Decrease bed availability (with safety check)
    hospital.refresh_from_db()  # Get latest values
    if bed_type == 'general':
        if hospital.available_general_beds <= 0:
            return Response(
                {'error': 'No general beds available (race condition detected)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        hospital.available_general_beds = F('available_general_beds') - 1
    else:
        if hospital.available_icu_beds <= 0:
            return Response(
                {'error': 'No ICU beds available (race condition detected)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        hospital.available_icu_beds = F('available_icu_beds') - 1
    hospital.save()
    hospital.refresh_from_db()
    
    # Invalidate all nearby hospital caches for this hospital's area
    # This ensures fresh data for other users searching in this area
    invalidate_hospital_cache(hospital)
    
    return Response(
        EmergencyBookingSerializer(emergency_booking).data,
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_emergency_booking(request, booking_id):
    """
    Get emergency booking details
    GET /api/v1/healthcare/emergency/booking/{id}/
    """
    try:
        booking = EmergencyBooking.objects.select_related('hospital').get(
            id=booking_id,
            user=request.user
        )
        return Response(EmergencyBookingSerializer(booking).data)
    except EmergencyBooking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    """
    Update emergency booking status
    PUT /api/v1/healthcare/emergency/booking/{id}/status/
    """
    try:
        booking = EmergencyBooking.objects.select_related('hospital').get(
            id=booking_id,
            user=request.user
        )
    except EmergencyBooking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = UpdateBookingStatusSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    new_status = serializer.validated_data['status']
    notes = serializer.validated_data.get('notes', '')
    
    # Update status and relevant fields
    old_status = booking.status
    booking.status = new_status
    
    if new_status == 'arrived':
        booking.arrival_time = timezone.now()
    elif new_status == 'admitted':
        booking.admission_time = timezone.now()
        # Release the reserved bed when patient is admitted (bed now occupied by this patient)
        hospital = booking.hospital
        if booking.bed_type == 'general':
            hospital.available_general_beds = F('available_general_beds') + 1
        else:
            hospital.available_icu_beds = F('available_icu_beds') + 1
        hospital.save()
        # Invalidate cache when bed status changes
        invalidate_hospital_cache(hospital)
    elif new_status == 'cancelled':
        booking.cancellation_reason = notes
        # Release bed when cancelled
        hospital = booking.hospital
        if booking.bed_type == 'general':
            hospital.available_general_beds = F('available_general_beds') + 1
        else:
            hospital.available_icu_beds = F('available_icu_beds') + 1
        hospital.save()
        # Invalidate cache when bed status changes
        invalidate_hospital_cache(hospital)
    elif new_status == 'expired':
        # Release bed when reservation expires
        hospital = booking.hospital
        if booking.bed_type == 'general':
            hospital.available_general_beds = F('available_general_beds') + 1
        else:
            hospital.available_icu_beds = F('available_icu_beds') + 1
        hospital.save()
        # Invalidate cache when bed status changes
        invalidate_hospital_cache(hospital)
    
    if notes:
        booking.notes = notes
    
    booking.save()
    booking.refresh_from_db()
    
    return Response(EmergencyBookingSerializer(booking).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_booking(request):
    """
    Get user's active emergency booking
    GET /api/v1/healthcare/emergency/active/
    """
    booking = EmergencyBooking.objects.filter(
        user=request.user,
        status__in=['reserved', 'arrived']
    ).select_related('hospital').order_by('-created_at').first()
    
    if booking:
        return Response(EmergencyBookingSerializer(booking).data)
    else:
        return Response({'message': 'No active booking'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_emergency_bookings(request):
    """
    Get all emergency bookings for the user (for booking history)
    GET /api/v1/healthcare/emergency/bookings/
    """
    bookings = EmergencyBooking.objects.filter(
        user=request.user
    ).select_related('hospital').order_by('-created_at')
    
    return Response(EmergencyBookingSerializer(bookings, many=True).data)


# ============================================================================
# Insurance Provider and Verification Endpoints (Section 4)
# ============================================================================

class InsuranceProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for insurance providers - read only
    List all available insurance providers
    """
    queryset = InsuranceProvider.objects.filter(is_active=True)
    serializer_class = InsuranceProviderSerializer
    permission_classes = [IsAuthenticated]


class HospitalInsuranceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for hospital-insurance relationships - read only
    """
    queryset = HospitalInsurance.objects.filter(is_active=True).select_related('hospital', 'insurance_provider')
    serializer_class = HospitalInsuranceSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hospital_accepted_insurances(request, hospital_id):
    """
    Get all accepted insurances for a specific hospital
    GET /api/v1/healthcare/hospitals/{hospital_id}/accepted-insurances/
    """
    try:
        hospital = Hospital.objects.get(id=hospital_id)
    except Hospital.DoesNotExist:
        return Response(
            {'error': 'Hospital not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    hospital_insurances = HospitalInsurance.objects.filter(
        hospital=hospital,
        is_active=True
    ).select_related('insurance_provider')
    
    return Response(HospitalInsuranceSerializer(hospital_insurances, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_insurance_for_hospital(request):
    """
    Verify if user's insurance is accepted at a hospital
    POST /api/v1/healthcare/insurance/verify/
    Body: {
        "hospital_id": 1,
        "insurance_provider_id": 2
    }
    """
    serializer = InsuranceVerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    hospital_id = serializer.validated_data['hospital_id']
    insurance_provider_id = serializer.validated_data['insurance_provider_id']
    
    try:
        hospital_insurance = HospitalInsurance.objects.get(
            hospital_id=hospital_id,
            insurance_provider_id=insurance_provider_id,
            is_active=True
        )
        
        return Response({
            'verified': True,
            'hospital_name': hospital_insurance.hospital.name,
            'insurance_provider': hospital_insurance.insurance_provider.name,
            'is_in_network': hospital_insurance.is_in_network,
            'network_status': 'In-Network' if hospital_insurance.is_in_network else 'Out-of-Network',
            'copay_amount': str(hospital_insurance.copay_amount),
            'notes': hospital_insurance.notes
        })
    except HospitalInsurance.DoesNotExist:
        return Response({
            'verified': False,
            'message': 'This insurance is not accepted at the selected hospital'
        }, status=status.HTTP_200_OK)

