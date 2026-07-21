"""apps/products/views.py"""
from django.db.models import Min, Prefetch
from rest_framework import generics, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, SubCategory, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer, SubCategorySerializer,
    ProductListSerializer, ProductDetailSerializer,
)
from django.db.models import Count, Q  
from .filters import ProductFilter
from .pagination import NineItemPagination


def annotated_active_products():
    """
    Base queryset used by all product list views.
    - Active products only
    - Annotates min_price (lowest variant price) to avoid duplicate rows from JOIN
    - Prefetches images and active variants (2 extra queries, not N+1)
    - select_related for category and subcategory in one JOIN
    """
    active_variants = ProductVariant.objects.filter(is_active=True)
    all_images      = ProductImage.objects.all().order_by('order')
    return (
        Product.objects
        .filter(is_active=True)
        .select_related('category', 'subcategory')
        .prefetch_related(
            Prefetch('variants', queryset=active_variants),
            Prefetch('images',   queryset=all_images),
        )
        .annotate(min_price=Min('variants__price'))
        .order_by('order', '-created_at')
    )


class CategoryListView(generics.ListAPIView):
    """GET /api/products/categories/ — all active categories + embedded subcategories."""
    permission_classes = [permissions.AllowAny]
    serializer_class   = CategorySerializer
    pagination_class   = None

    def get_queryset(self):
        return (
            Category.objects
            .filter(is_active=True)
             .annotate(
            product_count=Count(
                'products',
                filter=Q(products__is_active=True)
            )
        )
            .prefetch_related(
                Prefetch(
                    'subcategories',
                    queryset=SubCategory.objects.filter(is_active=True).order_by('order'),
                )
            )
            .order_by('order', 'name')
        )


class SubCategoryListView(generics.ListAPIView):
    """
    GET /api/products/subcategories/
    ?category=<slug>      filter by parent category slug
    ?category_pk=<id>     filter by parent category PK (used by admin JS live-filter)
    """
    permission_classes = [permissions.AllowAny]
    serializer_class   = SubCategorySerializer
    pagination_class   = None

    def get_queryset(self):
        qs   = SubCategory.objects.filter(is_active=True).select_related('category').order_by('order')
        slug = self.request.query_params.get('category')
        pk   = self.request.query_params.get('category_pk')
        if slug:
            qs = qs.filter(category__slug__iexact=slug)
        elif pk:
            qs = qs.filter(category_id=pk)
        return qs


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    ?category=<slug>         filter by category slug
    ?subcategory=<slug>      filter by subcategory slug (comma-separated ok)
    ?search=<term>           full-text across name, brand, description, category, subcategory
    ?min_price / ?max_price  price range (uses annotated min_price)
    ?brand=<name>            brand contains
    ?is_featured=true        featured products only
    ?is_best_selling=true    best-selling products only
    ?ordering=price|-price|name|order|-created_at
    ?page=2  ?page_size=9
    """
    permission_classes = [permissions.AllowAny]
    serializer_class   = ProductListSerializer
    pagination_class   = NineItemPagination
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ProductFilter
    search_fields      = ['name', 'brand', 'description', 'category__name', 'subcategory__name']
    ordering_fields    = ['name', 'created_at', 'min_price', 'order']
    ordering           = ['order', '-created_at']

    def get_queryset(self):
        return  annotated_active_products()
        

class ProductDetailView(generics.RetrieveAPIView):
    """GET /api/products/<id>/ — full product detail."""
    permission_classes = [permissions.AllowAny]
    serializer_class   = ProductDetailSerializer
    lookup_field       = 'id'

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .select_related('category', 'subcategory')
            .prefetch_related(
                Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True)),
                Prefetch('images',   queryset=ProductImage.objects.all().order_by('order')),
            )
        )


class FeaturedProductsView(generics.ListAPIView):
    """GET /api/products/featured/ — up to 12 featured products, no pagination."""
    permission_classes = [permissions.AllowAny]
    serializer_class   = ProductListSerializer
    pagination_class   = None

    def get_queryset(self):
        return annotated_active_products().filter(is_featured=True)[:12]


class BestSellingProductsView(generics.ListAPIView):
    """GET /api/products/best-selling/ — up to 12 best-selling products, no pagination."""
    permission_classes = [permissions.AllowAny]
    serializer_class   = ProductListSerializer
    pagination_class   = None

    def get_queryset(self):
        return annotated_active_products().filter(is_best_selling=True)[:12]