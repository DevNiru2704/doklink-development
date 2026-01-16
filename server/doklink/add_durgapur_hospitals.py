#!/usr/bin/env python
import os
import sys
import django

sys.path.append('/home/devniru2704/Personal Files/Programs/App development/doklink-development/server/doklink')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from healthcare.models import Hospital

# Add hospitals near Durgapur/Asansol area (user's location: 23.5181, 87.7462)
durgapur_hospitals = [
    {
        'name': 'AMRI Hospital Durgapur',
        'address': 'City Center, Durgapur',
        'city': 'Durgapur',
        'state': 'West Bengal',
        'pin_code': '713216',
        'phone_number': '+91-343-2548200',
        'latitude': 23.5204,
        'longitude': 87.3119,
        'total_general_beds': 60,
        'available_general_beds': 35,
        'total_icu_beds': 18,
        'available_icu_beds': 10,
    },
    {
        'name': 'IQ City Medical College',
        'address': 'Durgapur Expressway',
        'city': 'Durgapur',
        'state': 'West Bengal',
        'pin_code': '713212',
        'phone_number': '+91-343-2970200',
        'latitude': 23.5481,
        'longitude': 87.2950,
        'total_general_beds': 55,
        'available_general_beds': 30,
        'total_icu_beds': 15,
        'available_icu_beds': 8,
    },
    {
        'name': 'Durgapur Steel Plant Hospital',
        'address': 'DSP Township, Durgapur',
        'city': 'Durgapur',
        'state': 'West Bengal',
        'pin_code': '713205',
        'phone_number': '+91-343-2547100',
        'latitude': 23.5500,
        'longitude': 87.3200,
        'total_general_beds': 70,
        'available_general_beds': 40,
        'total_icu_beds': 20,
        'available_icu_beds': 12,
    },
    {
        'name': 'Asansol District Hospital',
        'address': 'SB Gorai Road, Asansol',
        'city': 'Asansol',
        'state': 'West Bengal',
        'pin_code': '713301',
        'phone_number': '+91-341-2222200',
        'latitude': 23.6739,
        'longitude': 86.9524,
        'total_general_beds': 65,
        'available_general_beds': 38,
        'total_icu_beds': 16,
        'available_icu_beds': 9,
    },
]

print("Adding hospitals near Durgapur/Asansol...\n")

for hospital_data in durgapur_hospitals:
    hospital, created = Hospital.objects.get_or_create(
        name=hospital_data['name'],
        defaults=hospital_data
    )
    
    if created:
        print(f"✓ Created: {hospital.name}")
        print(f"  Location: Lat {hospital.latitude}, Lon {hospital.longitude}")
        print(f"  Beds: General {hospital.available_general_beds}/{hospital.total_general_beds}, ICU {hospital.available_icu_beds}/{hospital.total_icu_beds}\n")
    else:
        print(f"→ Already exists: {hospital.name}\n")

print(f"\n✓ Complete! Total hospitals in database: {Hospital.objects.count()}")
