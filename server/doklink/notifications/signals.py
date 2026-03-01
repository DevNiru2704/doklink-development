"""
Django signals to:
1. Sync HospitalBed changes → Hospital aggregate bed counts (for mobile app).
2. Send push notifications on authoritative hospital dashboard actions.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db.models import Q

from hospital_dashboard.models import (
    HospitalBed, HospitalPatient, HospitalClaim, HospitalActivity
)
from healthcare.models import Hospital

logger = logging.getLogger(__name__)


# ============================================================
# 1. BED SYNC: Keep Hospital.available_*_beds in sync
# ============================================================

@receiver(post_save, sender=HospitalBed)
def sync_hospital_bed_counts(sender, instance, **kwargs):
    """
    After any HospitalBed is saved, recalculate the aggregate
    bed counts on the shared Hospital model so the mobile app
    sees accurate availability.

    Mapping:
    - bed_category containing 'icu' (case-insensitive) → ICU beds
    - everything else → General beds
    """
    hospital = instance.hospital
    if not hospital:
        return

    beds = HospitalBed.objects.filter(hospital=hospital)

    # ICU beds = any bed whose category contains 'icu' (case-insensitive)
    icu_beds = beds.filter(bed_category__icontains='icu')
    general_beds = beds.exclude(bed_category__icontains='icu')

    hospital.total_icu_beds = icu_beds.count()
    hospital.available_icu_beds = icu_beds.filter(status='available').count()
    hospital.total_general_beds = general_beds.count()
    hospital.available_general_beds = general_beds.filter(status='available').count()

    hospital.save(update_fields=[
        'total_general_beds', 'available_general_beds',
        'total_icu_beds', 'available_icu_beds',
        'updated_at',
    ])

    logger.info(
        f"Bed sync for {hospital.name}: "
        f"General {hospital.available_general_beds}/{hospital.total_general_beds}, "
        f"ICU {hospital.available_icu_beds}/{hospital.total_icu_beds}"
    )


# ============================================================
# 2. PUSH NOTIFICATIONS on hospital dashboard actions
# ============================================================

@receiver(post_save, sender=HospitalPatient)
def notify_patient_status_change(sender, instance, created, **kwargs):
    """
    Send push notification when a patient is admitted or discharged
    via the hospital dashboard. We match the patient's phone number
    to a mobile app user.
    """
    # Import here to avoid circular imports
    from notifications.push_service import send_push_to_user_by_phone

    hospital_name = instance.hospital.name if instance.hospital else 'Hospital'

    if created and instance.status == 'Admitted':
        send_push_to_user_by_phone(
            phone_number=instance.phone,
            title='Hospital Admission Confirmed',
            body=f'You have been admitted to {hospital_name}. '
                 f'Diagnosis: {instance.diagnosis or "N/A"}. '
                 f'Bed: {instance.assigned_bed or "Pending assignment"}.',
            notification_type='admission',
            data={
                'patientId': str(instance.id),
                'hospitalId': str(instance.hospital_id),
                'screen': 'Dashboard',
            },
            hospital_name=hospital_name,
        )
    elif not created and instance.status == 'Discharged':
        send_push_to_user_by_phone(
            phone_number=instance.phone,
            title='Discharge Notification',
            body=f'You have been discharged from {hospital_name}. '
                 f'We wish you a speedy recovery!',
            notification_type='discharge',
            data={
                'patientId': str(instance.id),
                'hospitalId': str(instance.hospital_id),
                'screen': 'Dashboard',
            },
            hospital_name=hospital_name,
        )


# Track bed assignment changes for notifications
_bed_patient_cache = {}


@receiver(pre_save, sender=HospitalBed)
def cache_bed_previous_state(sender, instance, **kwargs):
    """Cache the previous patient_id before save to detect assignment changes."""
    if instance.pk:
        try:
            old = HospitalBed.objects.get(pk=instance.pk)
            _bed_patient_cache[instance.pk] = {
                'patient_id': old.patient_id,
                'status': old.status,
            }
        except HospitalBed.DoesNotExist:
            pass


@receiver(post_save, sender=HospitalBed)
def notify_bed_assignment(sender, instance, created, **kwargs):
    """
    Send push notification when a bed is assigned to or released from a patient.
    """
    from notifications.push_service import send_push_to_user_by_phone

    if created:
        return  # New bed creation, no patient notification needed

    old_state = _bed_patient_cache.pop(instance.pk, None)
    if not old_state:
        return

    old_patient_id = old_state.get('patient_id')
    new_patient_id = instance.patient_id
    hospital_name = instance.hospital.name if instance.hospital else 'Hospital'

    # Patient was assigned to this bed
    if new_patient_id and new_patient_id != old_patient_id:
        try:
            patient = HospitalPatient.objects.get(id=new_patient_id)
            send_push_to_user_by_phone(
                phone_number=patient.phone,
                title='Bed Assigned',
                body=f'You have been assigned to Bed {instance.bed_number} '
                     f'({instance.bed_category or "General"}) at {hospital_name}.',
                notification_type='bed_assigned',
                data={
                    'bedNumber': instance.bed_number,
                    'bedCategory': instance.bed_category,
                    'hospitalId': str(instance.hospital_id),
                    'screen': 'Dashboard',
                },
                hospital_name=hospital_name,
            )
        except HospitalPatient.DoesNotExist:
            pass

    # Patient was released from this bed
    elif old_patient_id and not new_patient_id:
        try:
            patient = HospitalPatient.objects.get(id=old_patient_id)
            send_push_to_user_by_phone(
                phone_number=patient.phone,
                title='Bed Released',
                body=f'You have been released from Bed {instance.bed_number} at {hospital_name}.',
                notification_type='bed_released',
                data={
                    'bedNumber': instance.bed_number,
                    'hospitalId': str(instance.hospital_id),
                    'screen': 'Dashboard',
                },
                hospital_name=hospital_name,
            )
        except HospitalPatient.DoesNotExist:
            pass


@receiver(post_save, sender=HospitalClaim)
def notify_claim_status_change(sender, instance, created, **kwargs):
    """
    Send push notification when an insurance claim is created or its status changes.
    """
    from notifications.push_service import send_push_to_user_by_phone

    hospital_name = instance.hospital.name if instance.hospital else 'Hospital'

    # Try to get patient phone from the linked patient record
    patient = instance.patient
    if not patient:
        return

    if created:
        send_push_to_user_by_phone(
            phone_number=patient.phone,
            title='Insurance Claim Submitted',
            body=f'An insurance claim of ₹{instance.claim_amount} has been submitted '
                 f'to {instance.insurer} by {hospital_name}.',
            notification_type='claim_update',
            data={
                'claimId': str(instance.id),
                'status': instance.status,
                'amount': str(instance.claim_amount),
                'screen': 'Dashboard',
            },
            hospital_name=hospital_name,
        )
    else:
        status_messages = {
            'Approved': f'Your insurance claim of ₹{instance.claim_amount} has been APPROVED. '
                        f'Approved amount: ₹{instance.approved_amount}.',
            'Rejected': f'Your insurance claim of ₹{instance.claim_amount} has been REJECTED by {instance.insurer}.',
            'Partial': f'Your insurance claim has been partially approved. '
                       f'Approved: ₹{instance.approved_amount}, Pending: ₹{instance.pending_amount}.',
        }

        if instance.status in status_messages:
            send_push_to_user_by_phone(
                phone_number=patient.phone,
                title=f'Claim {instance.status}',
                body=status_messages[instance.status],
                notification_type='claim_update',
                data={
                    'claimId': str(instance.id),
                    'status': instance.status,
                    'amount': str(instance.claim_amount),
                    'screen': 'Dashboard',
                },
                hospital_name=hospital_name,
            )
