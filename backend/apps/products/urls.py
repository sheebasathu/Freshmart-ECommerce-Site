"""apps/products/urls.py"""
from django.urls import path
from .views import (
    CategoryListView,
    SubCategoryListView,
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    BestSellingProductsView,
)

urlpatterns = [
    # Product list & detail
    path('',               ProductListView.as_view(),         name='product_list'),
    path('<int:id>/',      ProductDetailView.as_view(),       name='product_detail'),

    # Curated sections (no pagination)
    path('featured/',      FeaturedProductsView.as_view(),    name='featured_products'),
    path('best-selling/',  BestSellingProductsView.as_view(), name='best_selling_products'),

    # Taxonomy
    path('categories/',    CategoryListView.as_view(),        name='category_list'),
    path('subcategories/', SubCategoryListView.as_view(),     name='subcategory_list'),
]