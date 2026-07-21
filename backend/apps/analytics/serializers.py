"""apps/analytics/serializers.py"""
from rest_framework import serializers
from .models import ProductView, SearchQuery, DailySalesSnapshot

class ProductViewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email   = serializers.CharField(source='user.email',   read_only=True)
    class Meta:
        model  = ProductView
        fields = ['id', 'product_name', 'user_email', 'session_key', 'viewed_at']

class SearchQuerySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    class Meta:
        model  = SearchQuery
        fields = ['id', 'query', 'user_email', 'results_count', 'searched_at']

class DailySalesSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DailySalesSnapshot
        fields = ['date', 'orders_count', 'revenue', 'units_sold', 'new_customers']

class SalesDashboardSerializer(serializers.Serializer):
    """Shape of the /api/analytics/dashboard/ response."""
    today       = serializers.DictField()
    this_month  = serializers.DictField()
    all_time    = serializers.DictField()
    order_status_counts = serializers.ListField()
    top_products        = serializers.ListField()
    recent_orders       = serializers.ListField()
    daily_chart         = DailySalesSnapshotSerializer(many=True)