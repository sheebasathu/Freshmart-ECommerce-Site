"""apps/wishlist/admin.py"""
from django.contrib import admin
from .models import WishlistItem

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display  = ['user', 'product', 'added_at']
    list_filter   = ['added_at']
    search_fields = ['user__email', 'user__name', 'product__name']
    ordering      = ['-added_at']
    readonly_fields = ['user', 'product', 'added_at']
    def has_add_permission(self, request):
        return False   # wishlist items are managed by customers only
