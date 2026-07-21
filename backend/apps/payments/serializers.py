"""apps/payments/serializers.py"""
from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    user_email   = serializers.CharField(source='user.email',         read_only=True)

    class Meta:
        model  = Payment
        fields = [
            'id', 'order_number', 'user_email',
            'method', 'status', 'amount',
            'razorpay_order_id', 'razorpay_payment_id',
            'initiated_at', 'completed_at',
        ]
        read_only_fields = [
            'razorpay_order_id', 'razorpay_payment_id',
            'initiated_at', 'completed_at',
        ]

class CreateRazorpayOrderSerializer(serializers.Serializer):
    """Request body for POST /api/payments/razorpay/create/"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

class VerifyPaymentSerializer(serializers.Serializer):
    """Request body for POST /api/payments/razorpay/verify/"""
    razorpay_order_id   = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature  = serializers.CharField()
    order_number        = serializers.CharField()