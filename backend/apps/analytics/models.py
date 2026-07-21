"""apps/analytics/models.py
Stores persistent analytics events. Most analytics are computed on-the-fly
from orders, but this model lets admins track page-views, search queries, etc.
"""
from django.db import models
from django.conf import settings

class ProductView(models.Model):
    """Tracks every time a product detail page is viewed."""
    product    = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='views')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True)
    session_key = models.CharField(max_length=100, blank=True, help_text='Anonymous session key')
    viewed_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fm_product_views'
        ordering = ['-viewed_at']
    def __str__(self):
        user_info = self.user.email if self.user else 'anonymous'
        return f'{self.product.name} viewed by {user_info}'

class SearchQuery(models.Model):
    """Tracks search queries so admins can see what customers look for."""
    query      = models.CharField(max_length=300)
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, blank=True)
    results_count = models.PositiveIntegerField(default=0)
    searched_at   = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'fm_search_queries'
        ordering = ['-searched_at']
    def __str__(self):
        return f'"{self.query}" ({self.results_count} results)'

class DailySalesSnapshot(models.Model):
    """
    Pre-computed daily revenue snapshot for fast dashboard charts.
    Populated by a management command / scheduled task.
    """
    date          = models.DateField(unique=True)
    orders_count  = models.PositiveIntegerField(default=0)
    revenue       = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    units_sold    = models.PositiveIntegerField(default=0)
    new_customers = models.PositiveIntegerField(default=0)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fm_daily_sales'
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} — ₹{self.revenue} ({self.orders_count} orders)'
