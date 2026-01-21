from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator, MinValueValidator
from phonenumber_field.modelfields import PhoneNumberField


class Doctor(models.Model):
    """Normalized Doctor model"""
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200, blank=True)
    phone_number = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    registration_number = models.CharField(max_length=100, blank=True, help_text="Medical registration number")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Doctor"
        verbose_name_plural = "Doctors"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['specialization']),
        ]

    def __str__(self):
        if self.specialization:
            return f"Dr. {self.name} - {self.specialization}"
        return f"Dr. {self.name}"


class Hospital(models.Model):
    """Normalized Hospital model"""
    name = models.CharField(max_length=300)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pin_code = models.CharField(
        max_length=6,
        validators=[
            RegexValidator(
                regex=r'^[1-9][0-9]{5}$',
                message="PIN code must be exactly 6 digits"
            )
        ]
    )
    phone_number = PhoneNumberField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Location coordinates for Google Maps
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Emergency bed availability
    total_general_beds = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Total general beds in hospital")
    available_general_beds = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Currently available general beds")
    total_icu_beds = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Total ICU beds in hospital")
    available_icu_beds = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Currently available ICU beds")
    
    # Insurance and cost estimates
    accepts_insurance = models.BooleanField(default=True)
    insurance_providers = models.TextField(blank=True, help_text="Comma-separated list of accepted insurance providers")
    estimated_emergency_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Estimated cost for emergency admission")
    estimated_general_admission_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Estimated cost for general admission")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital"
        verbose_name_plural = "Hospitals"
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['available_general_beds']),
            models.Index(fields=['available_icu_beds']),
        ]

    def __str__(self):
        return f"{self.name}, {self.city}"


class Treatment(models.Model):
    """Patient's ongoing treatments"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='treatments')
    treatment_name = models.CharField(max_length=300)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, related_name='treatments')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, related_name='treatments')
    started_date = models.DateField()
    expected_end_date = models.DateField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('ongoing', 'Ongoing'),
            ('completed', 'Completed'),
            ('paused', 'Paused'),
            ('cancelled', 'Cancelled'),
        ],
        default='ongoing'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Treatment"
        verbose_name_plural = "Treatments"
        ordering = ['-started_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['started_date']),
        ]

    def __str__(self):
        return f"{self.treatment_name} - {self.user.username}"


class Booking(models.Model):
    """Patient's bookings (appointments, hospital beds, follow-ups)"""
    BOOKING_TYPE_CHOICES = [
        ('doctor_appointment', 'Doctor Appointment'),
        ('hospital_bed', 'Hospital Bed'),
        ('follow_up', 'Follow-up'),
        ('lab_test', 'Lab Test'),
        ('surgery', 'Surgery'),
        ('consultation', 'Consultation'),
    ]

    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('rescheduled', 'Rescheduled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    booking_type = models.CharField(max_length=30, choices=BOOKING_TYPE_CHOICES)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, related_name='bookings')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    booking_date = models.DateField()
    booking_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Additional details
    location_details = models.CharField(max_length=300, blank=True, help_text="Ward, Bed number, Room, etc.")
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ['booking_date', 'booking_time']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking_date', 'booking_time']),
            models.Index(fields=['booking_type']),
        ]

    def __str__(self):
        return f"{self.get_booking_type_display()} - {self.user.username} on {self.booking_date}"


