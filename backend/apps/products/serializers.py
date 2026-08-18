"""apps/products/serializers.py"""
from rest_framework import serializers
from django.db.models import Avg, Count
from .models import (
    Category, SubCategory, Product, 
    ProductImage,ProductVariant,  
    ProductDescription, ProductSpecification
)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Taxonomy serializers
# ─────────────────────────────────────────────────────────────────────────────
def get_product_image_url(image_obj, request=None):
    """
    Return the correct usable URL for a ProductImage.

    Priority:
    1. image_url
    2. uploaded ImageField
    """

    if not image_obj:
        return None

    # 1. Use image_url when available
    if image_obj.image_url:
        url = str(image_obj.image_url).strip()

        if not url:
            return None

        if url.startswith(('http://', 'https://')):
            return url

        if request:
            return request.build_absolute_uri(url)

        return url

    # 2. Fall back to ImageField
    if image_obj.image:
        try:
            url = image_obj.image.url

            if url.startswith(('http://', 'https://')):
                return url

            if request:
                return request.build_absolute_uri(url)

            return url

        except Exception:
            return None

    return None

class SubCategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = SubCategory
        fields = ['id', 'name', 'slug', 'icon', 'image_url', 'description']

    def get_image_url(self, obj):
            request = self.context.get("request")
    
            if not obj.image:
                return None
    
            try:
                # If it's ImageField
                if hasattr(obj.image, "url"):
                    return request.build_absolute_uri(obj.image.url)
    
                # If it's string (like "banners/file.png")
                return request.build_absolute_uri("/media/" + str(obj.image))
    
            except Exception:
                return None
    
        

class CategorySerializer(serializers.ModelSerializer):
    image_url     = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    subcategories = SubCategorySerializer(many=True, read_only=True)

    class Meta:
        model  = Category
        fields = [
            'id', 'name', 'slug', 'icon', 'image_url',
            'description', 'product_count', 'subcategories',
        ]

    def get_image_url(self, obj):
        request = self.context.get("request")

        if not obj.image:
            return None

        try:
            # If it's ImageField
            if hasattr(obj.image, "url"):
                return request.build_absolute_uri(obj.image.url)

            # If it's string (like "banners/file.png")
            return request.build_absolute_uri("/media/" + str(obj.image))

        except Exception:
            return None

    def get_product_count(self, obj):
        return getattr(obj, 'product_count', 0)


class CategoryLightSerializer(serializers.ModelSerializer):
    """Lightweight version embedded inside product serializers."""
    class Meta:
        model  = Category
        fields = ['id', 'name', 'slug', 'icon']


class SubCategoryLightSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SubCategory
        fields = ['id', 'name', 'slug']


# ─────────────────────────────────────────────────────────────────────────────
# Product image & variant serializers
# ─────────────────────────────────────────────────────────────────────────────

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'is_primary', 'is_hover', 'order']

    def get_image_url(self, obj):
        request = self.context.get("request")
        return get_product_image_url(obj, request)
        

