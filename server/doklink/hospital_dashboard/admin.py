from django.contrib import admin
from .models import (
    HospitalStaff, HospitalBedConfig, HospitalBed,
    HospitalPatient, HospitalDocument, HospitalClaim, HospitalActivity
)


@admin.register(HospitalStaff)
class HospitalStaffAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'role', 'hospital', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'hospital']
    search_fields = ['name', 'email']
    readonly_fields = ['password_hash', 'created_at', 'updated_at']


@admin.register(HospitalBedConfig)
class HospitalBedConfigAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'updated_at']


@admin.register(HospitalBed)
class HospitalBedAdmin(admin.ModelAdmin):
    list_display = ['bed_number', 'bed_category', 'hospital', 'status', 'floor', 'wing']
    list_filter = ['status', 'bed_category', 'hospital']
    search_fields = ['bed_number']


@admin.register(HospitalPatient)
class HospitalPatientAdmin(admin.ModelAdmin):
    list_display = ['uhid', 'name', 'age', 'gender', 'hospital', 'status', 'admission_date']
    list_filter = ['status', 'gender', 'hospital']
    search_fields = ['uhid', 'name', 'phone']


@admin.register(HospitalDocument)
class HospitalDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'doc_type', 'patient', 'hospital', 'date']
    list_filter = ['doc_type', 'hospital']


@admin.register(HospitalClaim)
class HospitalClaimAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient_name', 'insurer', 'claim_amount', 'status', 'hospital']
    list_filter = ['status', 'insurer', 'hospital']
    search_fields = ['patient_name', 'policy_number']


@admin.register(HospitalActivity)
class HospitalActivityAdmin(admin.ModelAdmin):
    list_display = ['activity_type', 'description', 'hospital', 'time']
    list_filter = ['activity_type', 'hospital']
    ordering = ['-time']
