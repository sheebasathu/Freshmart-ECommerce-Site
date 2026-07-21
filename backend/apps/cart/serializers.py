"""apps/cart/serializers.py"""
from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductVariantSerializer
from apps.products.models import ProductVariant

class CartItemSerializer(serializers.ModelSerializer):
    variant      = ProductVariantSerializer(read_only=True)
    product_name = serializers.CharField(source='variant.product.name',  read_only=True)
    product_id   = serializers.IntegerField(source='variant.product.id', read_only=True)
    image        = serializers.SerializerMethodField()
    line_total   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = CartItem
        fields = ['id', 'variant', 'product_id', 'product_name', 'image', 'quantity', 'line_total']

    def get_image(self, obj):
        req = self.context.get('request')
        img = obj.variant.product.primary_image
        return req.build_absolute_uri(img.image.url) if (img and img.image and req) else None

class CartSerializer(serializers.ModelSerializer):
    items       = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal    = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'updated_at']

class AddToCartSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField()
    quantity   = serializers.IntegerField(min_value=1, default=1)
    def validate_variant_id(self, value):
        try:
            v = ProductVariant.objects.get(id=value, is_active=True)
            if v.stock < 1:
                raise serializers.ValidationError('Out of stock.')
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError('Variant not found.')
        return value

class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)