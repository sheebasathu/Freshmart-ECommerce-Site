"""apps/content/admin.py"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Banner, FeaturedSection, NavCategory, NavMenu, ShopCategory, PopularCategoryPill, FruitsVegetableCard, DailyDealCard

def img_preview(obj):
    try:
        if obj.image and hasattr(obj.image, 'url'):
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" height="50" style="border-radius:6px;" />'
                '</a>',
                obj.image.url,
                obj.image.url
            )
    except Exception:
        return '⚠️ Error'
    return '—'

img_preview.short_description = 'Preview'

def icon_preview(obj):
    try:
        if obj.icon and hasattr(obj.icon, 'url'):
            return format_html(
                '<img src="{}" height="40" width="40" '
                'style="border-radius:6px; object-fit:cover;" />',
                obj.icon.url,
            )
    except Exception:
        return '⚠️ Error'

    return obj.icon_emoji or '—'

icon_preview.short_description = 'Icon'

 
@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display  = ['title', 'description','placement','is_active','order', img_preview]
    list_editable = ['is_active','order']
    list_filter   = ['placement','is_active']
    search_fields = ['title', 'subtitle']
    ordering      = ['placement', 'order']
    readonly_fields = ['image']
    
    fieldsets = (
        ('Content', {
            'fields': (
                'title', 'highlight_title', 'highlight_color',
                'subtitle', 'description'
            )
        }),
        ('Image', {
            'fields': ('image_file', 'image'),
            'description': 'Upload image (stored locally or via configured storage).'
        }),
        ('CTA', {
            'fields': ('cta_text', 'cta_link')
        }),
        ('Display', {
            'fields': ('placement', 'is_active', 'order')
        }),
    )


@admin.register(FeaturedSection)
class FeaturedSectionAdmin(admin.ModelAdmin):
    list_display  = ['title','category','subcategory','is_active','order', img_preview]
    list_editable = ['is_active','order']
    search_fields = ['title']
    autocomplete_fields = ['category','subcategory']
    readonly_fields = ['image']
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'subtitle', 'category', 'subcategory')
        }),
        ('Image', {
            'fields': ('image_file', 'image')
        }),
        ('Display', {
            'fields': ('is_active', 'order')
        }),
    )
    
class NavCategoryChildInline(admin.TabularInline):
    """
    Allows editing sub-categories directly from the parent's change page.
    Enables future subcategory fly-out menus without leaving the admin.
    """
    model           = NavCategory
    fk_name         = 'parent'
    extra           = 1
    fields          = ['name', 'icon', 'icon_emoji', 'description', 'category', 'custom_path', 'is_active', 'order']
    readonly_fields = ['icon']
    show_change_link = True
    verbose_name        = 'Sub-category'
    verbose_name_plural = 'Sub-categories'
 

@admin.register(NavCategory)
class NavCategoryAdmin(admin.ModelAdmin):
    list_display  = [
        icon_preview, 'name', 'category', 'parent', 'custom_path', 'is_active', 'order',
    ]
    list_editable  = ['is_active', 'order']
    list_filter    = ['is_active', 'parent']
    search_fields  = ['name', 'description']
    ordering       = ['order']
    # Only show top-level entries by default; children are edited via inline
    autocomplete_fields = ['category', 'parent']
    readonly_fields = ['icon']
    inlines        = [NavCategoryChildInline]
 
    fieldsets = (
        ('Display', {
            'fields': ('name', 'icon', 'icon_emoji', 'description'),
        }),
        ('Link', {
            'fields': ('category', 'custom_path'),
            'description': (
                'Set <strong>category</strong> to auto-generate a '
                '/listing?category=slug link, or override with '
                '<strong>custom_path</strong>.'
            ),
        }),
        ('Hierarchy', {
            'fields': ('parent',),
            'description': 'Leave blank for a top-level entry.',
        }),
        ('Visibility', {
            'fields': ('is_active', 'order'),
        }),
    )
 
    def get_queryset(self, request):
        """Show all entries in the list view (parents + children)."""
        return super().get_queryset(request).select_related('parent', 'category')
    
#  Navmenu
 
@admin.register(NavMenu)
class NavMenuAdmin(admin.ModelAdmin):
    list_display  = ['title', 'slug', 'subcategory', 'custom_path', 'is_active', 'order']
    list_editable  = ['is_active', 'order']
    list_filter    = ['is_active']
    search_fields  = ['title', 'slug']
    ordering       = ['order']
    autocomplete_fields = ['subcategory']
    prepopulated_fields = {'slug': ('title',)}   # auto-fills slug from title
 
    fieldsets = (
        ('Display', {
            'fields': ('title', 'slug'),
        }),
        ('Link', {
            'fields': ('subcategory', 'custom_path'),
            'description': (
                'Set <strong>category</strong> to auto-generate a '
                '/listing?category=slug link, or override with '
                '<strong>custom_path</strong>.'
            ),
        }),
        ('Visibility', {
            'fields': ('is_active', 'order'),
        }),
    )
 
@admin.register(ShopCategory)
class ShopCategoryAdmin(admin.ModelAdmin):
    list_display  = ['category','is_active','order', img_preview]
    list_editable = ['is_active','order']
    search_fields  = ['category__name']
    autocomplete_fields = ['category']
    readonly_fields = ['image']
    ordering = ['order']
    
    fieldsets = (
        ('Content', {
            'fields': ('category',)
        }),
        ('Image', {
            'fields': ('image_file', 'image')
        }),
        ('Display', {
            'fields': ('is_active', 'order')
        }),
    )

@admin.register(PopularCategoryPill)
class PopularCategoryPillAdmin(admin.ModelAdmin):
    list_display  = ['label','category','custom_path','is_active','order']
    list_editable = ['is_active','order']
    search_fields  = ['label']
    autocomplete_fields = ['category']
    
# ─────────────────────────────────────────────
#  FruitsVegetableCard  (NEW)
# ─────────────────────────────────────────────
@admin.register(FruitsVegetableCard)
class FruitsVegetableCardAdmin(admin.ModelAdmin):
    """
    Admin for the "Fruits and Vegetables" homepage card section.
    Inline image preview, editable order, all base card fields.
    """
    list_display  = ['title', 'subtitle', 'category', 'subcategory', 'badge', 'is_active', 'order', img_preview]
    list_editable = ['is_active', 'order']
    search_fields = ['title', 'subtitle', 'badge']
    ordering      = ['order']
    autocomplete_fields = ['category', 'subcategory']
    readonly_fields = ['image']
        
    fieldsets = (
        ('Card Content', {
            'fields': ('title', 'subtitle', 'category', 'subcategory', 'badge'),
        }),
        ('Image', {
            'fields': ('image_file', 'image')
        }),
        ('Visibility', {
            'fields': ('is_active', 'order'),
            'description': 'Lower order values appear first in the section.',
        }),
    )
 
# ─────────────────────────────────────────────
#  DailyDealCard  (NEW)
# ─────────────────────────────────────────────
 
@admin.register(DailyDealCard)
class DailyDealCardAdmin(admin.ModelAdmin):
    """
    Admin for the "Daily Deals" homepage card section.
    Includes the extra `description` field in addition to all base card fields.
    """
    list_display  = ['title', 'subtitle', 'badge', 'category', 'subcategory', 'is_active', 'order', img_preview]
    list_editable = ['is_active', 'order']
    search_fields = ['title', 'subtitle', 'badge', 'description']
    ordering      = ['order']
    autocomplete_fields = ['category', 'subcategory']
    readonly_fields = ['image']
 
    fieldsets = (
        ('Card Content', {
            'fields': ('title', 'subtitle', 'category', 'subcategory', 'description', 'badge'),
            'description': '"Description" is the longer body text shown under the subtitle.',
        }),
        ('Image', {
            'fields': ('image_file', 'image')
        }),
        ('Visibility', {
            'fields': ('is_active', 'order'),
            'description': 'Lower order values appear first in the section.',
        }),
    )
 
