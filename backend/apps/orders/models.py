"""apps/orders/models.py"""
import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):
    STATUS = [
        ('pending',           'Pending'),
        ('confirmed',         'Confirmed'),
        ('processing',        'Processing'),
        ('packed',            'Packed'),
        ('shipped',           'Shipped'),
        ('out_for_delivery',  'Out for Delivery'),
        ('delivered',         'Delivered'),
        ('cancelled',         'Cancelled'),
        ('returned',          'Returned'),
    ]
    PAYMENT_STATUS = [
        ('pending',  'Pending'),
        ('paid',     'Paid'),
        ('failed',   'Failed'),
        ('refunded', 'Refunded'),
    ]

    order_number        = models.CharField(max_length=20, unique=True, editable=False)
    user                = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                             null=True, related_name='orders')
    status              = models.CharField(max_length=20, choices=STATUS,         default='pending')
    payment_status      = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method      = models.CharField(max_length=20, default='cod')

    subtotal            = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_charge     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax                 = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total               = models.DecimalField(max_digits=10, decimal_places=2)

    shipping_address    = models.JSONField()
    coupon_code         = models.CharField(max_length=50, blank=True)
    razorpay_order_id   = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)

    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    estimated_delivery  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'fm_orders'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = 'FM' + uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Order {self.order_number}'


class OrderItem(models.Model):
    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=200)
    brand        = models.CharField(max_length=100, blank=True)
    weight       = models.CharField(max_length=50)
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    quantity     = models.PositiveIntegerField()
    image_url    = models.URLField(blank=True)
    variant      = models.ForeignKey('products.ProductVariant', on_delete=models.SET_NULL,
                                      null=True, blank=True)

    class Meta:
        db_table = 'fm_order_items'

    @property
    def line_total(self):
        return self.price * self.quantity

    def __str__(self):
        return f'{self.product_name} × {self.quantity}'


class OrderStatusHistory(models.Model):
    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='history')
    status     = models.CharField(max_length=20)
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True)

    class Meta:
        db_table = 'fm_order_history'
        ordering = ['-created_at']
