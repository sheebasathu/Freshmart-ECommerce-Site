"""apps/wishlist/serializers.py"""
from rest_framework import serializers
from .models import WishlistItem
from apps.products.serializers import ProductListSerializer

class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    class Meta:
        model  = WishlistItem
        fields = ['id', 'product', 'added_at']

class ToggleWishlistSerializer(serializers.Serializer):
    """Request body for POST /api/wishlist/"""
    product_id = serializers.IntegerField()
    def validate_product_id(self, value):
        from apps.products.models import Product
        if not Product.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError('Product not found.')
        return value