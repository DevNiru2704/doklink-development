from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, date, time
from healthcare.models import Doctor, Hospital, Treatment, Booking, Payment


class Command(BaseCommand):
    help = 'Populate database with mock healthcare data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating mock data...')
        
        # Try to find the real user first, otherwise create test user
        try:
            user = User.objects.get(username='nirmalyamandal342')
            self.stdout.write(f'Using existing user: {user.username} ({user.email})')
        except User.DoesNotExist:
            # Fallback to test user
            user, created = User.objects.get_or_create(
                username='testuser',
                defaults={
                    'email': 'test@example.com',
                    'first_name': 'Krishnendu',
                    'last_name': 'Test'
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created test user: {user.username}'))
            else:
                self.stdout.write(f'Using existing user: {user.username}')
        
        # Create Doctors
        doctors_data = [
            {'name': 'Amit Bose', 'specialization': 'General Physician'},
            {'name': 'Sneha Das', 'specialization': 'Physiotherapist'},
            {'name': 'Rajesh Kumar', 'specialization': 'Cardiologist'},
        ]
        
        doctors = []
        for doc_data in doctors_data:
            doctor, created = Doctor.objects.get_or_create(
                name=doc_data['name'],
                defaults={'specialization': doc_data['specialization']}
            )
            doctors.append(doctor)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created doctor: {doctor.name}'))
        
        # Create Hospitals with coordinates (Kolkata area)
        hospitals_data = [
            {
                'name': 'Apollo Hospital',
                'address': 'Sector V, Salt Lake',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700091',
                'latitude': 22.5726,
                'longitude': 88.4324
            },
            {
                'name': 'AMRI Hospital',
                'address': 'JC 16 & 17, Sector III',
                'city': 'Dhakuria',
                'state': 'West Bengal',
                'pin_code': '700029',
                'latitude': 22.5099,
                'longitude': 88.3629
            },
            {
                'name': 'Narayana Multi-speciality Hospital',
                'address': '120/1 Andul Road',
                'city': 'Howrah',
                'state': 'West Bengal',
                'pin_code': '711103',
                'latitude': 22.5958,
                'longitude': 88.2636
            },
            {
                'name': 'Fortis Hospital',
                'address': '730, Anandapur',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700107',
                'latitude': 22.5126,
                'longitude': 88.3976
            },
            {
                'name': 'Peerless Hospital',
                'address': '360, Panchasayar',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700094',
                'latitude': 22.5204,
                'longitude': 88.3961
            },
        ]
        
        hospitals = []
        for hosp_data in hospitals_data:
            hospital, created = Hospital.objects.get_or_create(
                name=hosp_data['name'],
                defaults=hosp_data
            )
            hospitals.append(hospital)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created hospital: {hospital.name}'))
        
        # Clear existing data for this user
        Treatment.objects.filter(user=user).delete()
        Booking.objects.filter(user=user).delete()
        Payment.objects.filter(user=user).delete()
        self.stdout.write('Cleared existing data for user')
        
        # Create Treatments
        treatments_data = [
            {
                'treatment_name': 'Hypertension Management',
                'doctor': doctors[0],
                'hospital': hospitals[0],
                'started_date': date(2025, 9, 1),
                'status': 'ongoing'
            },
            {
                'treatment_name': 'Physiotherapy',
                'doctor': doctors[1],
                'hospital': hospitals[1],
                'started_date': date(2025, 9, 15),
                'status': 'ongoing'
            },
        ]
        
        for treat_data in treatments_data:
            treatment = Treatment.objects.create(
                user=user,
                **treat_data
            )
            self.stdout.write(self.style.SUCCESS(f'Created treatment: {treatment.treatment_name}'))
        
        # Create Bookings
        today = timezone.now().date()
        bookings_data = [
            {
                'booking_type': 'hospital_bed',
                'hospital': hospitals[2],
                'booking_date': date(2025, 11, 8),
                'booking_time': time(10, 0),
                'status': 'confirmed',
                'location_details': 'General Ward - Bed 204'
            },
            {
                'booking_type': 'doctor_appointment',
                'hospital': hospitals[0],
                'doctor': doctors[2],
                'booking_date': date(2025, 11, 10),
                'booking_time': time(15, 30),
                'status': 'confirmed',
                'location_details': ''
            },
            {
                'booking_type': 'follow_up',
                'hospital': hospitals[1],
                'doctor': doctors[1],
                'booking_date': today + timedelta(days=5),
                'booking_time': time(11, 0),
                'status': 'pending',
                'location_details': ''
            },
        ]
        
        for book_data in bookings_data:
            booking = Booking.objects.create(
                user=user,
                **book_data
            )
            self.stdout.write(self.style.SUCCESS(f'Created booking: {booking.get_booking_type_display()}'))
        
        # Create Payments (including history - paid payments)
        payments_data = [
            # Upcoming payments
            {
                'payment_type': 'insurance_premium',
                'title': 'Mediclaim Premium',
                'provider_name': 'Star Health Insurance',
                'amount': 12500.00,
                'due_date': date(2025, 11, 12),
                'status': 'pending'
            },
            {
                'payment_type': 'hospital_bill',
                'title': 'Hospital Bill',
                'provider_name': 'Narayana Hospital',
                'amount': 8450.00,
                'due_date': date(2025, 11, 9),
                'status': 'pending',
                'hospital': hospitals[2] if len(hospitals) > 2 else None
            },
            {
                'payment_type': 'insurance_renewal',
                'title': 'Insurance Renewal',
                'provider_name': 'ICICI Lombard',
                'amount': 25000.00,
                'due_date': date(2025, 11, 20),
                'status': 'pending'
            },
            # Payment history (paid)
            {
                'payment_type': 'doctor_fee',
                'title': 'Consultation Fee',
                'provider_name': 'Dr. Amit Bose',
                'amount': 800.00,
                'due_date': date(2025, 9, 15),
                'paid_date': date(2025, 9, 15),
                'status': 'paid',
                'doctor': doctors[0] if len(doctors) > 0 else None
            },
            {
                'payment_type': 'lab_test',
                'title': 'Blood Test',
                'provider_name': 'Apollo Diagnostics',
                'amount': 1500.00,
                'due_date': date(2025, 9, 20),
                'paid_date': date(2025, 9, 22),
                'status': 'paid',
                'hospital': hospitals[0] if len(hospitals) > 0 else None
            },
            {
                'payment_type': 'medicine',
                'title': 'Monthly Medicines',
                'provider_name': 'Apollo Pharmacy',
                'amount': 3200.00,
                'due_date': date(2025, 10, 1),
                'paid_date': date(2025, 10, 1),
                'status': 'paid'
            },
            {
                'payment_type': 'hospital_bill',
                'title': 'Physiotherapy Session',
                'provider_name': 'AMRI Hospital',
                'amount': 2500.00,
                'due_date': date(2025, 10, 10),
                'paid_date': date(2025, 10, 10),
                'status': 'paid',
                'hospital': hospitals[1] if len(hospitals) > 1 else None
            },
            {
                'payment_type': 'insurance_premium',
                'title': 'Health Insurance Premium',
                'provider_name': 'Star Health Insurance',
                'amount': 12500.00,
                'due_date': date(2025, 8, 12),
                'paid_date': date(2025, 8, 10),
                'status': 'paid'
            },
        ]
        
        for pay_data in payments_data:
            payment = Payment.objects.create(
                user=user,
                **pay_data
            )
            status_text = 'paid' if pay_data['status'] == 'paid' else 'pending'
            self.stdout.write(self.style.SUCCESS(f'Created payment ({status_text}): {payment.title}'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Mock data created successfully!'))
        self.stdout.write(f'User: {user.username}')
        self.stdout.write(f'Doctors: {Doctor.objects.count()}')
        self.stdout.write(f'Hospitals: {Hospital.objects.count()}')
        self.stdout.write(f'Treatments: {Treatment.objects.filter(user=user).count()}')
        self.stdout.write(f'Bookings: {Booking.objects.filter(user=user).count()}')
        self.stdout.write(f'Payments: {Payment.objects.filter(user=user).count()}')
