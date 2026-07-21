"""apps/cart/admin.py"""
from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model           = CartItem
    extra           = 0
    readonly_fields = ['variant', 'quantity', 'line_total_display', 'added_at']
    can_delete      = True
    def line_total_display(self, obj):
        return f'₹{obj.line_total}'
    line_total_display.short_description = 'Line Total'
    
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display    = ['user', 'total_items_display', 'subtotal_display', 'updated_at']
    search_fields   = ['user__email', 'user__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines         = [CartItemInline]

    def total_items_display(self, obj):
        return obj.total_items
    total_items_display.short_description = 'Items'

    def subtotal_display(self, obj):
        return f'₹{obj.subtotal}'
    subtotal_display.short_description = 'Subtotal'
