#!/usr/bin/env python
import os
import sys
import django

sys.path.append('/home/devniru2704/Personal Files/Programs/App development/doklink-development/server/doklink')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from healthcare.models import Hospital

# Update all hospitals with bed availability
hospitals = Hospital.objects.filter(latitude__isnull=False, longitude__isnull=False)

for hospital in hospitals:
    if hospital.total_general_beds == 0:
        hospital.total_general_beds = 50
        hospital.available_general_beds = 25
    
    if hospital.total_icu_beds == 0:
        hospital.total_icu_beds = 15
        hospital.available_icu_beds = 8
    
    hospital.save()
    print(f'Updated {hospital.name} - General: {hospital.available_general_beds}/{hospital.total_general_beds}, ICU: {hospital.available_icu_beds}/{hospital.total_icu_beds}')

print(f'\n✓ Updated {hospitals.count()} hospitals with bed availability')
