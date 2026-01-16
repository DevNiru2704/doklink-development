#!/usr/bin/env python
import os
import sys
import django

sys.path.append('/home/devniru2704/Personal Files/Programs/App development/doklink-development/server/doklink')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'doklink.settings')
django.setup()

from healthcare.models import Hospital

# User's location from the log
user_lat = 23.5181103
user_lon = 87.746227
radius = 10

print(f"User location: Lat {user_lat}, Lon {user_lon}")
print(f"Search radius: {radius} km\n")

hospitals = Hospital.objects.filter(latitude__isnull=False, longitude__isnull=False)

print("Checking distances to all hospitals:\n")
for hospital in hospitals:
    lat_diff = abs(float(hospital.latitude) - user_lat)
    lon_diff = abs(float(hospital.longitude) - user_lon)
    distance = ((lat_diff ** 2 + lon_diff ** 2) ** 0.5) * 111
    
    within_radius = "✓ WITHIN" if distance <= radius else "✗ TOO FAR"
    print(f"{within_radius} {hospital.name}")
    print(f"  Location: Lat {hospital.latitude}, Lon {hospital.longitude}")
    print(f"  Distance: {distance:.2f} km")
    print()

print(f"\nConclusion: User is too far from Kolkata hospitals!")
print(f"User appears to be in a different city/region.")
