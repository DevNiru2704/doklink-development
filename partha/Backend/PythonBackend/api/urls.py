from django.urls import path
from . import views

urlpatterns = [
    # Posts
    path('posts/', views.PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:post_id>/like/', views.toggle_like, name='toggle-like'),
    
    # Comments
    path('posts/<int:post_id>/comments/', views.CommentListCreateView.as_view(), name='comment-list-create'),
    path('comments/<int:pk>/', views.CommentDetailView.as_view(), name='comment-detail'),
    
    # User specific
    path('my-posts/', views.user_posts, name='user-posts'),
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
]