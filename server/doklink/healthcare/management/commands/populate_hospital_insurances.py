from django.core.management.base import BaseCommand
from healthcare.models import Hospital, InsuranceProvider, HospitalInsurance
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Populate hospital-insurance relationships for test hospitals'

    def handle(self, *args, **kwargs):
        hospitals = Hospital.objects.all()
        providers = list(InsuranceProvider.objects.filter(is_active=True))

        if not hospitals.exists():
            self.stdout.write(
                self.style.ERROR('No hospitals found. Run populate_test_hospitals first.')
            )
            return

        if not providers:
            self.stdout.write(
                self.style.ERROR('No insurance providers found. Run populate_insurances first.')
            )
            return

        created_count = 0
        updated_count = 0

        # Major hospitals typically accept more insurance providers
        major_hospital_names = ['Apollo', 'AMRI', 'Fortis', 'Medica', 'Narayana', 'AIIMS']

        for hospital in hospitals:
            # Determine how many insurances this hospital should accept
            is_major = any(name in hospital.name for name in major_hospital_names)
            num_insurances = random.randint(8, 15) if is_major else random.randint(4, 8)

            # Select random insurance providers
            selected_providers = random.sample(providers, min(num_insurances, len(providers)))

            for provider in selected_providers:
                # 80% chance of being in-network for major hospitals, 60% for others
                is_in_network = random.random() < (0.8 if is_major else 0.6)
                
                # Copay amounts: 0 for in-network, 500-2000 for out-of-network
                copay_amount = Decimal('0.00') if is_in_network else Decimal(random.randint(500, 2000))

                hospital_insurance, created = HospitalInsurance.objects.update_or_create(
                    hospital=hospital,
                    insurance_provider=provider,
                    defaults={
                        'is_in_network': is_in_network,
                        'copay_amount': copay_amount,
                        'is_active': True,
                        'notes': f'{"In-network" if is_in_network else "Out-of-network"} provider for {hospital.name}'
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {hospital.name}: {num_insurances} insurance providers linked'
                )
            )

        self.stdout.write('\n' + '='*70)
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully populated hospital-insurance relationships'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'   - {created_count} newly created'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'   - {updated_count} updated'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'   - {hospitals.count()} hospitals configured'
            )
        )
        self.stdout.write('='*70 + '\n')
