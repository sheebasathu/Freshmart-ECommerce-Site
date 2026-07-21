"""apps/coupons/serializers.py"""
from rest_framework import serializers
from django.utils import timezone
from .models import Coupon

class CouponSerializer(serializers.ModelSerializer):
    is_expired    = serializers.SerializerMethodField()
    is_usage_full = serializers.SerializerMethodField()
    class Meta:
        model  = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_order_value', 'max_discount',
            'valid_from', 'valid_until',
            'usage_limit', 'used_count',
            'is_active', 'is_expired', 'is_usage_full',
        ]
    def get_is_expired(self, obj):
        return timezone.now() > obj.valid_until

    def get_is_usage_full(self, obj):
        return bool(obj.usage_limit and obj.used_count >= obj.usage_limit)

class ValidateCouponResponseSerializer(serializers.Serializer):
    """Shape returned by POST /api/coupons/validate/"""
    valid           = serializers.BooleanField()
    code            = serializers.CharField(required=False)
    description     = serializers.CharField(required=False)
    discount_type   = serializers.CharField(required=False)
    discount_value  = serializers.CharField(required=False)
    discount_amount = serializers.CharField(required=False)
    detail          = serializers.CharField(required=False)