"""apps/accounts/views.py"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Address
from .serializers import (
    RegisterSerializer, UserSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer, AddressSerializer, CustomTokenObtainPairSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Creates user and immediately returns JWT pair + user profile.
    Avatar is optional at registration — users can upload it later via ProfileView.
    """
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user    = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            # Pass request so avatar_url is an absolute URL (even if None for new users)
            'user':    UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Returns access + refresh tokens and full user profile (including avatar_url).
    Uses CustomTokenObtainPairSerializer which forwards the request context so
    avatar_url is correctly built as an absolute URL.
    """
    serializer_class   = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data['refresh']).blacklist()
            return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/profile/ — returns current user profile
    PATCH /api/auth/profile/ — update name, phone, or upload avatar

    BUG FIX: after PATCH the original code called super().update() which
    returned UpdateProfileSerializer data (no avatar_url).  We now refresh
    from DB and return a full UserSerializer response so the frontend gets
    the correct absolute avatar_url immediately after upload.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return UpdateProfileSerializer if self.request.method in ('PUT', 'PATCH') else UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        super().update(request, *args, **kwargs)
        # Re-fetch from DB so ImageField has the persisted path/URL, then
        # serialize with request context so avatar_url is absolute.
        request.user.refresh_from_db()
        return Response(UserSerializer(request.user, context={'request': request}).data)


class ChangePasswordView(APIView):
    """PUT /api/auth/change-password/"""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        s = ChangePasswordSerializer(data=request.data, context={'request': request})
        s.is_valid(raise_exception=True)
        request.user.set_password(s.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password changed.'})


class AddressListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/auth/addresses/"""
    serializer_class   = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by('-is_default', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/addresses/<pk>/"""
    serializer_class   = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)