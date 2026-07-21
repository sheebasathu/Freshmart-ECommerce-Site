"""apps/reviews/models.py"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    product    = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating     = models.PositiveSmallIntegerField(validators=[MinValueValidator(1),MaxValueValidator(5)])
    title      = models.CharField(max_length=200, blank=True)
    body       = models.TextField()
    likes      = models.PositiveIntegerField(default=0)
    is_approved= models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table='fm_reviews'; unique_together=['product','user']; ordering=['-created_at']
    def __str__(self): return f'{self.user.name} → {self.product.name} ({self.rating}★)'