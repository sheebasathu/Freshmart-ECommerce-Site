"""apps/payments/models.py"""
from django.db import models
from django.conf import settings

class Payment(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('pending',   'Pending'),
        ('paid',      'Paid'),
        ('failed',    'Failed'),
        ('refunded',  'Refunded'),
    ]
    METHOD_CHOICES = [
        ('card',    'Credit / Debit Card'),
        ('upi',     'UPI / PhonePe'),
        ('cod',     'Cash on Delivery'),
        ('wallet',  'Wallet'),
        ('netbank', 'Net Banking'),
    ]

    order               = models.OneToOneField(
                            'orders.Order', on_delete=models.CASCADE, related_name='payment')
    user                = models.ForeignKey(
                            settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                            null=True, related_name='payments')
    method              = models.CharField(max_length=10, choices=METHOD_CHOICES)
    status              = models.CharField(max_length=10, choices=STATUS_CHOICES, default='initiated')
    amount              = models.DecimalField(max_digits=10, decimal_places=2)

    # Razorpay fields
    razorpay_order_id   = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature  = models.CharField(max_length=200, blank=True)

    # Timestamps
    initiated_at        = models.DateTimeField(auto_now_add=True)
    completed_at        = models.DateTimeField(null=True, blank=True)

    # Raw gateway response (for debugging / disputes)
    gateway_response    = models.JSONField(default=dict, blank=True)
    class Meta:
        db_table = 'fm_payments'
        ordering = ['-initiated_at']
    def __str__(self):
        return f'Payment({self.order.order_number}) — {self.status} — ₹{self.amount}'
