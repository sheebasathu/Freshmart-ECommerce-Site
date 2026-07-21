"""apps/cart/models.py"""
from django.db import models
from django.conf import settings

class Cart(models.Model):
    user       = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fm_carts'

    @property
    def total_items(self):
        return sum(i.quantity for i in self.items.all())

    @property
    def subtotal(self):
        return sum(i.line_total for i in self.items.all())

    def __str__(self):
        return f'Cart({self.user.email})'


class CartItem(models.Model):
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant  = models.ForeignKey('products.ProductVariant', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'fm_cart_items'
        unique_together = ['cart', 'variant']

    @property
    def line_total(self):
        return self.variant.price * self.quantity

    def __str__(self):
        return f'{self.variant} × {self.quantity}'
