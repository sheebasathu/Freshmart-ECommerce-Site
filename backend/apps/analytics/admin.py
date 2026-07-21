"""apps/analytics/admin.py"""
from django.contrib import admin
from django.db.models import Sum, Count
from django.utils.html import format_html
from .models import ProductView, SearchQuery, DailySalesSnapshot

@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display  = ['product', 'user', 'session_key', 'viewed_at']
    list_filter   = ['viewed_at']
    search_fields = ['product__name', 'user__email']
    readonly_fields = ['product', 'user', 'session_key', 'viewed_at']
    ordering      = ['-viewed_at']
    def has_add_permission(self, request):
        return False   # read-only — events are logged programmatically

@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display  = ['query', 'results_count', 'user', 'searched_at']
    list_filter   = ['searched_at']
    search_fields = ['query', 'user__email']
    readonly_fields = ['query', 'user', 'results_count', 'searched_at']
    ordering      = ['-searched_at']
    def has_add_permission(self, request):
        return False

@admin.register(DailySalesSnapshot)
class DailySalesSnapshotAdmin(admin.ModelAdmin):
    list_display  = ['date', 'orders_count', 'revenue_display', 'units_sold', 'new_customers', 'updated_at']
    ordering      = ['-date']
    readonly_fields = ['created_at', 'updated_at']

    def revenue_display(self, obj):
        return format_html('<strong>₹{}</strong>', obj.revenue)
    revenue_display.short_description = 'Revenue'
    # Allow manual creation for backfilling
    def has_add_permission(self, request):
        return True
