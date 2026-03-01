from rest_framework import serializers
from .models import Notification, PushToken


class PushTokenSerializer(serializers.Serializer):
    """Register a push token for the authenticated user."""
    token = serializers.CharField(max_length=255)
    device_name = serializers.CharField(max_length=200, required=False, default='')


class NotificationSerializer(serializers.ModelSerializer):
    """Notification as seen by the mobile app user."""
    notificationType = serializers.CharField(source='notification_type')
    hospitalName = serializers.CharField(source='hospital_name')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notificationType', 'title', 'body', 'data',
            'status', 'read', 'hospitalName', 'createdAt',
        ]
        read_only_fields = ['id', 'createdAt']