class EmergencyBooking(models.Model):
    """Emergency bed bookings with real-time status tracking"""
    EMERGENCY_TYPE_CHOICES = [
        ('accident', 'Accident/Trauma'),
        ('cardiac', 'Cardiac Emergency'),
        ('stroke', 'Stroke'),
        ('respiratory', 'Respiratory Emergency'),
        ('pregnancy', 'Pregnancy Emergency'),
        ('poisoning', 'Poisoning'),
        ('burns', 'Burns'),
        ('pediatric', 'Pediatric Emergency'),
        ('other', 'Other Medical Emergency'),
    ]

    STATUS_CHOICES = [
        ('reserved', 'Bed Reserved'),
        ('arrived', 'Patient Arrived'),
        ('admitted', 'Admitted'),
        ('discharged', 'Discharged'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Reservation Expired'),
    ]

    BED_TYPE_CHOICES = [
        ('general', 'General Bed'),
        ('icu', 'ICU Bed'),
    ]

    # Core relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_bookings')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='emergency_bookings')
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, null=True, blank=True, related_name='emergency_details')
    
    # Emergency details
    emergency_type = models.CharField(max_length=200, choices=EMERGENCY_TYPE_CHOICES, help_text="Can be comma-separated for multiple types")
    bed_type = models.CharField(max_length=10, choices=BED_TYPE_CHOICES, default='general')
    patient_condition = models.TextField(help_text="Brief description of patient's condition")
    
    # Patient and Contact information (REQUIRED)
    patient_name = models.CharField(max_length=200, help_text="Name of the patient")
    contact_person = models.CharField(max_length=200, help_text="Name of contact person")
    contact_phone = PhoneNumberField(help_text="Contact person's phone number")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved')
    reservation_expires_at = models.DateTimeField(help_text="Reservation expiry time (30 minutes from booking)")
    arrival_time = models.DateTimeField(null=True, blank=True, help_text="Actual arrival time at hospital")
    admission_time = models.DateTimeField(null=True, blank=True, help_text="Time patient was admitted")
    discharge_date = models.DateTimeField(null=True, blank=True, help_text="Time patient was discharged")
    
    # Financial details (added for Phase 2)
    total_bill_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total hospital bill amount")
    insurance_approved_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount approved by insurance")
    out_of_pocket_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount to be paid by patient")
    
    # Location tracking
    booking_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="User's location when booking")
    booking_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="User's location when booking")
    estimated_arrival_minutes = models.IntegerField(default=30, help_text="Estimated travel time in minutes")
    
    # Additional information
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Emergency Booking"
        verbose_name_plural = "Emergency Bookings"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['reservation_expires_at']),
        ]

    def __str__(self):
        return f"{self.get_emergency_type_display()} - {self.user.username} at {self.hospital.name}"


class Payment(models.Model):
    """Patient's payments (insurance, bills, etc.)"""
    PAYMENT_TYPE_CHOICES = [
        ('insurance_premium', 'Insurance Premium'),
        ('hospital_bill', 'Hospital Bill'),
        ('doctor_fee', 'Doctor Fee'),
        ('lab_test', 'Lab Test'),
        ('medicine', 'Medicine'),
        ('insurance_renewal', 'Insurance Renewal'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('partial', 'Partially Paid'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPE_CHOICES)
    title = models.CharField(max_length=300)
    provider_name = models.CharField(max_length=300, help_text="Insurance company, Hospital, etc.")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Optional relations
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['payment_type']),
        ]

    def __str__(self):
        return f"{self.title} - ₹{self.amount} - {self.user.username}"


class Insurance(models.Model):
    """Patient insurance information (Section 2.2)"""
    
    COVERAGE_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('family', 'Family'),
        ('employer', 'Employer'),
        ('government', 'Government'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insurances')
    provider_name = models.CharField(max_length=200, help_text="Insurance provider name (e.g., ICICI Lombard, Star Health)")
    policy_number = models.CharField(max_length=100, unique=True)
    policy_expiry = models.DateField(help_text="Policy expiration date")
    coverage_type = models.CharField(max_length=20, choices=COVERAGE_TYPE_CHOICES, default='individual')
    coverage_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Coverage amount in rupees")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Insurance"
        verbose_name_plural = "Insurances"
        ordering = ['-is_active', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['policy_number']),
            models.Index(fields=['policy_expiry']),
        ]
    
    def __str__(self):
        return f"{self.provider_name} - {self.policy_number} ({self.user.username})"


