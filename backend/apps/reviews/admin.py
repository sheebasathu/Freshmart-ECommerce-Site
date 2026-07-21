from django.contrib import admin
from .models import Review
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display=['product','user','rating','is_approved','created_at']
    list_editable=['is_approved']
    list_filter=['is_approved','rating']
    search_fields=['product__name','user__email','user__name']
