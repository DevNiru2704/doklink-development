from django.core.management.base import BaseCommand
from healthcare.models import InsuranceProvider


class Command(BaseCommand):
    help = 'Populate common insurance providers in India'

    def handle(self, *args, **kwargs):
        insurance_providers = [
            # Major Private Health Insurance Providers
            {'name': 'ICICI Lombard Health Insurance', 'provider_code': 'ICICI_LOMBARD'},
            {'name': 'Star Health Insurance', 'provider_code': 'STAR_HEALTH'},
            {'name': 'HDFC ERGO Health Insurance', 'provider_code': 'HDFC_ERGO'},
            {'name': 'Max Bupa Health Insurance', 'provider_code': 'MAX_BUPA'},
            {'name': 'Bajaj Allianz Health Insurance', 'provider_code': 'BAJAJ_ALLIANZ'},
            {'name': 'Care Health Insurance', 'provider_code': 'CARE_HEALTH'},
            {'name': 'Niva Bupa Health Insurance', 'provider_code': 'NIVA_BUPA'},
            {'name': 'Aditya Birla Health Insurance', 'provider_code': 'ADITYA_BIRLA'},
            {'name': 'Manipal Cigna Health Insurance', 'provider_code': 'MANIPAL_CIGNA'},
            {'name': 'Reliance Health Insurance', 'provider_code': 'RELIANCE_HEALTH'},
            
            # Public Sector Insurance Companies
            {'name': 'New India Assurance', 'provider_code': 'NEW_INDIA'},
            {'name': 'National Insurance Company', 'provider_code': 'NATIONAL_INS'},
            {'name': 'Oriental Insurance Company', 'provider_code': 'ORIENTAL_INS'},
            {'name': 'United India Insurance', 'provider_code': 'UNITED_INDIA'},
            
            # Government Health Schemes
            {'name': 'Ayushman Bharat (PMJAY)', 'provider_code': 'PMJAY'},
            {'name': 'CGHS (Central Government Health Scheme)', 'provider_code': 'CGHS'},
            {'name': 'ESIC (Employee State Insurance)', 'provider_code': 'ESIC'},
            
            # Life Insurance Companies with Health Plans
            {'name': 'LIC Health Insurance', 'provider_code': 'LIC_HEALTH'},
            {'name': 'SBI Life Health Insurance', 'provider_code': 'SBI_LIFE'},
            
            # Digital/Online Insurance Providers
            {'name': 'Digit Health Insurance', 'provider_code': 'DIGIT_HEALTH'},
            {'name': 'Acko Health Insurance', 'provider_code': 'ACKO_HEALTH'},
            
            # Regional/Specialized Providers
            {'name': 'Apollo Munich Health Insurance', 'provider_code': 'APOLLO_MUNICH'},
            {'name': 'ManipalCigna ProHealth Insurance', 'provider_code': 'CIGNA_PROHEALTH'},
        ]

        created_count = 0
        updated_count = 0

        for provider_data in insurance_providers:
            provider, created = InsuranceProvider.objects.update_or_create(
                provider_code=provider_data['provider_code'],
                defaults={
                    'name': provider_data['name'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created: {provider.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated: {provider.name}')
                )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully populated {created_count + updated_count} insurance providers'
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
        self.stdout.write('='*60 + '\n')
