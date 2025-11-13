from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet, HospitalViewSet, TreatmentViewSet,
    BookingViewSet, PaymentViewSet, DashboardViewSet
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
]
