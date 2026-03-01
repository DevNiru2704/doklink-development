from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.postgres.fields import ArrayField
from healthcare.models import Hospital


class HospitalStaff(models.Model):
    """
    Staff users for the hospital web dashboard.
    Separate from the mobile app's Django User model.
    Authenticated via NextAuth (credentials provider) against this table.
    """
    ROLE_CHOICES = [
        ('SuperAdmin', 'Super Administrator'),
        ('HospitalAdmin', 'Hospital Administrator'),
        ('BasicUser', 'Basic User'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='staff',
        null=True, blank=True,
        help_text="Null for SuperAdmin users"
    )
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=200)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='BasicUser')
    is_active = models.BooleanField(default=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    permissions = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Staff"
        verbose_name_plural = "Hospital Staff"
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['hospital', 'role']),
        ]

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.hospital.name if self.hospital else 'SuperAdmin'}"


class HospitalBedConfig(models.Model):
    """
    Custom dropdown options for bed management per hospital.
    Each hospital can define their own bed categories, departments, floors, wings.
    """
    hospital = models.OneToOneField(
        Hospital, on_delete=models.CASCADE,
        related_name='bed_config'
    )
    bed_categories = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list,
    )
    departments = ArrayField(
        models.CharField(max_length=100),
        blank=True, default=list,
    )
    floors = ArrayField(
        models.CharField(max_length=50),
        blank=True, default=list,
    )
    wings = ArrayField(
        models.CharField(max_length=20),
        blank=True, default=list,
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Bed Config"
        verbose_name_plural = "Hospital Bed Configs"

    def __str__(self):
        return f"Bed Config - {self.hospital.name}"


class HospitalPatient(models.Model):
    """
    Patient records as managed by the hospital dashboard.
    These are hospital-side admission records, not the mobile app user profiles.
    """
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('Waiting', 'Waiting'),
        ('Admitted', 'Admitted'),
        ('Discharged', 'Discharged'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='dashboard_patients'
    )
    linked_user = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='hospital_patient_records',
        help_text="Link to mobile app user (matched by phone number)"
    )
    uhid = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=200)
    age = models.PositiveSmallIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Male')
    admission_date = models.DateTimeField(null=True, blank=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    diagnosis = models.TextField(blank=True)
    assigned_bed = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Waiting')
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True, default='None')
    medications = models.TextField(blank=True, default='None')
    admission_history = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Patient"
        verbose_name_plural = "Hospital Patients"
        indexes = [
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['uhid']),
        ]

    def __str__(self):
        return f"{self.name} ({self.uhid}) - {self.hospital.name}"


class HospitalDocument(models.Model):
    """Medical documents uploaded for patients"""
    DOCUMENT_TYPE_CHOICES = [
        ('Report', 'Report'),
        ('Prescription', 'Prescription'),
        ('Lab Result', 'Lab Result'),
        ('Discharge Summary', 'Discharge Summary'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='dashboard_documents'
    )
    patient = models.ForeignKey(
        HospitalPatient, on_delete=models.CASCADE,
        related_name='documents'
    )
    doc_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES)
    name = models.CharField(max_length=300)
    url = models.URLField(max_length=500)
    date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Document"
        verbose_name_plural = "Hospital Documents"
        indexes = [
            models.Index(fields=['hospital', 'patient']),
        ]

    def __str__(self):
        return f"{self.doc_type}: {self.name} - Patient {self.patient.uhid}"


class HospitalClaim(models.Model):
    """Insurance claims tracked by the hospital"""
    CLAIM_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Partial', 'Partial'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='dashboard_claims'
    )
    patient = models.ForeignKey(
        HospitalPatient, on_delete=models.CASCADE,
        related_name='claims'
    )
    patient_name = models.CharField(max_length=200)
    policy_number = models.CharField(max_length=100)
    insurer = models.CharField(max_length=200)
    claim_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rejected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=15, choices=CLAIM_STATUS_CHOICES, default='Pending')
    submission_date = models.DateField(null=True, blank=True)
    diagnosis = models.TextField(blank=True)
    treatment = models.TextField(blank=True)

    # JSON fields for complex nested data
    expenses = models.JSONField(default=list, blank=True)
    approval_history = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Claim"
        verbose_name_plural = "Hospital Claims"
        indexes = [
            models.Index(fields=['hospital', 'status']),
        ]

    def __str__(self):
        return f"Claim {self.id} - {self.patient_name} ({self.status})"


class HospitalBed(models.Model):
    """Individual bed records for the hospital dashboard."""
    BED_STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('maintenance', 'Maintenance'),
        ('reserved', 'Reserved'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='dashboard_beds'
    )
    bed_number = models.CharField(max_length=20)
    bed_category = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=100, blank=True, default='NA')
    floor = models.CharField(max_length=20, blank=True)
    wing = models.CharField(max_length=10, blank=True, default='NA')
    ward = models.CharField(max_length=50, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=BED_STATUS_CHOICES, default='available')

    # Equipment flags
    has_monitor = models.BooleanField(default=False)
    has_oxygen = models.BooleanField(default=False)
    has_ventilator = models.BooleanField(default=False)

    # Optional patient assignment
    patient = models.ForeignKey(
        HospitalPatient, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='beds'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital Bed"
        verbose_name_plural = "Hospital Beds"
        unique_together = ['hospital', 'bed_number']
        indexes = [
            models.Index(fields=['hospital', 'status']),
        ]

    def __str__(self):
        return f"Bed {self.bed_number} ({self.bed_category}) - {self.hospital.name}"


class HospitalActivity(models.Model):
    """Activity log for the hospital dashboard"""
    ACTIVITY_TYPE_CHOICES = [
        ('admission', 'Admission'),
        ('discharge', 'Discharge'),
        ('claim', 'Claim'),
    ]

    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='dashboard_activities'
    )
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPE_CHOICES)
    description = models.TextField()
    reference_id = models.CharField(max_length=50, blank=True)
    time = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Hospital Activity"
        verbose_name_plural = "Hospital Activities"
        ordering = ['-time']
        indexes = [
            models.Index(fields=['hospital']),
        ]

    def __str__(self):
        return f"{self.activity_type}: {self.description[:50]}"


class HospitalSequence(models.Model):
    """Atomic counters for generating sequential IDs per hospital"""
    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE,
        related_name='sequences'
    )
    sequence_name = models.CharField(max_length=50)
    current_val = models.BigIntegerField(default=0)

    class Meta:
        verbose_name = "Hospital Sequence"
        verbose_name_plural = "Hospital Sequences"
        unique_together = ['hospital', 'sequence_name']

    def __str__(self):
        return f"{self.hospital.name} - {self.sequence_name}: {self.current_val}"
