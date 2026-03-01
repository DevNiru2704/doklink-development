from django.urls import path
from . import views

urlpatterns = [
    # Push token management
    path('push-token/register/', views.register_push_token, name='push-token-register'),
    path('push-token/unregister/', views.unregister_push_token, name='push-token-unregister'),

    # Notification listing and management
    path('', views.list_notifications, name='notifications-list'),
    path('mark-read/', views.mark_notification_read, name='notification-mark-read'),
    path('unread-count/', views.unread_count, name='notification-unread-count'),
]