class InsuranceDependent(models.Model):
    """Dependents/family members covered under insurance policy"""
    
    RELATIONSHIP_CHOICES = [
        ('spouse', 'Spouse'),
        ('child', 'Child'),
        ('parent', 'Parent'),
        ('sibling', 'Sibling'),
        ('other', 'Other'),
    ]
    
    insurance = models.ForeignKey(Insurance, on_delete=models.CASCADE, related_name='dependents')
    name = models.CharField(max_length=200, help_text="Full name of the dependent")
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    date_of_birth = models.DateField(help_text="Date of birth")
    is_covered = models.BooleanField(default=True, help_text="Whether this dependent is actively covered")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Insurance Dependent"
        verbose_name_plural = "Insurance Dependents"
        ordering = ['relationship', 'name']
        indexes = [
            models.Index(fields=['insurance', 'is_covered']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.insurance.policy_number}"
    
    @property
    def age(self):
        """Calculate current age from date of birth"""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class InsuranceProvider(models.Model):
    """Static list of insurance providers for standardization"""
    name = models.CharField(max_length=200, unique=True, help_text="Insurance provider name")
    provider_code = models.CharField(max_length=50, unique=True, help_text="Unique code for the provider")
    is_active = models.BooleanField(default=True, help_text="Whether this provider is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Insurance Provider"
        verbose_name_plural = "Insurance Providers"
        ordering = ['name']
        indexes = [
            models.Index(fields=['provider_code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.provider_code})"


class HospitalInsurance(models.Model):
    """Relationship between hospitals and accepted insurance providers"""
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='accepted_insurances')
    insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE, related_name='hospitals')
    is_in_network = models.BooleanField(default=True, help_text="Whether hospital is in-network for this provider")
    copay_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Copay amount in rupees (0 if fully covered)")
    notes = models.TextField(blank=True, help_text="Special conditions or notes about coverage")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Hospital Insurance"
        verbose_name_plural = "Hospital Insurances"
        unique_together = ['hospital', 'insurance_provider']
        ordering = ['hospital', 'insurance_provider']
        indexes = [
            models.Index(fields=['hospital', 'is_in_network']),
            models.Index(fields=['insurance_provider', 'is_active']),
        ]
    
    def __str__(self):
        network_status = "In-Network" if self.is_in_network else "Out-of-Network"
        return f"{self.hospital.name} - {self.insurance_provider.name} ({network_status})"


class DailyExpense(models.Model):
    """Daily expense tracking for patient's hospital stay (Phase 2 - Section 8.2)"""
    
    EXPENSE_TYPE_CHOICES = [
        ('room', 'Room Charges'),
        ('procedure', 'Medical Procedure'),
        ('medicine', 'Medicines'),
        ('test', 'Lab Tests/Diagnostics'),
        ('doctor_fee', 'Doctor Consultation Fee'),
        ('nursing', 'Nursing Care'),
        ('equipment', 'Medical Equipment'),
        ('therapy', 'Therapy/Rehabilitation'),
        ('miscellaneous', 'Miscellaneous'),
    ]
    
    admission = models.ForeignKey(EmergencyBooking, on_delete=models.CASCADE, related_name='daily_expenses')
    date = models.DateField(help_text="Date of the expense")
    expense_type = models.CharField(max_length=30, choices=EXPENSE_TYPE_CHOICES)
    description = models.TextField(help_text="Description of the expense")
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total amount for this expense")
    insurance_covered = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Amount covered by insurance")
    patient_share = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Patient's out-of-pocket share")
    
    # Verification status
    verified = models.BooleanField(default=False, help_text="Whether expense has been verified")
    verification_notes = models.TextField(blank=True, help_text="Notes from expense verification")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Daily Expense"
        verbose_name_plural = "Daily Expenses"
        ordering = ['date', 'created_at']
        indexes = [
            models.Index(fields=['admission', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['expense_type']),
        ]
    
    def __str__(self):
        return f"{self.date} - {self.get_expense_type_display()} - ₹{self.amount}"


class OutOfPocketPayment(models.Model):
    """Out-of-pocket payment tracking for discharged patients (Phase 2 - Section 10.1)"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    admission = models.OneToOneField(EmergencyBooking, on_delete=models.CASCADE, related_name='out_of_pocket_payment')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total hospital bill")
    insurance_covered = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount covered by insurance")
    out_of_pocket = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount to be paid by patient")
    
    # Payment gateway details (Razorpay)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, help_text="Razorpay order ID")
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True, help_text="Razorpay payment ID")
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True, help_text="Razorpay payment signature")
    
    # Payment details
    payment_method = models.CharField(max_length=50, blank=True, help_text="Payment method used (card, UPI, etc.)")
    payment_date = models.DateTimeField(null=True, blank=True, help_text="Date payment was completed")
    transaction_receipt = models.TextField(blank=True, help_text="Payment receipt/transaction details")
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Out of Pocket Payment"
        verbose_name_plural = "Out of Pocket Payments"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admission', 'payment_status']),
            models.Index(fields=['razorpay_order_id']),
            models.Index(fields=['payment_status']),
        ]
    
    def __str__(self):
        return f"Payment for {self.admission} - ₹{self.out_of_pocket} ({self.payment_status})"


class PlannedAdmission(models.Model):
    """Planned admission requests for non-emergency hospital visits (Phase 2 - Section 7)"""
    
    ADMISSION_TYPE_CHOICES = [
        ('surgery', 'Surgery/Procedure'),
        ('treatment', 'Medical Treatment'),
        ('diagnostic', 'Diagnostic Tests'),
        ('specialist', 'Specialist Care'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('scheduled', 'Scheduled'),
        ('pre_admission', 'Pre-Admission'),
        ('admitted', 'Admitted'),
        ('discharged', 'Discharged'),
        ('cancelled', 'Cancelled'),
    ]
    
    PROCEDURE_CATEGORY_CHOICES = [
        ('cardiac', 'Cardiac Procedures'),
        ('orthopedic', 'Orthopedic'),
        ('general_surgery', 'General Surgery'),
        ('neurology', 'Neurology'),
        ('gastroenterology', 'Gastroenterology'),
        ('urology', 'Urology'),
        ('gynecology', 'Gynecology'),
        ('oncology', 'Oncology'),
        ('ent', 'ENT'),
        ('ophthalmology', 'Ophthalmology'),
        ('dermatology', 'Dermatology'),
        ('diagnostic', 'Diagnostic'),
        ('other', 'Other'),
    ]
    
    # Core relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='planned_admissions')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='planned_admissions')
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='planned_admissions')
    
    # Admission details
    admission_type = models.CharField(max_length=30, choices=ADMISSION_TYPE_CHOICES, default='surgery')
    procedure_category = models.CharField(max_length=30, choices=PROCEDURE_CATEGORY_CHOICES, default='other')
    procedure_name = models.CharField(max_length=300, blank=True, help_text="Specific procedure or treatment name")
    symptoms = models.TextField(blank=True, help_text="Patient's symptoms description")
    
    # Scheduling
    preferred_date = models.DateField(null=True, blank=True, help_text="Preferred admission date")
    alternate_date = models.DateField(null=True, blank=True, help_text="Alternative admission date")
    flexible_dates = models.BooleanField(default=True, help_text="Whether patient is flexible with dates")
    scheduled_date = models.DateField(null=True, blank=True, help_text="Confirmed scheduled date")
    scheduled_time = models.TimeField(null=True, blank=True, help_text="Confirmed scheduled time")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Cost estimation
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Estimated total cost")
    estimated_insurance_coverage = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Estimated insurance coverage")
    estimated_out_of_pocket = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Estimated out-of-pocket cost")
    
    # AI Triage (placeholder for future AI integration)
    ai_triage_result = models.JSONField(null=True, blank=True, help_text="AI triage analysis result")
    ai_recommended_urgency = models.CharField(max_length=20, blank=True, help_text="AI recommended urgency level: critical, urgent, moderate, low")
    ai_confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="AI confidence percentage (0-100)")
    
    # Pre-admission checklist (JSON structure)
    pre_admission_checklist = models.JSONField(
        default=dict,
        blank=True,
        help_text="""Pre-admission checklist items. Example:
        {
            "medical_tests": [{"name": "Blood Test", "completed": false, "due_date": "2026-01-25"}],
            "documents": [{"name": "Insurance Card", "uploaded": true}],
            "medications": [{"name": "Stop Aspirin", "instruction": "Stop 7 days before", "acknowledged": false}],
            "instructions": [{"name": "Fasting", "description": "No food 12 hours before", "acknowledged": false}]
        }"""
    )
    
    # Additional notes
    doctor_notes = models.TextField(blank=True, help_text="Notes from doctor/hospital")
    patient_notes = models.TextField(blank=True, help_text="Additional notes from patient")
    cancellation_reason = models.TextField(blank=True, help_text="Reason for cancellation if cancelled")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Planned Admission"
        verbose_name_plural = "Planned Admissions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['hospital', 'status']),
            models.Index(fields=['preferred_date']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        procedure = self.procedure_name or self.get_admission_type_display()
        hospital_name = self.hospital.name if self.hospital else "No hospital selected"
        return f"{procedure} - {self.user.username} at {hospital_name}"
    
    @property
    def checklist_completion_percentage(self):
        """Calculate checklist completion percentage"""
        if not self.pre_admission_checklist:
            return 0
        
        total_items = 0
        completed_items = 0
        
        for category in ['medical_tests', 'documents', 'medications', 'instructions']:
            items = self.pre_admission_checklist.get(category, [])
            total_items += len(items)
            for item in items:
                if item.get('completed') or item.get('uploaded') or item.get('acknowledged'):
                    completed_items += 1
        
        if total_items == 0:
            return 100  # No items means checklist complete
        
        return round((completed_items / total_items) * 100)


class MedicalProcedure(models.Model):
    """Standard medical procedures catalog for procedure selection"""
    
    CATEGORY_CHOICES = PlannedAdmission.PROCEDURE_CATEGORY_CHOICES
    
    name = models.CharField(max_length=300, help_text="Procedure name")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, help_text="Description of the procedure")
    typical_duration = models.CharField(max_length=100, blank=True, help_text="Typical duration (e.g., '2-3 hours')")
    recovery_time = models.CharField(max_length=100, blank=True, help_text="Typical recovery time (e.g., '1-2 weeks')")
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Minimum estimated cost")
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Maximum estimated cost")
    requires_overnight_stay = models.BooleanField(default=True, help_text="Whether procedure typically requires overnight stay")
    pre_requirements = models.TextField(blank=True, help_text="Pre-procedure requirements (fasting, tests, etc.)")
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Medical Procedure"
        verbose_name_plural = "Medical Procedures"
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
