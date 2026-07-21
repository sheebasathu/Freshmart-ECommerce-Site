"""apps/products/filters.py"""
import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """
    All price filters reference the annotated `min_price` field that is
    added by `annotated_active_products()` in views.py.
    Filtering on `variants__price` directly causes duplicate product rows
    (one per matching variant) — the annotation collapses that with Min().
    """

    # ?category=fruits-vegetables
    # Returns products whose category slug matches (and implicitly all their
    # subcategories because products carry BOTH fk fields).
    category = django_filters.CharFilter(method='filter_category')

    # ?subcategory=vegetables  OR  ?subcategory=vegetables,fruits
    subcategory = django_filters.CharFilter(
        method='filter_subcategory',
        field_name='subcategory__slug'
    )

    # Price range — against annotated min_price (not variants__price join)
    min_price = django_filters.NumberFilter(field_name='min_price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='min_price', lookup_expr='lte')

    # ?is_featured=true  → Featured Offers listing page
    is_featured = django_filters.BooleanFilter(field_name='is_featured')

    # ?is_best_selling=true  → Best Selling listing page
    is_best_selling = django_filters.BooleanFilter(field_name='is_best_selling')

    brand = django_filters.CharFilter(method='filter_brand')

    class Meta:
        model  = Product
        fields = ['category', 'subcategory', 'brand', 'is_featured', 'is_best_selling']

    def filter_category(self, queryset, name, value):
        """
        Return every product that belongs to the given category slug.

        Two cases must match:
          1. product.category.slug = <value>
             — products assigned directly to this category.
          2. product.subcategory.category.slug = <value>
             — products assigned to a subcategory whose parent is this
               category (e.g. a product with subcategory="vegetables" whose
               parent category is "fruits-vegetables").

        Without case 2, clicking "View All" on the Fruits & Vegetables
        homepage section only returns products that have the category FK
        set directly — it misses products that were saved with only their
        subcategory FK pointing to a child of the category. That is exactly
        why only vegetables (one subcategory) were appearing instead of all
        subcategory products.
        """
        slug = (value or "").strip()
        if not slug:
            return queryset
        from django.db.models import Q
        return queryset.filter(
            Q(category__slug__iexact=slug) |
            Q(subcategory__category__slug__iexact=slug)
        ).distinct()

    def filter_subcategory(self, queryset, name, value):
        """
        Accepts:
        - ?subcategory=vegetables
        - ?subcategory=vegetables,fruits
        - ?sub_category=vegetables (NavMenu alias)
        """ 
        request = self.request
        value = value or request.GET.get('sub_category')
        
        if not value:
            return queryset
        
        from django.db.models import Q
        
        slugs = [s.strip() for s in value.split(',') if s.strip()]
        query = Q()
        for slug in slugs:
            query |= Q(subcategory__slug__iexact=slug)

        return queryset.filter(query).distinct()
    
    def filter_brand(self, queryset, name, value):
        from django.db.models import Q

        slugs = [s.strip() for s in value.split(',') if s.strip()]
        query = Q()

        for b in slugs:
            query |= Q(brand__icontains=b)

        return queryset.filter(query).distinct()
    
    @property
    def qs(self):
        parent = super().qs
        return parent.filter(is_active=True)