"""apps/products/admin.py"""
from django import forms
from django.contrib import admin
from django.utils.html import format_html
from .models import Category, SubCategory, Product, ProductImage, ProductVariant, ProductDescription, ProductSpecification


# ─────────────────────────────────────────────────────────────────────────────
# Category admin
# ─────────────────────────────────────────────────────────────────────────────

class SubCategoryInline(admin.TabularInline):
    """Lets admins add subcategories directly from the Category page."""
    model               = SubCategory
    extra               = 1
    fields              = ['name', 'slug', 'icon', 'image', 'is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display        = ['name', 'slug', 'icon', 'subcategory_count', 'is_active', 'order', 'preview']
    list_editable       = ['is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}
    search_fields       = ['name']
    inlines             = [SubCategoryInline]

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" height="40"/>', obj.image.url)
        return '—'
    preview.short_description = 'Image'

    def subcategory_count(self, obj):
        return obj.subcategories.count()
    subcategory_count.short_description = 'Sub-categories'


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    """
    Standalone subcategory management — same data can also be edited inline
    under each Category, but this gives a flat, searchable list view too.
    """
    list_display        = ['name', 'category', 'slug', 'icon', 'is_active', 'order', 'preview']
    list_editable       = ['is_active', 'order']
    list_filter         = ['category', 'is_active']
    search_fields       = ['name', 'category__name']
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['category']

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html('<img src="{}" height="40"/>', obj.image.url)
        return '—'
    preview.short_description = 'Image'


# ─────────────────────────────────────────────────────────────────────────────
# Product admin
# ─────────────────────────────────────────────────────────────────────────────
    
class ProductImageInline(admin.TabularInline):
    model           = ProductImage 
    extra           = 1
    fields          = ['image', 'alt_text', 'is_primary', 'is_hover', 'order', 'preview']
    readonly_fields = ['preview']
    ordering        = ['order']

    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" height="60" style="border-radius:4px"/>',
                obj.image.url
            )
        return '—'
    preview.short_description = 'Preview'


class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    extra  = 1
    fields = ['weight', 'price', 'mrp', 'stock', 'delivery_mins', 'is_active']

# ── Inline: ProductDescription ────────────────────────────────────────────────
class ProductDescriptionInline(admin.StackedInline):
    """
    Shown inside the Product change-page under "About Product".
    The stacked layout gives enough room for the long `body` textarea.
    """
    model       = ProductDescription
    extra       = 1
    max_num     = 1        # only one description per product
    can_delete  = False
    fields      = ['display_title', 'body', 'recipe_url']
    verbose_name        = 'About Product Description'
    verbose_name_plural = 'About Product Description'


# ── Inline: ProductSpecification ──────────────────────────────────────────────

class ProductSpecificationInline(admin.TabularInline):
    """
    Shown inside the Product change-page under "Specifications".
    Admins add one row per spec (Origin → Local Orchards, Organic → Yes, …).
    """
    model    = ProductSpecification
    extra    = 3          # start with 3 empty rows
    fields   = ['key', 'value', 'order']
    ordering = ['order']
    verbose_name        = 'Specification'
    verbose_name_plural = 'Product Specifications'

class ProductAdminForm(forms.ModelForm):
    """
    Restricts the subcategory dropdown to subcategories belonging to the
    currently-selected category, and re-filters live via JS when the
    category field changes.
    """
    class Meta:
        model  = Product
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        category = None
        if self.instance and self.instance.pk:
            category = self.instance.category
        elif 'category' in self.data:
            try:
                category = Category.objects.get(pk=self.data.get('category'))
            except (Category.DoesNotExist, ValueError, TypeError):
                category = None

        if category:
            self.fields['subcategory'].queryset = SubCategory.objects.filter(category=category)
        else:
            self.fields['subcategory'].queryset = SubCategory.objects.none()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form                = ProductAdminForm
    list_display        = [
        'name', 'brand', 'category', 'subcategory', 'badge',
        'product_image', 'is_active', 'is_featured', 'is_best_selling', 'order', 'created_at',
    ]
    list_editable       = ['is_active', 'is_featured', 'is_best_selling', 'order']
    list_filter         = ['category', 'subcategory', 'is_active', 'is_featured', 'is_best_selling']
    search_fields       = ['name', 'brand', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines             = [ProductImageInline, ProductVariantInline, ProductDescriptionInline, ProductSpecificationInline]
    ordering            = ['order', '-created_at']
    autocomplete_fields = ['category', 'subcategory']

    fieldsets = (
        ('Basic Info', {
            'fields': ('category', 'subcategory', 'name', 'slug', 'brand', 'badge', 'description'),
        }),
        ('Display Order', {
            'fields': ('order',),
            'description': 'Lower numbers appear first on homepage sections and the listing page.',
        }),
        ('Status Flags', {
            'fields': ('is_active', 'is_featured', 'is_best_selling'),
        }),
        ('Specifications', {
            'fields': ('specs',),
            'classes': ('collapse',),
            'description': 'Enter as JSON, e.g. {"Origin": "Local Farms", "Organic": "Yes"}',
        }),
    )

    class Media:
        # Lightweight vanilla-JS: re-populates the subcategory <select> when
        # the category field changes, without a page reload.
        js = ('products/admin_subcategory_filter.js',)

    def product_image(self, obj):
        img = obj.primary_image
        if img and img.image:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" height="50"/></a>',
                img.image.url, img.image.url
            )
        return '—'
    product_image.short_description = 'Image'

# ── Standalone admin classes ──────────────────────────────────────────────────

@admin.register(ProductDescription)
class ProductDescriptionAdmin(admin.ModelAdmin):
    list_display  = ['product', 'display_title', 'has_recipe']
    search_fields = ['product__name', 'display_title']
    raw_id_fields = ['product']

    def has_recipe(self, obj):
        return bool(obj.recipe_url)
    has_recipe.boolean = True
    has_recipe.short_description = 'Recipe URL?'


@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display  = ['product', 'key', 'value', 'order']
    list_editable = ['order']
    list_filter   = ['product__category']
    search_fields = ['product__name', 'key', 'value']
    ordering      = ['product', 'order']
