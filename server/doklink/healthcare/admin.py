from django.contrib import admin
from .models import (
    Doctor, Hospital, Treatment, Booking, Payment, InsuranceProvider, 
    HospitalInsurance, EmergencyBooking, Insurance, InsuranceDependent,
    DailyExpense, OutOfPocketPayment
)


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'phone_number', 'email']
    search_fields = ['name', 'specialization', 'registration_number']
    list_filter = ['specialization']


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'state', 'phone_number']
    search_fields = ['name', 'city', 'state']
    list_filter = ['state', 'city']


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ['treatment_name', 'user', 'doctor', 'hospital', 'started_date', 'status']
    search_fields = ['treatment_name', 'user__username', 'user__email']
    list_filter = ['status', 'started_date']
    date_hierarchy = 'started_date'
    raw_id_fields = ['user', 'doctor', 'hospital']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['booking_type', 'user', 'hospital', 'doctor', 'booking_date', 'booking_time', 'status']
    search_fields = ['user__username', 'user__email', 'hospital__name']
    list_filter = ['booking_type', 'status', 'booking_date']
    date_hierarchy = 'booking_date'
    raw_id_fields = ['user', 'hospital', 'doctor']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'amount', 'due_date', 'status', 'payment_type']
    search_fields = ['title', 'user__username', 'user__email', 'provider_name']
    list_filter = ['payment_type', 'status', 'due_date']
    date_hierarchy = 'due_date'
    raw_id_fields = ['user', 'hospital', 'doctor', 'booking']


@admin.register(InsuranceProvider)
class InsuranceProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider_code', 'is_active', 'created_at']
    search_fields = ['name', 'provider_code']
    list_filter = ['is_active']


@admin.register(HospitalInsurance)
class HospitalInsuranceAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'insurance_provider', 'is_in_network', 'copay_amount', 'is_active']
    search_fields = ['hospital__name', 'insurance_provider__name']
    list_filter = ['is_in_network', 'is_active']
    raw_id_fields = ['hospital', 'insurance_provider']


@admin.register(EmergencyBooking)
class EmergencyBookingAdmin(admin.ModelAdmin):
    list_display = ['user', 'hospital', 'emergency_type', 'bed_type', 'status', 'created_at']
    search_fields = ['user__username', 'user__email', 'hospital__name']
    list_filter = ['status', 'bed_type', 'created_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['user', 'hospital']


@admin.register(Insurance)
class InsuranceAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider_name', 'policy_number', 'policy_expiry', 'is_active']
    search_fields = ['user__username', 'user__email', 'provider_name', 'policy_number']
    list_filter = ['is_active', 'coverage_type', 'policy_expiry']
    date_hierarchy = 'policy_expiry'
    raw_id_fields = ['user']


@admin.register(InsuranceDependent)
class InsuranceDependentAdmin(admin.ModelAdmin):
    list_display = ['name', 'relationship', 'insurance', 'date_of_birth', 'age', 'is_covered']
    search_fields = ['name', 'insurance__policy_number', 'insurance__user__username']
    list_filter = ['relationship', 'is_covered']
    date_hierarchy = 'date_of_birth'
    raw_id_fields = ['insurance']


@admin.register(DailyExpense)
class DailyExpenseAdmin(admin.ModelAdmin):
    list_display = ['date', 'admission', 'expense_type', 'amount', 'insurance_covered', 'patient_share', 'verified']
    search_fields = ['admission__user__username', 'admission__hospital__name', 'description']
    list_filter = ['expense_type', 'verified', 'date']
    date_hierarchy = 'date'
    raw_id_fields = ['admission']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OutOfPocketPayment)
class OutOfPocketPaymentAdmin(admin.ModelAdmin):
    list_display = ['admission', 'out_of_pocket', 'payment_status', 'payment_date', 'razorpay_payment_id']
    search_fields = ['admission__user__username', 'admission__hospital__name', 'razorpay_order_id', 'razorpay_payment_id']
    list_filter = ['payment_status', 'payment_date']
    date_hierarchy = 'payment_date'
    raw_id_fields = ['admission']
    readonly_fields = ['created_at', 'updated_at']
