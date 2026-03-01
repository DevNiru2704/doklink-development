from django.contrib import admin
from .models import PushToken, Notification


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'device_name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__username', 'user__email', 'token']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'status', 'read', 'hospital_name', 'created_at']
    list_filter = ['notification_type', 'status', 'read']
    search_fields = ['user__username', 'title', 'body']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
