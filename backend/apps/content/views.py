"""apps/content/views.py"""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    Banner, FeaturedSection, NavCategory, NavMenu,
    ShopCategory, PopularCategoryPill,
    FruitsVegetableCard, DailyDealCard
)
from .serializers import (
    BannerSerializer, FeaturedSectionSerializer,
    NavCategorySerializer, NavMenuSerializer,
    ShopCategorySerializer, PopularPillSerializer,
    FruitsVegetableCardSerializer, DailyDealCardSerializer,
)

class NavCategoryListView(APIView):
    """
    GET /api/content/nav-categories/
    Returns all active top-level NavCategory entries (Shop-by-Category dropdown panel).
    Children (sub-categories) are embedded so the frontend can render fly-outs
    without a second round-trip.
    ?all=true → include inactive (admin preview only)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        include_all = request.query_params.get('all', '').lower() == 'true'
        qs = NavCategory.objects.filter(parent__isnull=True).order_by('order')
        if not include_all:
            qs = qs.filter(is_active=True)
        qs = qs.prefetch_related('children')
        return Response(NavCategorySerializer(qs, many=True, context={'request': request}).data)


class NavMenuListView(APIView):
    """
    GET /api/content/nav-menus/
    Returns active horizontal top-bar items in display order.
    ?all=true → include inactive (admin preview only)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        include_all = request.query_params.get('all', '').lower() == 'true'
        qs = NavMenu.objects.order_by('order')
        if not include_all:
            qs = qs.filter(is_active=True)
        return Response(NavMenuSerializer(qs, many=True, context={'request': request}).data)


class FruitsVegetableCardListView(APIView):
    """GET /api/content/fruits-vegetables/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = FruitsVegetableCard.objects.filter(is_active=True).order_by('order')
        return Response(FruitsVegetableCardSerializer(qs, many=True, context={'request': request}).data)


class DailyDealCardListView(APIView):
    """GET /api/content/daily-deals/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = DailyDealCard.objects.filter(is_active=True).order_by('order')
        return Response(DailyDealCardSerializer(qs, many=True, context={'request': request}).data)


class HomepageContentView(APIView):
    """
    GET /api/content/homepage/
    Single request returning ALL dynamic homepage content managed from Django Admin.
    React replaces every hardcoded section with this response.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        ctx = {'request': request}

        def banners(placement):
            return BannerSerializer(
                Banner.objects.filter(is_active=True, placement=placement).order_by('order'),
                many=True, context=ctx,
            ).data

        # Top-level NavCategory entries with children prefetched
        nav_category_qs = (
            NavCategory.objects
            .filter(is_active=True, parent__isnull=True)
            .prefetch_related('children')
            .order_by('order')
        )

        nav_menu_qs = NavMenu.objects.filter(is_active=True).order_by('order')

        return Response({
            # ── Banners ─────────────────────────────────────────────────
            'hero_banners':      banners('hero'),
            'promo_banners':     banners('promo'),
            'top_offer_banners': banners('top_offers'),

            # ── Featured Offers cards ────────────────────────────────────
            'featured_sections': FeaturedSectionSerializer(
                FeaturedSection.objects
                .filter(is_active=True)
                .select_related('category', 'subcategory')
                .order_by('order'),
                many=True, context=ctx,
            ).data,

            # ── Navigation ───────────────────────────────────────────────
            'nav_categories': NavCategorySerializer(
                nav_category_qs, many=True, context=ctx,
            ).data,
            'nav_menus': NavMenuSerializer(
                nav_menu_qs, many=True, context=ctx,
            ).data,

            # ── Shop by Category grid ────────────────────────────────────
            'shop_categories': ShopCategorySerializer(
                ShopCategory.objects
                .filter(is_active=True)
                .select_related('category')
                .order_by('order'),
                many=True, context=ctx,
            ).data,

            # ── Popular category pills ───────────────────────────────────
            'popular_pills': PopularPillSerializer(
                PopularCategoryPill.objects.filter(is_active=True).order_by('order'),
                many=True, context=ctx,
            ).data,

            # ── Card sections ────────────────────────────────────────────
            'fruits_vegetables': FruitsVegetableCardSerializer(
                FruitsVegetableCard.objects
                .filter(is_active=True)
                .select_related('category', 'subcategory')
                .order_by('order'),
                many=True, context=ctx,
            ).data,
            'daily_deals': DailyDealCardSerializer(
                DailyDealCard.objects
                .filter(is_active=True)
                .select_related('category', 'subcategory')
                .order_by('order'),
                many=True, context=ctx,
            ).data,
        })