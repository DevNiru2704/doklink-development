"""
Management command to update existing bookings to admitted status with admission times
Usage: python manage.py prepare_bookings_for_expenses
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from healthcare.models import EmergencyBooking


class Command(BaseCommand):
    help = 'Prepare bookings by setting them to admitted status with admission times'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--booking-id',
            type=int,
            help='Update a specific booking ID'
        )
    
    def handle(self, *args, **options):
        # Get bookings to update
        if options['booking_id']:
            bookings = EmergencyBooking.objects.filter(id=options['booking_id'])
        else:
            # Get arrived or reserved bookings
            bookings = EmergencyBooking.objects.filter(
                status__in=['arrived', 'reserved']
            )
        
        if not bookings.exists():
            self.stdout.write(self.style.WARNING('No bookings found to update'))
            return
        
        self.stdout.write(f'Found {bookings.count()} bookings to update')
        
        updated_count = 0
        for booking in bookings:
            # Set admission time (1-7 days ago)
            days_ago = random.randint(1, 7)
            admission_time = timezone.now() - timedelta(days=days_ago)
            
            booking.status = 'admitted'
            booking.admission_time = admission_time
            booking.save()
            
            self.stdout.write(
                f'  ✓ Updated booking #{booking.id}: admitted {days_ago} days ago'
            )
            updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated {updated_count} bookings to admitted status'))
