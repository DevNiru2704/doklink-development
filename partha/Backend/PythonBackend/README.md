# Django Mobile Backend

A robust Django REST API backend designed for mobile applications.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **User Management**: Custom user model with profiles and settings
- **Content Management**: Posts, comments, and likes system
- **Mobile Optimized**: CORS configured for mobile app integration
- **API Documentation**: RESTful API with proper serialization
- **Admin Interface**: Django admin for content management

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET/PUT /api/auth/profile/` - User profile management
- `PUT /api/auth/change-password/` - Change password

### Content API
- `GET/POST /api/v1/posts/` - List/Create posts
- `GET/PUT/DELETE /api/v1/posts/{id}/` - Post detail operations
- `POST/DELETE /api/v1/posts/{id}/like/` - Toggle post like
- `GET/POST /api/v1/posts/{id}/comments/` - Post comments
- `GET /api/v1/my-posts/` - User's posts
- `GET /api/v1/dashboard/` - Dashboard statistics

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Run migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

5. Run development server:
   ```bash
   python manage.py runserver
   ```

## Mobile App Integration

The API is configured with CORS headers for mobile app integration. Use the JWT tokens for authentication in your mobile application.

Example request headers:
```
Authorization: Bearer your-jwt-access-token
Content-Type: application/json
```

## Security Features

- JWT authentication with refresh tokens
- Password validation
- CORS configuration
- User verification system
- Permission-based access control