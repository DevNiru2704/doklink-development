"""
URL configuration for doklink project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """API root endpoint with available endpoints"""
    return Response({
        'message': 'Welcome to DokLink API',
        'version': 'v1',
        'timestamp': timezone.now(),
        'endpoints': {
            'auth': {
                'signup': '/api/v1/auth/signup/',
                'login': '/api/v1/auth/login/',
                'profile': '/api/v1/auth/profile/',
                'token_refresh': '/api/v1/auth/token/refresh/',
                'health': '/api/v1/auth/health/',
            }
        }
    })


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Root
    path('api/v1/', api_root, name='api_root'),
    
    # API endpoints
    path('api/v1/auth/', include('app_auth.urls')),
    
    # Development tools (always keep last)
    path('__reload__/', include('django_browser_reload.urls'))
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
