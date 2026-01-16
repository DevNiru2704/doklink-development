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
        ('patient_on_way', 'Patient On the Way'),
        ('arrived', 'Patient Arrived'),
        ('admitted', 'Admitted'),
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
    
    # Contact information (REQUIRED)
    contact_person = models.CharField(max_length=200, help_text="Name of contact person")
    contact_phone = PhoneNumberField(help_text="Contact person's phone number")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved')
    reservation_expires_at = models.DateTimeField(help_text="Reservation expiry time (30 minutes from booking)")
    arrival_time = models.DateTimeField(null=True, blank=True, help_text="Actual arrival time at hospital")
    admission_time = models.DateTimeField(null=True, blank=True, help_text="Time patient was admitted")
    
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
