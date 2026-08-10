"""apps/products/models.py"""
from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.db.models import Q, UniqueConstraint


# ─────────────────────────────────────────────────────────────────────────────
# Category & SubCategory
# ─────────────────────────────────────────────────────────────────────────────

class Category(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    slug        = models.SlugField(unique=True, blank=True)
    icon        = models.CharField(max_length=10, blank=True, help_text='Emoji icon e.g. 🥦')
    image       = models.ImageField(upload_to='categories/', null=True, blank=True)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table            = 'fm_categories'
        ordering            = ['order', 'name']
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    """
    One level of nesting under Category.
    e.g. Category="Fruits & Vegetables" → SubCategory="Vegetables", "Fruits"
    Products carry both FK fields so filtering by either level works cleanly.
    """
    category    = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name='subcategories'
    )
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(blank=True)
    icon        = models.CharField(max_length=10, blank=True, help_text='Emoji icon e.g. 🥦')
    image = models.ImageField(upload_to='subcategories/', null=True, blank=True)
    description = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table        = 'fm_subcategories'
        ordering        = ['order', 'name']
        unique_together = [['category', 'slug']]
        verbose_name_plural = 'Sub-Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)        
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.category.name} → {self.name}'


# ─────────────────────────────────────────────────────────────────────────────
# Product
# ─────────────────────────────────────────────────────────────────────────────

class Product(models.Model):
    category    = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name='products'
    )
    subcategory = models.ForeignKey(
        SubCategory, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='products',
        help_text='Optional sub-level classification within the category.'
    )
    name        = models.CharField(max_length=200)
    slug        = models.SlugField(unique=True, blank=True)
    brand       = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    badge       = models.CharField(
        max_length=50, blank=True,
        help_text='Short promotional label shown on card e.g. "41% OFF", "NEW".'
    )
    is_active      = models.BooleanField(default=True)
    is_featured    = models.BooleanField(
        default=False,
        help_text='Show in Featured Offers section and Smart Basket on homepage.'
    )
    is_best_selling = models.BooleanField(
        default=False,
        help_text='Show in Best Selling section on homepage.'
    )
    order       = models.PositiveIntegerField(
        default=0,
        help_text='Lower numbers appear first in homepage sections and listing page.'
    )
    specs       = models.JSONField(
        default=dict, blank=True,
        help_text='Key-value product specifications shown on detail page.'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fm_products'
        ordering = ['order', '-created_at']
        indexes = [
        models.Index(fields=['category']),
        models.Index(fields=['subcategory']),
        models.Index(fields=['is_active']),
        models.Index(fields=['is_featured']),
        models.Index(fields=['is_best_selling']),
        models.Index(fields=['slug'])
    ]
        
    def clean(self):
        if self.subcategory and self.category:
            if self.subcategory.category_id != self.category_id:
                raise ValidationError(
                    "Subcategory must belong to the selected category."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        
        if not self.slug:
            base = slugify(f'{self.name}-{self.brand or "item"}')
            self.slug = base
            n = 1
            while Product.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f'{base}-{n}'
                n += 1
        super().save(*args, **kwargs)

    # ── Helpers used by serializers ───────────────────────────────────────────

    @property
    def primary_image(self):
        """Return the primary image object, or the first image if none is marked primary."""
        return (
            self.images.filter(is_primary=True).first()
            or self.images.first()
        )

    @property
    def hover_image(self):
        """Return the hover (rollover) image object, if one is marked."""
        return self.images.filter(is_hover=True).first()

    @property
    def avg_rating(self):
        from django.db.models import Avg
        result = self.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))['avg']
        return round(result, 1) if result else 0.0

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────────────────────────────────────
# ProductImage
# ─────────────────────────────────────────────────────────────────────────────

class ProductImage(models.Model):
    """
    One product can have many images.
    is_primary  — main image shown on listing cards and as first detail image.
    is_hover    — second image shown on card hover (the "imgB" from the original static data).
    order       — controls display sequence in the image gallery.
    """
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    alt_text   = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(
        default=False,
        help_text='Main card image (imgA). Only one image per product should be primary.'
    )
    is_hover   = models.BooleanField(
        default=False,
        help_text='Hover/rollover image on card (imgB). Only one image per product should be hover.'
    )
    order      = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fm_product_images'
        ordering = ['order']
        constraints = [
        UniqueConstraint(
            fields=['product'],
            condition=Q(is_primary=True),
            name='unique_primary_image_per_product'
        ),
        UniqueConstraint(
            fields=['product'],
            condition=Q(is_hover=True),
            name='unique_hover_image_per_product'
        ),
    ]

    def save(self, *args, **kwargs):
        # Ensure at most one primary and one hover image per product
            
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
            
        if self.is_hover:
            ProductImage.objects.filter(
                product=self.product, is_hover=True
            ).exclude(pk=self.pk).update(is_hover=False)
            
        super().save(*args, **kwargs)

    def __str__(self):
        flags = []
        if self.is_primary: flags.append('primary')
        if self.is_hover:   flags.append('hover')
        label = f' [{", ".join(flags)}]' if flags else ''
        return f'{self.product.name} — image {self.order}{label}'


