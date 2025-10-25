from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Prefetch
from django.utils import timezone
from datetime import timedelta

from .models import Doctor, Hospital, Treatment, Booking, Payment
from .serializers import (
    DoctorSerializer, HospitalSerializer, TreatmentSerializer,
    BookingSerializer, PaymentSerializer, DashboardSerializer
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