class ProductVariantSerializer(serializers.ModelSerializer):
    discount = serializers.CharField(source='discount_pct', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model  = ProductVariant
        fields = [
            'id', 'weight', 'price', 'mrp',
            'stock', 'delivery_mins',
            'discount', 'in_stock', 'is_active',
        ]


# ─────────────────────────────────────────────────────────────────────────────
# Product list serializer (used on listing, home sections, wishlist)
# ─────────────────────────────────────────────────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    """
    Lightweight — only fields needed by the listing page card.
    primary_image  : URL of the main card image (imgA)
    hover_image    : URL of the rollover card image (imgB)
    variants       : all active weight options
    avg_rating     : computed property on Product
    review_count   : computed property on Product
    min_price      : from annotation added by annotated_active_products() in views
    """
    category_name    = serializers.CharField(source='category.name', read_only=True)
    category_slug    = serializers.CharField(source='category.slug', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True, default=None)
    subcategory_slug = serializers.CharField(source='subcategory.slug', read_only=True, default=None)
    images = ProductImageSerializer(many=True, read_only=True)
    primary_image    = serializers.SerializerMethodField()
    hover_image      = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()

    avg_rating   = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    # Exposed from the Min() annotation so the listing page can show a "From ₹X" label
    min_price = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        read_only=True, default=None,
        help_text='Lowest variant price — annotated by the view queryset.'
    )

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'badge',
            'category_name', 'category_slug',
            'subcategory_name', 'subcategory_slug',
            'images','primary_image', 'hover_image',
            'variants', 'min_price',
            'avg_rating', 'review_count',
            'is_featured', 'is_best_selling',
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        return get_product_image_url(obj.primary_image, request)
    
    def get_hover_image(self, obj):
        request = self.context.get('request')
        return get_product_image_url(obj.hover_image, request)
    
    def get_variants(self, obj):
        qs = obj.variants.filter(is_active=True)[:2]
        return ProductVariantSerializer(qs, many=True, context=self.context).data


class ProductDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductDescription
        fields = ['display_title', 'body', 'recipe_url']


class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductSpecification
        fields = ['key', 'value', 'order']

# ── Related-product lightweight serializer ────────────────────────────────────

class RelatedProductSerializer(serializers.ModelSerializer):
    """
    Minimal representation for the "Related Products" section:
      name, primary_image URL, first variant price + weight.
    """
    primary_image = serializers.SerializerMethodField()
    variants      = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ['id', 'name', 'slug', 'primary_image', 'variants']

    def get_primary_image(self, obj):
        request = self.context.get('request')
        return get_product_image_url(obj.primary_image, request)
    
    def get_variants(self, obj):
        qs = obj.variants.filter(is_active=True).order_by('id')[:1]
        return ProductVariantSerializer(qs, many=True, context=self.context).data
# ─────────────────────────────────────────────────────────────────────────────
# Product detail serializer (used on product detail page)
# ─────────────────────────────────────────────────────────────────────────────

class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer — all fields including full category tree, all images,
    all variants, specs, ratings.
    """
    category             = serializers.SerializerMethodField()
    subcategory          = serializers.SerializerMethodField()
    images               = ProductImageSerializer(many=True, read_only=True)
    variants             = serializers.SerializerMethodField()
    primary_image        = serializers.SerializerMethodField()
    
     # Section 2 — about
    product_description  = ProductDescriptionSerializer(read_only=True)

    # Section 4 — specs (structured rows preferred over raw specs JSON)
    specifications       = ProductSpecificationSerializer(many=True, read_only=True)

   # Reviews summary
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    rating_distribution  = serializers.SerializerMethodField()

    # Section 5 — related
    related_products     = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'badge', 'description',
            'category', 'subcategory',
            'images', 'primary_image',
            'variants',
            'specs',                    # raw JSON — kept for backward compat
            'specifications',           # structured rows (preferred)
            'product_description',      # about section
            'avg_rating', 'review_count', 'rating_distribution',
            'related_products',
            'is_featured', 'created_at',
        ]
    
    def get_primary_image(self, obj):
        request = self.context.get('request')
        return get_product_image_url(obj.primary_image, request)
    
    def get_variants(self, obj):
            qs = obj.variants.filter(is_active=True)
            return ProductVariantSerializer(qs, many=True, context=self.context).data

    def get_category(self, obj):
        if not obj.category:
            return None
        return {'id': obj.category.id, 'name': obj.category.name, 'slug': obj.category.slug}

    def get_subcategory(self, obj):
        if not obj.subcategory:
            return None
        return {'id': obj.subcategory.id, 'name': obj.subcategory.name, 'slug': obj.subcategory.slug}

    def get_avg_rating(self, obj):
        result = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))['avg']
        return round(result, 1) if result else 0.0

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

    def get_rating_distribution(self, obj):
        """
        Returns { 5: <pct>, 4: <pct>, 3: <pct>, 2: <pct>, 1: <pct> }
        where each value is the integer percentage of reviews with that rating.
        """
        qs    = obj.reviews.filter(is_approved=True)
        total = qs.count()
        if total == 0:
            return {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        counts = qs.values('rating').annotate(n=Count('id'))
        dist   = {r: 0 for r in range(1, 6)}
        for row in counts:
            if row['rating'] in dist:
                dist[row['rating']] = round(row['n'] / total * 100)
        return dist

    def get_related_products(self, obj):
        """
        Up to 3 products from the same subcategory (or category if no subcat).
        Excludes the current product. Uses RelatedProductSerializer.
        """
        qs = Product.objects.filter(is_active=True).exclude(pk=obj.pk)
        if obj.subcategory:
            qs = qs.filter(subcategory=obj.subcategory)
        elif obj.category:
            qs = qs.filter(category=obj.category)
        qs = qs.select_related('category', 'subcategory').prefetch_related('images', 'variants').order_by('order', '-created_at')[:3]
        return RelatedProductSerializer(qs, many=True, context=self.context).data
    
