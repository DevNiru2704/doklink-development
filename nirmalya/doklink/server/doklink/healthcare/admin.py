from django.contrib import admin
from .models import Doctor, Hospital, Treatment, Booking, Payment


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
