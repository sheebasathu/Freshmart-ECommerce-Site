"""apps/coupons/models.py"""
from decimal import Decimal
from django.db import models
from django.utils import timezone

class Coupon(models.Model):
    TYPES = [('percent','Percentage'),('flat','Flat Amount')]
    code            = models.CharField(max_length=50, unique=True)
    description     = models.CharField(max_length=200, blank=True)
    discount_type   = models.CharField(max_length=10, choices=TYPES, default='percent')
    discount_value  = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valid_from      = models.DateTimeField(default=timezone.now)
    valid_until     = models.DateTimeField()
    usage_limit     = models.PositiveIntegerField(null=True, blank=True)
    used_count      = models.PositiveIntegerField(default=0)
    is_active       = models.BooleanField(default=True)
    class Meta:
        db_table = 'fm_coupons'
    def is_valid(self, subtotal=Decimal('0')):
        now = timezone.now()
        if not self.is_active: return False
        if now < self.valid_from or now > self.valid_until: return False
        if self.usage_limit and self.used_count >= self.usage_limit: return False
        if subtotal < self.min_order_value: return False
        return True
    def get_discount(self, subtotal):
        if self.discount_type == 'percent':
            d = subtotal * (self.discount_value / Decimal('100'))
            if self.max_discount: d = min(d, self.max_discount)
        else:
            d = self.discount_value
        return min(d, subtotal)
    def __str__(self): return self.code
