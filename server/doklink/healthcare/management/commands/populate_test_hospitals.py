from django.core.management.base import BaseCommand
from healthcare.models import Hospital


class Command(BaseCommand):
    help = 'Populate database with test hospitals for emergency booking testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating test hospitals...')
        
        # Test hospitals in Kolkata area with realistic data
        test_hospitals = [
            {
                'name': 'Apollo Gleneagles Hospitals',
                'address': '58, Canal Circular Road, Kadapara, Phool Bagan, Kankurgachi',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700054',
                'phone_number': '+913323203040',
                'email': 'info@apollogleneagles.com',
                'website': 'https://www.apollogleneagles.in',
                'latitude': 22.5445,
                'longitude': 88.3830,
                'total_general_beds': 45,
                'available_general_beds': 18,
                'total_icu_beds': 12,
                'available_icu_beds': 5,
                'accepts_insurance': True,
                'insurance_providers': 'Star Health, HDFC Ergo, ICICI Lombard, Max Bupa, Religare',
                'estimated_emergency_cost': 15000.00,
                'estimated_general_admission_cost': 8000.00,
            },
            {
                'name': 'AMRI Hospital Salt Lake',
                'address': 'JC-16 & 17, Sector III, Salt Lake City',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700098',
                'phone_number': '+913366063800',
                'email': 'contactus@amrihospitals.in',
                'website': 'https://www.amrihospitals.in',
                'latitude': 22.5840,
                'longitude': 88.4170,
                'total_general_beds': 38,
                'available_general_beds': 14,
                'total_icu_beds': 10,
                'available_icu_beds': 4,
                'accepts_insurance': True,
                'insurance_providers': 'Star Health, HDFC Ergo, National Insurance, United India Insurance',
                'estimated_emergency_cost': 12000.00,
                'estimated_general_admission_cost': 6500.00,
            },
            {
                'name': 'Fortis Hospital Anandapur',
                'address': '730, Eastern Metropolitan Bypass, Anandapur',
                'city': 'Kolkata',
                'state': 'West Bengal',
                'pin_code': '700107',
                'phone_number': '+913366284444',
                'email': 'info.kolkata@fortishealthcare.com',
                'website': 'https://www.fortishealthcare.com',
                'latitude': 22.5150,
                'longitude': 88.3960,
                'total_general_beds': 50,
                'available_general_beds': 22,
                'total_icu_beds': 15,
                'available_icu_beds': 7,
                'accepts_insurance': True,
                'insurance_providers': 'Star Health, ICICI Lombard, Bajaj Allianz, Care Health, Aditya Birla',
                'estimated_emergency_cost': 18000.00,
                'estimated_general_admission_cost': 10000.00,
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for hospital_data in test_hospitals:
            hospital, created = Hospital.objects.update_or_create(
                name=hospital_data['name'],
                city=hospital_data['city'],
                defaults=hospital_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {hospital.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'⟳ Updated: {hospital.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Done! Created {created_count} new hospitals, updated {updated_count} existing hospitals.'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'Total test hospitals in database: {Hospital.objects.count()}'
            )
        )
