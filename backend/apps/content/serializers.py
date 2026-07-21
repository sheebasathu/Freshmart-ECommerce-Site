"""apps/content/serializers.py"""
from rest_framework import serializers
from .models import (
    Banner, FeaturedSection, NavCategory, NavMenu,
    ShopCategory, PopularCategoryPill,
    FruitsVegetableCard, DailyDealCard
)

def abs_url(obj, field, context):
    """Return absolute URL for an ImageField, or None."""
    req = context.get('request')
    val = getattr(obj, field, None)
    return req.build_absolute_uri(val.url) if (val and req) else None

# ─────────────────────────────────────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────────────────────────────────────

class BannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = Banner
        fields = [
            'id', 'title', 'highlight_title', 'highlight_color',
            'subtitle', 'description', 'image_url',
            'cta_text', 'cta_link', 'placement', 'order',
        ]
    def get_image_url(self, obj):
        return abs_url(obj, 'image', self.context)

# ─────────────────────────────────────────────────────────────────────────────
# Featured section
# ─────────────────────────────────────────────────────────────────────────────

class FeaturedSectionSerializer(serializers.ModelSerializer):
    """
    Each featured card links to a category *and* optionally a subcategory.
    The frontend uses category_slug + sub_category_slug to build the URL:
      /listing?category=<slug>&subcategory=<slug>
    """
    image_url         = serializers.SerializerMethodField()
    category_slug     = serializers.CharField(source='category.slug',     read_only=True)
    subcategory_slug = serializers.CharField(source='subcategory.slug', read_only=True, default=None)
    class Meta:
        model  = FeaturedSection
        fields = [
            'id', 'title', 'subtitle', 'image_url',
            'category_slug', 'subcategory_slug', 'order',
        ]
    def get_image_url(self, obj):
        return abs_url(obj, 'image', self.context)

# ─────────────────────────────────────────────────────────────────────────────
# Navigation serializers
# ─────────────────────────────────────────────────────────────────────────────

class NavCategoryChildSerializer(serializers.ModelSerializer):
    path     = serializers.CharField(read_only=True)
    icon_url = serializers.SerializerMethodField()
    class Meta:
        model  = NavCategory
        fields = ['id', 'name', 'icon_url', 'icon_emoji', 'description', 'path', 'order']

    def get_icon_url(self, obj):
        return abs_url(obj, 'icon', self.context)

class NavCategorySerializer(serializers.ModelSerializer):
    path     = serializers.CharField(read_only=True)
    icon_url = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    class Meta:
        model  = NavCategory
        fields = [
            'id', 'name', 'icon_url', 'icon_emoji',
            'description', 'path', 'order', 'children',
        ]

    def get_icon_url(self, obj):
        return abs_url(obj, 'icon', self.context)

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by('order')
        return NavCategoryChildSerializer(qs, many=True, context=self.context).data


class NavMenuSerializer(serializers.ModelSerializer):
    path = serializers.CharField(read_only=True)

    class Meta:
        model  = NavMenu
        fields = ['id', 'title', 'slug', 'path', 'order']


# ─────────────────────────────────────────────────────────────────────────────
# Homepage grid serializers
# ─────────────────────────────────────────────────────────────────────────────

class ShopCategorySerializer(serializers.ModelSerializer):
    image_url     = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)

    class Meta:
        model  = ShopCategory
        fields = ['id', 'category_name', 'category_slug', 'category_icon', 'image_url', 'order']

    def get_image_url(self, obj):
        return abs_url(obj, 'image', self.context)

class PopularPillSerializer(serializers.ModelSerializer):
    path = serializers.CharField(read_only=True)

    class Meta:
        model  = PopularCategoryPill
        fields = ['id', 'label', 'icon', 'path']


# ─────────────────────────────────────────────────────────────────────────────
# Card section serializers
# ─────────────────────────────────────────────────────────────────────────────

class FruitsVegetableCardSerializer(serializers.ModelSerializer):
    image_url         = serializers.SerializerMethodField()
    category_slug     = serializers.CharField(source='category.slug',     read_only=True, default=None)
    subcategory_slug = serializers.CharField(source='subcategory.slug', read_only=True, default=None)

    class Meta:
        model  = FruitsVegetableCard
        fields = [
            'id', 'title', 'subtitle',
            'category_slug', 'subcategory_slug',
            'badge', 'image_url', 'order',
        ]

    def get_image_url(self, obj):
        return abs_url(obj, 'image', self.context)


class DailyDealCardSerializer(serializers.ModelSerializer):
    image_url         = serializers.SerializerMethodField()
    category_slug     = serializers.CharField(source='category.slug',     read_only=True, default=None)
    subcategory_slug = serializers.CharField(source='subcategory.slug', read_only=True, default=None)

    class Meta:
        model  = DailyDealCard
        fields = [
            'id', 'title', 'subtitle',
            'category_slug', 'subcategory_slug',
            'badge', 'description', 'image_url', 'order',
        ]

    def get_image_url(self, obj):
        return abs_url(obj, 'image', self.context)
    
