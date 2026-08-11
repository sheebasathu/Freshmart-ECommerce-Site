"""apps/content/serializers.py"""
from rest_framework import serializers
from .models import (
    Banner, FeaturedSection, NavCategory, NavMenu,
    ShopCategory, PopularCategoryPill,
    FruitsVegetableCard, DailyDealCard
)

# ✅ helper for Django ImageField
def build_url(request, url):
    if not url:
        return None
    url = str(url)
    
     # Already an absolute URL.
    # IMPORTANT for Cloudinary.
    if url.startswith("http://") or url.startswith("https://"):
        return url
    
     # Relative URL/path.
    if request:
        return request.build_absolute_uri(url)

    return url
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
        request = self.context.get("request")

        try:
            if obj.image:
                if hasattr(obj.image, "url"):
                    return build_url(request, obj.image.url)
            # if it's already URLField
                return build_url(request, obj.image)
            if obj.image_file:
                return build_url(request, obj.image_file.url)
        except Exception:
            pass
        
        return None

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
    category_slug     = serializers.SerializerMethodField()
    subcategory_slug = serializers.SerializerMethodField()
    class Meta:
        model  = FeaturedSection
        fields = [
            'id', 'title', 'subtitle', 'image_url',
            'category_slug', 'subcategory_slug', 'order',
        ]
    def get_image_url(self, obj):
            request = self.context.get("request")
    
            try:
                if obj.image:
                    if hasattr(obj.image, "url"):
                        return build_url(request, obj.image.url)
                # if it's already URLField
                    return build_url(request, obj.image)
                
                if obj.image_file:
                    return build_url(request, obj.image_file.url)

            except Exception:
                pass
            return None
    def get_category_slug(self, obj):
        return obj.category.slug if obj.category else None

    def get_subcategory_slug(self, obj):
        return obj.subcategory.slug if obj.subcategory else None

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
        request = self.context.get("request")

        try:
            if obj.icon and hasattr(obj.icon, "url"):
                return build_url(request, obj.icon.url)
        except Exception:
            pass

        return None

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
        return build_url(self.context.get("request"), obj.icon.url if obj.icon else None)

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
    category_name = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    category_icon = serializers.SerializerMethodField()

    class Meta:
        model  = ShopCategory
        fields = ['id', 'category_name', 'category_slug', 'category_icon', 'image_url', 'order']

    def get_image_url(self, obj):
            request = self.context.get("request")
    
            try:
                if obj.image:
                    if hasattr(obj.image, "url"):
                        return build_url(request, obj.image.url)

                    return build_url(request, obj.image)

                if obj.image_file:
                    return build_url(request, obj.image_file.url)

            except Exception:
                pass

            return None
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_category_slug(self, obj):
        try:
            return obj.category.slug if obj.category else None
        except Exception:
            return None

    def get_category_icon(self, obj):
        request = self.context.get("request")

        if not obj.category or not obj.category.icon:
            return None

        try:
            icon = obj.category.icon

        # If it's ImageField
            if hasattr(icon, "url"):
                return request.build_absolute_uri(icon.url)

        # If it's already string (URL or path)
            return icon

        except Exception:
            return None

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
    category_slug     = serializers.SerializerMethodField()
    subcategory_slug = serializers.SerializerMethodField()

    class Meta:
        model  = FruitsVegetableCard
        fields = [
            'id', 'title', 'subtitle',
            'category_slug', 'subcategory_slug',
            'badge', 'image_url', 'order',
        ]

    def get_image_url(self, obj):
            request = self.context.get("request")
    
            try:
                if obj.image:
                    if hasattr(obj.image, "url"):
                        return build_url(request, obj.image.url)
                # if it's already URLField
                    return build_url(request, obj.image)
                if obj.image_file:
                    return build_url(request, obj.image_file.url)
            except Exception:
                 pass
             
            return None
    def get_category_slug(self, obj):
        try:
            return obj.category.slug if obj.category else None
        except Exception:
            return None
    def get_subcategory_slug(self, obj):
        try:
            return obj.subcategory.slug if obj.subcategory else None
        except Exception:
            return None

class DailyDealCardSerializer(serializers.ModelSerializer):
    image_url         = serializers.SerializerMethodField()
    category_slug     = serializers.SerializerMethodField()
    subcategory_slug = serializers.SerializerMethodField()

    class Meta:
        model  = DailyDealCard
        fields = [
            'id', 'title', 'subtitle',
            'category_slug', 'subcategory_slug',
            'badge', 'description', 'image_url', 'order',
        ]

    def get_image_url(self, obj):
            request = self.context.get("request")
    
            try:
                if obj.image:
                    if hasattr(obj.image, "url"):
                        return build_url(request, obj.image.url)
                # if it's already URLField
                    return build_url(request, obj.image)
                if obj.image_file:
                    return build_url(request, obj.image_file.url)
            except Exception:
                pass
                         
            return None
    def get_category_slug(self, obj):
        try:
            return obj.category.slug if obj.category else None
        except Exception:
            return None

    def get_subcategory_slug(self, obj):
        try:
            return obj.subcategory.slug if obj.subcategory else None
        except Exception:
            return None
    
