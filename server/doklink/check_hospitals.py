#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the path
sys.path.append('/home/devniru2704/Personal Files/Programs/App development/doklink-development/server/doklink')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from healthcare.models import Hospital

print(f'Total hospitals: {Hospital.objects.count()}')
hospitals = Hospital.objects.filter(latitude__isnull=False, longitude__isnull=False)
print(f'Hospitals with coordinates: {hospitals.count()}')
print('\nHospitals list:')
for h in hospitals:
    print(f'  - {h.name}')
    print(f'    Location: Lat {h.latitude}, Lon {h.longitude}')
    print(f'    Beds: General {h.available_general_beds}/{h.total_general_beds}, ICU {h.available_icu_beds}/{h.total_icu_beds}')
    print()
