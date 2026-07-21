"""apps/accounts/serializers.py"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, Address


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model  = User
        fields = ['name', 'email', 'phone', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Core user profile serializer.

    avatar_url behaviour:
      • If the user has uploaded an avatar image → returns absolute URL
        (e.g. http://localhost:8000/media/avatars/photo.jpg)
      • If no avatar → returns None; the frontend falls back to name initials
    """
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'phone', 'avatar_url', 'date_joined']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            # Fallback when no request in context (e.g. JWT serializer path)
            from django.conf import settings
            base = getattr(settings, 'MEDIA_URL', '/media/')
            return f'http://localhost:8000{base}{obj.avatar.name}'
        return None


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Used for PATCH /api/auth/profile/ — avatar upload supported via multipart."""
    class Meta:
        model  = User
        fields = ['name', 'phone', 'avatar']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model            = Address
        fields           = '__all__'
        read_only_fields = ['user']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    username_field = 'email'  
    """
    Augments the standard JWT login response with full user data.

    BUG FIX: the original version called
        UserSerializer(self.user, context=self.context).data
    but simplejwt's self.context does NOT include the Django request object,
    so UserSerializer.get_avatar_url() always received request=None and
    returned None — even if the user had an avatar uploaded.

    Fix: pull `request` from self.context (simplejwt stores it there as
    'request' when the view calls .validate()), and pass it explicitly so
    build_absolute_uri() can construct the correct media URL.
    """
    def validate(self, attrs):
        data    = super().validate(attrs)
        request = self.context.get('request', None)           # ← now explicitly forwarded
        data['user'] = UserSerializer(
            self.user,
            context={'request': request},               # ← was missing / wrong
        ).data
        return data