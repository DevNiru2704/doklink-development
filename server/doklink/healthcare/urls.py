from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet, HospitalViewSet, TreatmentViewSet,
    BookingViewSet, PaymentViewSet, DashboardViewSet,
    trigger_emergency, get_nearby_hospitals, book_emergency_bed,
    get_emergency_booking, update_booking_status, get_active_booking,
    get_emergency_bookings
)

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'treatments', TreatmentViewSet, basename='treatment')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
    
    # Emergency endpoints
    path('emergency/trigger/', trigger_emergency, name='emergency-trigger'),
    path('emergency/hospitals/nearby/', get_nearby_hospitals, name='emergency-nearby-hospitals'),
    path('emergency/book-bed/', book_emergency_bed, name='emergency-book-bed'),
    path('emergency/booking/<int:booking_id>/', get_emergency_booking, name='emergency-booking-detail'),
    path('emergency/booking/<int:booking_id>/status/', update_booking_status, name='emergency-booking-status'),
    path('emergency/active/', get_active_booking, name='emergency-active-booking'),
    path('emergency/bookings/', get_emergency_bookings, name='emergency-bookings-list'),
]
