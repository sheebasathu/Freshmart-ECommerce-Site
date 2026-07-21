"""apps/content/models.py — Admin-managed site content"""
from django.db import models


# ─────────────────────────────────────────────────────────────────────────────
#  Abstract base for reusable card-section models
# ─────────────────────────────────────────────────────────────────────────────

class BaseCardSection(models.Model):
    """
    Abstract base model for homepage card-grid sections.
    Provides the common fields every card needs:
      title, subtitle, image, badge, order, is_active.
    Concrete subclasses add domain-specific fields on top.
    """
    title        = models.CharField(max_length=200)
    subtitle     = models.CharField(max_length=300, blank=True)
    category     = models.ForeignKey(
        'products.Category', on_delete=models.SET_NULL, null=True, blank=True
    )
    subcategory = models.ForeignKey(
    'products.SubCategory', on_delete=models.SET_NULL, null=True, blank=True
    )
    image    = models.ImageField(upload_to='card_sections/')
    badge    = models.CharField(
        max_length=100, blank=True,
        help_text='Short label shown on the card, e.g. "MIN 27% OFF" or "NEW".'
    )
    is_active = models.BooleanField(default=True)
    order     = models.PositiveIntegerField(default=0)
    class Meta:
        abstract = True
        ordering = ['order']
    def __str__(self):
        return self.title
    
    def clean(self):
        from django.core.exceptions import ValidationError

        if self.subcategory and self.category:
            if self.subcategory.category_id != self.category_id:
                raise ValidationError(
                    "Subcategory must belong to the selected category."
                )

class FruitsVegetableCard(BaseCardSection):
    """
    Cards for the "Fruits and Vegetables" homepage section.
    Inherits: title, subtitle, image, badge, order, is_active.
    No extra fields — the base covers everything needed.
    """
    class Meta(BaseCardSection.Meta):
        db_table            = 'fm_fruits_vegetable_cards'
        verbose_name        = 'Fruits & Vegetable Card'
        verbose_name_plural = 'Fruits & Vegetable Cards'


class DailyDealCard(BaseCardSection):
    """
    Cards for the "Daily Deals" homepage section.
    Inherits: title, subtitle, image, badge, order, is_active.
    Adds: description — a longer body text shown under the subtitle.
    """
    description = models.TextField(
        blank=True,
        help_text='Optional longer description shown beneath the subtitle on the card.'
    )

    class Meta(BaseCardSection.Meta):
        db_table            = 'fm_daily_deal_cards'
        verbose_name        = 'Daily Deal Card'
        verbose_name_plural = 'Daily Deal Cards'

# ─────────────────────────────────────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────────────────────────────────────

class Banner(models.Model):
    PLACEMENT = [
        ('hero',       'Hero — Homepage top slider'),
        ('promo',      'Promo — Discount & Product Offer banner'),
        ('top_offers', 'Top Offers — Grid section'),
        ('popup',      'Popup Banner'),
    ]
    title           = models.CharField(max_length=200)
    highlight_title = models.CharField(max_length=100, blank=True, null=True,
                                        help_text='Green/coloured first word(s) in the hero headline.')
    highlight_color = models.CharField(max_length=20, default='#4ade80',
                                        help_text='CSS colour for highlight_title (hex or named).')
    subtitle        = models.CharField(max_length=300, blank=True)
    description     = models.CharField(max_length=500, blank=True,
                                        help_text='Body paragraph shown below the subtitle.')
    image           = models.ImageField(upload_to='banners/')
    cta_text        = models.CharField(max_length=100, blank=True, default='Shop Now')
    cta_link        = models.CharField(max_length=300, blank=True,
                                        help_text='Relative path or full URL for the CTA button.')
    placement       = models.CharField(max_length=20, choices=PLACEMENT, default='hero')
    is_active       = models.BooleanField(default=True)
    order           = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fm_banners'
        ordering = ['order']

    def __str__(self):
        return f'[{self.placement}] {self.title}'


# ─────────────────────────────────────────────────────────────────────────────
# Featured Offers section
# ─────────────────────────────────────────────────────────────────────────────