# ─────────────────────────────────────────────────────────────────────────────
# ProductVariant
# ─────────────────────────────────────────────────────────────────────────────

class ProductVariant(models.Model):
    """
    Represents a size / weight option for a product (e.g. "1 kg", "500 gm").
    The cart, order items, and wishlist all reference the product, while the
    cart specifically references the variant to track the chosen weight.
    """
    product       = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='variants'
    )
    weight        = models.CharField(max_length=50, help_text='e.g. "1 kg", "500 gm", "80g pack"')
    price         = models.DecimalField(max_digits=10, decimal_places=2, help_text='Selling price in ₹')
    mrp           = models.DecimalField(max_digits=10, decimal_places=2, help_text='Maximum retail price in ₹')
    stock         = models.PositiveIntegerField(default=0)
    delivery_mins = models.PositiveIntegerField(default=10, help_text='Estimated delivery in minutes')
    is_active     = models.BooleanField(default=True)
    
    def clean(self):
        if self.price > self.mrp:
            raise ValidationError({
                "price": "Price cannot be greater than MRP."
            })
    def save(self, *args, **kwargs):
        self.full_clean()  # ensures clean() runs
        super().save(*args, **kwargs)

    class Meta:
        db_table        = 'fm_product_variants'
        unique_together = [['product', 'weight']]

    @property
    def discount_pct(self):
        """Returns a human-readable discount string e.g. '41% OFF'."""
        if self.mrp and self.mrp > 0:
            pct = round(((self.mrp - self.price) / self.mrp) * 100)
            return f'{pct}% OFF' if pct > 0 else ''
        return ''

    @property
    def in_stock(self):
        return self.stock > 0

    def __str__(self):
        return f'{self.product.name} — {self.weight}'

class ProductDescription(models.Model):
    """
    Section 2 on the product-detail page:
      "Fresho! Capsicum - Green"        ← display_title  (h2 above the box)
      "About the product"               ← always the box sub-label (static in JSX)
      <long body text>                  ← body
      "Don't forget … <recipe_url>"     ← recipe_url (optional, rendered as green link)

    One-to-one with Product. Managed via Django Admin.
    """
    product      = models.OneToOneField(
        'Product',
        on_delete=models.CASCADE,
        related_name='product_description',
    )
    display_title = models.CharField(
        max_length=300,
        help_text='H2 title shown above the "About the product" box. '
                  'Usually the brand + product name (e.g. "Fresho! Capsicum - Green"). '
                  'Falls back to product.name when left blank.',
        blank=True,
    )
    body = models.TextField(
        help_text='Full "About the product" paragraph body text.',
    )
    recipe_url = models.URLField(
        blank=True,
        help_text='Optional recipe link shown at the end of the about section.',
    )

    class Meta:
        db_table = 'fm_product_descriptions'
        verbose_name        = 'Product Description'
        verbose_name_plural = 'Product Descriptions'

    def __str__(self):
        return f'Description for {self.product.name}'


class ProductSpecification(models.Model):
    """
    Section 4 — "Product Specifications" 2-col keyed table.
    Each row is one specification entry (Origin, Variety, Organic, Storage, …).
    The `order` field controls row order.

    Example rows for Capsicum-Green:
      ORIGIN      → Local Orchards
      VARIETY     → Bell Pepper
      ORGANIC     → Yes
      STORAGE     → Refrigerate for up to 1 week
      BRAND       → Fresho!
      SHELF LIFE  → 7 days
    """
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='specifications',
    )
    key   = models.CharField(
        max_length=100,
        help_text='Label shown in uppercase (e.g. "ORIGIN", "SHELF LIFE").'
    )
    value = models.CharField(
        max_length=500,
        help_text='Value for this specification (e.g. "Local Orchards").'
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table   = 'fm_product_specifications'
        ordering   = ['order', 'id']
        verbose_name        = 'Product Specification'
        verbose_name_plural = 'Product Specifications'

    def __str__(self):
        return f'{self.product.name} — {self.key}: {self.value}'
