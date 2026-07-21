"""apps/payments/admin.py"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display   = [
        'order_link', 'user', 'method', 'status_badge',
        'amount_display', 'initiated_at', 'completed_at',
    ]
    list_filter    = ['status', 'method', 'initiated_at']
    search_fields  = [
        'order__order_number', 'user__email', 'user__name',
        'razorpay_order_id', 'razorpay_payment_id',
    ]
    readonly_fields = [
        'order', 'user', 'method', 'amount',
        'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
        'initiated_at', 'completed_at', 'gateway_response',
    ]
    ordering = ['-initiated_at']

    fieldsets = (
        ('Payment Info',  {'fields': ('order', 'user', 'method', 'status', 'amount')}),
        ('Razorpay IDs',  {'fields': ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')}),
        ('Timestamps',    {'fields': ('initiated_at', 'completed_at')}),
        ('Gateway Response', {'fields': ('gateway_response',), 'classes': ('collapse',)}),
    )
    def order_link(self, obj):
        url = f'/admin/orders/order/{obj.order.pk}/change/'
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
    order_link.short_description = 'Order'
    def status_badge(self, obj):
        colours = {
            'paid':      '#16a34a',
            'failed':    '#dc2626',
            'refunded':  '#d97706',
            'pending':   '#6b7280',
            'initiated': '#3b82f6',
        }
        colour = colours.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px">{}</span>',
            colour, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def amount_display(self, obj):
        return format_html('<strong>₹{}</strong>', obj.amount)
    amount_display.short_description = 'Amount'

    def has_add_permission(self, request):
        return False   # payments are created programmatically only
