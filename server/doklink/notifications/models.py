from django.db import models
from django.contrib.auth.models import User


class PushToken(models.Model):
    """
    Stores Expo push tokens for each mobile app user.
    A user may have multiple tokens (multiple devices).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_tokens')
    token = models.CharField(max_length=255, unique=True, help_text="Expo push token (ExponentPushToken[...])")
    device_name = models.CharField(max_length=200, blank=True, help_text="Optional device identifier")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Push Token"
        verbose_name_plural = "Push Tokens"
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.token[:30]}..."


class Notification(models.Model):
    """
    Notification records sent from hospital dashboard to mobile app users.
    Tracks delivery status for each notification.
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('admission', 'Patient Admitted'),
        ('discharge', 'Patient Discharged'),
        ('bed_assigned', 'Bed Assigned'),
        ('bed_released', 'Bed Released'),
        ('claim_update', 'Insurance Claim Update'),
        ('document_added', 'Document Added'),
        ('appointment', 'Appointment Update'),
        ('general', 'General Notification'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=300)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True, help_text="Extra payload sent with push notification")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    read = models.BooleanField(default=False)

    # Optional reference to the hospital that triggered this notification
    hospital_name = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read']),
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title} → {self.user.username}"
