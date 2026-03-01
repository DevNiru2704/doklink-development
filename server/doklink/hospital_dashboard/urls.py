from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.staff_login, name='staff-login'),

    # Hospital management (SuperAdmin)
    path('hospitals/', views.list_hospitals, name='dashboard-hospitals'),
    path('hospitals/register/', views.register_hospital, name='dashboard-hospital-register'),

    # User management
    path('users/', views.manage_users, name='dashboard-users'),

    # Bed management
    path('beds/', views.manage_beds, name='dashboard-beds'),

    # Patient management
    path('patients/', views.manage_patients, name='dashboard-patients'),

    # Claims management
    path('claims/', views.manage_claims, name='dashboard-claims'),

    # Activities
    path('activities/', views.manage_activities, name='dashboard-activities'),

    # Documents
    path('documents/', views.manage_documents, name='dashboard-documents'),

    # Bed configuration
    path('bed-config/', views.manage_bed_config, name='dashboard-bed-config'),
]
