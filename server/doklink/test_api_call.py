#!/usr/bin/env python
import os
import sys
import django

sys.path.append('/home/devniru2704/Personal Files/Programs/App development/doklink-development/server/doklink')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from healthcare.models import Hospital

# Simulate the API call with radius=150
user_lat = 23.5181103
user_lon = 87.746227
radius = 150

hospitals = Hospital.objects.filter(latitude__isnull=False, longitude__isnull=False)

nearby_hospitals = []
for hospital in hospitals:
    lat_diff = abs(float(hospital.latitude) - user_lat)
    lon_diff = abs(float(hospital.longitude) - user_lon)
    distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
    
    if distance <= radius:
        nearby_hospitals.append({
            'name': hospital.name,
            'distance': round(distance, 2),
            'general_beds': f"{hospital.available_general_beds}/{hospital.total_general_beds}",
            'icu_beds': f"{hospital.available_icu_beds}/{hospital.total_icu_beds}",
        })

nearby_hospitals.sort(key=lambda x: x['distance'])

print(f"User location: Lat {user_lat}, Lon {user_lon}")
print(f"Search radius: {radius} km")
print(f"\nFound {len(nearby_hospitals)} hospitals:\n")

for i, h in enumerate(nearby_hospitals, 1):
    print(f"{i}. {h['name']}")
    print(f"   Distance: {h['distance']} km")
    print(f"   Beds - General: {h['general_beds']}, ICU: {h['icu_beds']}")
    print()
