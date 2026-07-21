"""apps/orders/admin.py"""
from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model           = OrderItem
    extra           = 0
    readonly_fields = ['product_name', 'brand', 'weight', 'price', 'quantity', 'get_line_total']
    can_delete      = False

    def get_line_total(self, obj):
        return f'₹{obj.line_total}'
    get_line_total.short_description = 'Line Total'


class OrderStatusHistoryInline(admin.TabularInline):
    model           = OrderStatusHistory
    extra           = 1
    readonly_fields = ['created_at', 'created_by']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display    = ['order_number', 'user', 'status', 'payment_status', 'total', 'created_at']
    list_filter     = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields   = ['order_number', 'user__email', 'user__name']
    list_editable   = ['status']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines         = [OrderItemInline, OrderStatusHistoryInline]

    def save_model(self, request, obj, form, change):
        if change:
            old = Order.objects.get(pk=obj.pk)
            if old.status != obj.status:
                OrderStatusHistory.objects.create(
                    order=obj, status=obj.status,
                    note=f'Updated by admin: {request.user.email}',
                    created_by=request.user,
                )
        super().save_model(request, obj, form, change)
