#!/usr/bin/env python
"""
Test script for dashboard API
Run with: python test_dashboard_api.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from django.contrib.auth.models import User
from healthcare.models import Doctor, Hospital, Treatment, Booking, Payment
from healthcare.serializers import DashboardSerializer
from django.utils import timezone
from datetime import timedelta

def test_dashboard():
    print("Testing Dashboard API...")
    print("=" * 50)
    
    # Get test user
    try:
        user = User.objects.get(username='testuser')
        print(f"✓ Found user: {user.username}")
    except User.DoesNotExist:
        print("✗ Test user not found. Run: python manage.py populate_mock_data")
        return
    
    # Check data
    treatments = Treatment.objects.filter(user=user, status='ongoing')
    print(f"✓ Ongoing treatments: {treatments.count()}")
    
    today = timezone.now().date()
    bookings = Booking.objects.filter(
        user=user,
        booking_date__gte=today,
        status__in=['confirmed', 'pending']
    )
    print(f"✓ Upcoming bookings: {bookings.count()}")
    
    payments = Payment.objects.filter(
        user=user,
        due_date__gte=today,
        status='pending'
    )
    print(f"✓ Upcoming payments: {payments.count()}")
    
    # Test serialization
    print("\n" + "=" * 50)
    print("Sample Treatment:")
    if treatments.exists():
        t = treatments.first()
        print(f"  - {t.treatment_name}")
        print(f"  - Doctor: {t.doctor.name}")
        print(f"  - Hospital: {t.hospital.name}")
    
    print("\nSample Booking:")
    if bookings.exists():
        b = bookings.first()
        print(f"  - {b.get_booking_type_display()}")
        print(f"  - Hospital: {b.hospital.name}")
        print(f"  - Date: {b.booking_date} at {b.booking_time}")
        print(f"  - Status: {b.get_status_display()}")
    
    print("\nSample Payment:")
    if payments.exists():
        p = payments.first()
        print(f"  - {p.title}")
        print(f"  - Amount: ₹{p.amount}")
        print(f"  - Due: {p.due_date}")
    
    print("\n" + "=" * 50)
    print("✅ Dashboard API test completed successfully!")
    print("\nTo test via HTTP:")
    print("1. Start server: python manage.py runserver")
    print("2. Login to get token")
    print("3. GET /api/v1/healthcare/dashboard/")

if __name__ == '__main__':
    test_dashboard()
