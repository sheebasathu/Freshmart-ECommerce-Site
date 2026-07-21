"""apps/accounts/urls.py"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    ChangePasswordView, AddressListCreateView, AddressDetailView,
)

urlpatterns = [
    path('register/',           RegisterView.as_view(),          name='register'),
    path('login/',              LoginView.as_view(),             name='login'),
    path('logout/',             LogoutView.as_view(),            name='logout'),
    path('token/refresh/',      TokenRefreshView.as_view(),      name='token_refresh'),
    path('profile/',            ProfileView.as_view(),           name='profile'),
    path('change-password/',    ChangePasswordView.as_view(),    name='change_password'),
    path('addresses/',          AddressListCreateView.as_view(), name='addresses'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(),     name='address_detail'),
]