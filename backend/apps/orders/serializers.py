"""apps/orders/serializers.py"""
from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'product_name', 'brand', 'weight', 'price', 'quantity', 'image_url', 'line_total']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderStatusHistory
        fields = ['status', 'note', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    items   = OrderItemSerializer(many=True,         read_only=True)
    history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status', 'payment_method',
            'subtotal', 'delivery_charge', 'tax', 'discount', 'total',
            'shipping_address', 'coupon_code',
            'items', 'history',
            'created_at', 'estimated_delivery',
        ]


class PlaceOrderSerializer(serializers.Serializer):
    name           = serializers.CharField()
    email          = serializers.EmailField()
    phone          = serializers.CharField()
    address        = serializers.CharField()
    city           = serializers.CharField()
    state          = serializers.CharField()
    zip            = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=['card', 'upi', 'cod'])
    coupon_code    = serializers.CharField(required=False, allow_blank=True)
    razorpay_order_id   = serializers.CharField(required=False, allow_blank=True)
    razorpay_payment_id = serializers.CharField(required=False, allow_blank=True)
    razorpay_signature  = serializers.CharField(required=False, allow_blank=True)