"""
Expo Push Notification Service.

Uses the Expo Push API (https://exp.host/--/api/v2/push/send)
to deliver push notifications to mobile app users.

No third-party SDK required — just HTTP requests via `requests`.
"""
import logging
import requests
from django.contrib.auth.models import User

from .models import PushToken, Notification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'


def send_push_notification(
    user: User,
    title: str,
    body: str,
    notification_type: str = 'general',
    data: dict = None,
    hospital_name: str = '',
) -> Notification:
    """
    Send a push notification to all active devices of a user.

    1. Creates a Notification record in the DB.
    2. Sends the notification via Expo Push API.
    3. Updates the Notification status based on result.

    Returns the Notification object.
    """
    data = data or {}

    # Create notification record
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        body=body,
        data=data,
        hospital_name=hospital_name,
        status='pending',
    )

    # Get all active push tokens for this user
    tokens = list(
        PushToken.objects.filter(user=user, is_active=True)
        .values_list('token', flat=True)
    )

    if not tokens:
        logger.info(f"No push tokens for user {user.id}, notification saved but not sent.")
        return notification

    # Build Expo push messages (one per token)
    messages = []
    for token in tokens:
        messages.append({
            'to': token,
            'title': title,
            'body': body,
            'data': {
                'notificationId': str(notification.id),
                'type': notification_type,
                **data,
            },
            'sound': 'default',
            'priority': 'high',
            'channelId': 'default',
        })

    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=messages,
            headers={
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            timeout=10,
        )

        if response.status_code == 200:
            result = response.json()
            ticket_data = result.get('data', [])

            # Check for individual ticket errors (invalid tokens)
            for i, ticket in enumerate(ticket_data):
                if ticket.get('status') == 'error':
                    error_msg = ticket.get('message', '')
                    if 'DeviceNotRegistered' in error_msg:
                        # Deactivate invalid token
                        PushToken.objects.filter(token=tokens[i]).update(is_active=False)
                        logger.warning(f"Deactivated invalid push token: {tokens[i][:30]}...")

            notification.status = 'sent'
            notification.save(update_fields=['status', 'updated_at'])
            logger.info(f"Push notification sent to user {user.id}: {title}")
        else:
            notification.status = 'failed'
            notification.save(update_fields=['status', 'updated_at'])
            logger.error(f"Expo push failed ({response.status_code}): {response.text}")

    except requests.RequestException as e:
        notification.status = 'failed'
        notification.save(update_fields=['status', 'updated_at'])
        logger.error(f"Push notification request failed: {e}")

    return notification


def send_push_to_user_by_phone(
    phone_number: str,
    title: str,
    body: str,
    notification_type: str = 'general',
    data: dict = None,
    hospital_name: str = '',
) -> Notification | None:
    """
    Convenience: find a mobile app user by phone number and send them a notification.
    Hospital dashboard patients have a phone field; we match it to app_auth UserProfile.
    Returns Notification or None if user not found.
    """
    from app_auth.models import UserProfile

    # Try to find the mobile app user by phone number
    # Clean the phone number for matching
    clean_phone = phone_number.strip().replace(' ', '').replace('-', '')

    profiles = UserProfile.objects.filter(
        phone_number__endswith=clean_phone[-10:]  # Match last 10 digits
    ).select_related('user')

    if not profiles.exists():
        logger.info(f"No mobile app user found for phone {clean_phone}, skipping notification.")
        return None

    profile = profiles.first()
    return send_push_notification(
        user=profile.user,
        title=title,
        body=body,
        notification_type=notification_type,
        data=data,
        hospital_name=hospital_name,
    )
