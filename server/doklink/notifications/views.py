from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PushToken, Notification
from .serializers import PushTokenSerializer, NotificationSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_push_token(request):
    """
    Register an Expo push token for the authenticated user.
    Called by the mobile app on startup / login.
    """
    serializer = PushTokenSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    token = serializer.validated_data['token']
    device_name = serializer.validated_data.get('device_name', '')

    # Upsert: if token already exists, just update the user association
    push_token, created = PushToken.objects.update_or_create(
        token=token,
        defaults={
            'user': request.user,
            'device_name': device_name,
            'is_active': True,
        }
    )

    return Response({
        'success': True,
        'message': 'Push token registered' if created else 'Push token updated',
        'tokenId': push_token.id,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unregister_push_token(request):
    """
    Deactivate a push token (e.g. on logout).
    """
    token = request.data.get('token', '')
    if not token:
        return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

    updated = PushToken.objects.filter(
        user=request.user, token=token
    ).update(is_active=False)

    return Response({
        'success': True,
        'message': 'Token deactivated' if updated else 'Token not found',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """
    Get all notifications for the authenticated user.
    Supports ?unread_only=true query param.
    """
    queryset = Notification.objects.filter(user=request.user)

    unread_only = request.query_params.get('unread_only', '').lower() == 'true'
    if unread_only:
        queryset = queryset.filter(read=False)

    notifications = queryset[:50]  # Limit to 50 most recent
    serializer = NotificationSerializer(notifications, many=True)

    unread_count = Notification.objects.filter(user=request.user, read=False).count()

    return Response({
        'notifications': serializer.data,
        'unreadCount': unread_count,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request):
    """
    Mark one or all notifications as read.
    Body: { "notificationId": 123 }  or  { "markAll": true }
    """
    notification_id = request.data.get('notificationId')
    mark_all = request.data.get('markAll', False)

    if mark_all:
        updated = Notification.objects.filter(
            user=request.user, read=False
        ).update(read=True)
        return Response({'success': True, 'message': f'{updated} notifications marked as read'})

    if not notification_id:
        return Response({'error': 'notificationId or markAll required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.read = True
        notification.save(update_fields=['read', 'updated_at'])
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Quick endpoint for badge count."""
    count = Notification.objects.filter(user=request.user, read=False).count()
    return Response({'unreadCount': count})