class FeaturedSection(models.Model):
    """Featured Offers grid on homepage — each card links to a category."""
    title        = models.CharField(max_length=200)
    subtitle     = models.CharField(max_length=300, blank=True)
    image        = models.ImageField(upload_to='featured/')
    category     = models.ForeignKey(
        'products.Category', on_delete=models.SET_NULL, null=True, blank=True
    )
    subcategory = models.ForeignKey(
        'products.SubCategory', on_delete=models.SET_NULL, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    order     = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fm_featured_sections'
        ordering = ['order']

    def __str__(self):
        return self.title


# ─────────────────────────────────────────────────────────────────────────────
# Navigation models
# ─────────────────────────────────────────────────────────────────────────────

class NavCategory(models.Model):
    """
    LEFT PANEL — "Shop by Category" dropdown.
    Each entry has an icon image, a display name, and a short description
    (e.g. "Rice, Oils, Dals") shown in green below the name.
    Links to a products.Category or an arbitrary custom path.
    Supports future subcategory nesting via the parent FK.
    """
    icon        = models.ImageField(
        upload_to='nav_icons/', blank=True, null=True,
        help_text='Square icon image shown in the dropdown (64×64 px recommended).'
    )
    icon_emoji  = models.CharField(
        max_length=10, blank=True,
        help_text='Fallback emoji if no image icon is uploaded (e.g. 🥦).'
    )
    name        = models.CharField(max_length=100)
    description = models.TextField(
        blank=True,
        help_text='Green sub-text with item examples (e.g. Rice, Oils, Dals).'
    )
    category    = models.ForeignKey(
        'products.Category',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='nav_category_entries',
    )
    custom_path = models.CharField(
        max_length=200, blank=True,
        help_text='Override URL if this entry should not follow the category slug.'
    )
    parent      = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='children',
        help_text='Leave blank for top-level entries.'
    )
    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table            = 'fm_nav_categories'
        ordering            = ['order']
        verbose_name        = 'Nav Category (Dropdown)'
        verbose_name_plural = 'Nav Categories (Dropdown)'

    @property
    def path(self):
        if self.custom_path:
            return self.custom_path
        if self.category:
            return f'/listing?category={self.category.slug}'
        return '/listing'

    def __str__(self):
        return self.name

class NavMenu(models.Model):
    """
    TOP HORIZONTAL NAV — the scrollable pill/link row beneath the header.
    Examples: "Exotic Fruits & Vegetables", "Fresh Chicken", "Tea", "Hair Care".
    Each item links to a category listing page or a custom path.
    """
    title       = models.CharField(max_length=100)
    slug        = models.SlugField(
        max_length=120, unique=True,
        help_text='Auto-populate from title. Used to build the default /listing?category= URL.'
    )
    # category    = models.ForeignKey(
    #     'products.Category',
    #     on_delete=models.SET_NULL,
    #     null=True, blank=True,
    #     related_name='nav_menu_entries',
    #     help_text='If set, the link points to this category listing automatically.'
    # )
    subcategory = models.ForeignKey(
        'products.SubCategory', on_delete=models.SET_NULL, null=True, blank=True
    )
    custom_path = models.CharField(
        max_length=200, blank=True,
        help_text='Override URL (e.g. /deals or /listing?tag=new). Takes priority over category.'
    )
    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table            = 'fm_nav_menus'
        ordering            = ['order']
        verbose_name        = 'Nav Menu (Top Bar)'
        verbose_name_plural = 'Nav Menus (Top Bar)'

    @property
    def path(self):
        if self.custom_path:
            return self.custom_path
        if self.subcategory:
            return f'/listing?subcategory={self.subcategory.slug}'
        return '/listing'

    def __str__(self):
        return self.title


# ─────────────────────────────────────────────────────────────────────────────
# Homepage grid models
# ─────────────────────────────────────────────────────────────────────────────

class ShopCategory(models.Model):
    """Shop-by-Category grid on homepage — admin sets image per category."""
    category  = models.OneToOneField('products.Category', on_delete=models.CASCADE)
    image     = models.ImageField(upload_to='shop_categories/')
    is_active = models.BooleanField(default=True)
    order     = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fm_shop_categories'
        ordering = ['order']

    def __str__(self):
        return str(self.category)

class PopularCategoryPill(models.Model):
    """Popular Categories pill row on homepage."""
    label       = models.CharField(max_length=100)
    icon        = models.CharField(max_length=10, blank=True,
                                    help_text='Emoji icon shown before the label e.g. 🥦')
    category    = models.ForeignKey(
        'products.Category', on_delete=models.CASCADE, null=True, blank=True
    )
    custom_path = models.CharField(max_length=200, blank=True)
    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fm_popular_pills'
        ordering = ['order']

    @property
    def path(self):
        if self.custom_path:
            return self.custom_path
        if self.category:
            return f'/listing?category={self.category.slug}'
        return '/listing'

    def __str__(self):
        return self.label