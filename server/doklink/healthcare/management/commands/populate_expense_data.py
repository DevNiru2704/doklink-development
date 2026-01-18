"""
Management command to populate dummy expense data for existing emergency bookings
Usage: python manage.py populate_expense_data
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

from healthcare.models import EmergencyBooking, DailyExpense, OutOfPocketPayment


class Command(BaseCommand):
    help = 'Populate dummy daily expense data for emergency bookings'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--booking-id',
            type=int,
            help='Populate expenses for a specific booking ID'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing expenses before populating'
        )
    
    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing expenses...')
            DailyExpense.objects.all().delete()
            OutOfPocketPayment.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Cleared all expenses'))
        
        # Get bookings to populate
        if options['booking_id']:
            bookings = EmergencyBooking.objects.filter(id=options['booking_id'])
        else:
            # Get admitted or discharged bookings
            bookings = EmergencyBooking.objects.filter(
                status__in=['admitted', 'discharged']
            ).select_related('hospital', 'user')
        
        if not bookings.exists():
            self.stdout.write(self.style.WARNING('No admitted or discharged bookings found'))
            return
        
        self.stdout.write(f'Found {bookings.count()} bookings to populate')
        
        for booking in bookings:
            self.populate_booking_expenses(booking)
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully populated expenses for {bookings.count()} bookings'))
    
    def populate_booking_expenses(self, booking):
        """Populate expenses for a single booking"""
        self.stdout.write(f'\nProcessing booking #{booking.id} - {booking.hospital.name}')
        
        # Determine admission and discharge dates
        if not booking.admission_time:
            self.stdout.write(self.style.WARNING('  Skipping: No admission time'))
            return
        
        admission_date = booking.admission_time.date()
        
        if booking.status == 'discharged' and booking.discharge_date:
            discharge_date = booking.discharge_date.date()
        else:
            # If still admitted, use up to today or 3-7 days from admission
            days_admitted = random.randint(3, 7)
            discharge_date = min(admission_date + timedelta(days=days_admitted), date.today())
        
        # Calculate days in hospital
        days_count = (discharge_date - admission_date).days + 1
        self.stdout.write(f'  Admission: {admission_date} → Discharge: {discharge_date} ({days_count} days)')
        
        # Expense templates
        expense_templates = self.get_expense_templates(booking.bed_type)
        
        total_amount = Decimal('0')
        expenses_created = 0
        
        # Generate daily expenses
        current_date = admission_date
        while current_date <= discharge_date:
            day_number = (current_date - admission_date).days + 1
            
            # Select expenses for this day
            day_expenses = self.select_day_expenses(day_number, days_count, expense_templates)
            
            for expense_type, description, base_amount in day_expenses:
                # Add some variation to amounts
                variation = random.uniform(0.9, 1.1)
                amount = Decimal(str(round(base_amount * variation, 2)))
                
                # Insurance coverage (70-90% for general, 60-80% for ICU)
                if booking.bed_type == 'general':
                    coverage_percent = random.uniform(0.70, 0.90)
                else:  # ICU
                    coverage_percent = random.uniform(0.60, 0.80)
                
                insurance_covered = Decimal(str(round(float(amount) * coverage_percent, 2)))
                patient_share = amount - insurance_covered
                
                # Create expense
                DailyExpense.objects.create(
                    admission=booking,
                    date=current_date,
                    expense_type=expense_type,
                    description=f"Day {day_number}: {description}",
                    amount=amount,
                    insurance_covered=insurance_covered,
                    patient_share=patient_share,
                    verified=True if day_number < days_count else False  # Last day not verified yet
                )
                
                total_amount += amount
                expenses_created += 1
            
            current_date += timedelta(days=1)
        
        self.stdout.write(f'  Created {expenses_created} expense entries')
        self.stdout.write(f'  Total bill: ₹{total_amount:,.2f}')
        
        # Update booking financial fields
        insurance_approved = Decimal(str(round(float(total_amount) * 0.75, 2)))  # 75% average coverage
        out_of_pocket = total_amount - insurance_approved
        
        booking.total_bill_amount = total_amount
        booking.insurance_approved_amount = insurance_approved
        booking.out_of_pocket_amount = out_of_pocket
        
        # If discharged, set discharge date
        if booking.status != 'discharged':
            booking.status = 'discharged'
            booking.discharge_date = timezone.make_aware(
                timezone.datetime.combine(discharge_date, timezone.datetime.min.time())
            )
        
        booking.save()
        
        self.stdout.write(f'  Insurance approved: ₹{insurance_approved:,.2f} (75%)')
        self.stdout.write(f'  Out-of-pocket: ₹{out_of_pocket:,.2f} (25%)')
        
        # Create OutOfPocketPayment record
        OutOfPocketPayment.objects.get_or_create(
            admission=booking,
            defaults={
                'total_amount': total_amount,
                'insurance_covered': insurance_approved,
                'out_of_pocket': out_of_pocket,
                'payment_status': 'pending'
            }
        )
        
        self.stdout.write(self.style.SUCCESS(f'  ✓ Completed booking #{booking.id}'))
    
    def get_expense_templates(self, bed_type):
        """Get expense templates based on bed type"""
        # Base expenses (applicable to all)
        base_expenses = [
            ('room', 'Room charges', 5000 if bed_type == 'general' else 15000),
            ('doctor_fee', 'Doctor consultation', 1500),
            ('nursing', 'Nursing care', 2000 if bed_type == 'general' else 5000),
            ('medicine', 'Medicines and IV fluids', 3000),
            ('test', 'Blood tests and diagnostics', 2500),
        ]
        
        # ICU-specific expenses
        if bed_type == 'icu':
            base_expenses.extend([
                ('equipment', 'Ventilator and monitoring equipment', 10000),
                ('therapy', 'Intensive care therapy', 8000),
            ])
        
        # One-time procedures (day 1 or 2)
        procedures = [
            ('procedure', 'Emergency medical procedure', 25000),
            ('test', 'CT Scan', 8000),
            ('test', 'MRI Scan', 12000),
            ('test', 'X-Ray', 1500),
            ('test', 'Ultrasound', 2000),
        ]
        
        return {
            'daily': base_expenses,
            'procedures': procedures
        }
    
    def select_day_expenses(self, day_number, total_days, templates):
        """Select which expenses to apply for a given day"""
        expenses = []
        
        # Daily recurring expenses
        expenses.extend(templates['daily'])
        
        # Day 1: Admission charges + initial tests
        if day_number == 1:
            expenses.append(('miscellaneous', 'Admission and registration', 2000))
            expenses.append(templates['procedures'][3])  # X-Ray
            
            # 50% chance of major scan
            if random.random() < 0.5:
                expenses.append(random.choice(templates['procedures'][:3]))
        
        # Day 2: Potential procedure
        elif day_number == 2:
            if random.random() < 0.4:  # 40% chance
                expenses.append(templates['procedures'][0])  # Emergency procedure
        
        # Middle days: Standard care
        elif day_number < total_days:
            # Random additional tests (20% chance)
            if random.random() < 0.2:
                expenses.append(random.choice(templates['procedures'][3:]))
        
        # Last day: Discharge
        elif day_number == total_days:
            expenses.append(('miscellaneous', 'Discharge and final consultation', 1500))
        
        return expenses
