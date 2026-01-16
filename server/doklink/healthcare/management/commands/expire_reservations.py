"""
Management command to expire old emergency bed reservations
Run this periodically via cron job or scheduler
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import F
from healthcare.models import EmergencyBooking


class Command(BaseCommand):
    help = 'Expire old emergency bed reservations and release beds'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Find expired reservations that are still in 'reserved' or 'patient_on_way' status
        expired_bookings = EmergencyBooking.objects.filter(
            status__in=['reserved', 'patient_on_way'],
            reservation_expires_at__lt=now
        ).select_related('hospital')
        
        count = 0
        for booking in expired_bookings:
            # Update status to expired
            booking.status = 'expired'
            booking.save()
            
            # Release the bed
            hospital = booking.hospital
            if booking.bed_type == 'general':
                hospital.available_general_beds = F('available_general_beds') + 1
            else:
                hospital.available_icu_beds = F('available_icu_beds') + 1
            hospital.save()
            
            count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Expired booking #{booking.id} for {booking.hospital.name} '
                    f'({booking.bed_type} bed released)'
                )
            )
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully expired {count} booking(s) and released beds')
            )
        else:
            self.stdout.write('No expired bookings found')
