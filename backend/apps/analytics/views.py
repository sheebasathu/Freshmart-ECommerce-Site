"""apps/analytics/views.py"""
from decimal import Decimal
from django.db.models import Sum, Count, F
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.orders.models import Order, OrderItem
from .models import ProductView, SearchQuery, DailySalesSnapshot
from .serializers import DailySalesSnapshotSerializer

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class SalesDashboardView(APIView):
    """GET /api/analytics/dashboard/"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        now   = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        paid  = Order.objects.filter(payment_status='paid')
        daily_chart = DailySalesSnapshot.objects.order_by('-date')[:30]

        return Response({
            'today': {
                'orders':  paid.filter(created_at__gte=today).count(),
                'revenue': str(paid.filter(created_at__gte=today).aggregate(r=Sum('total'))['r'] or Decimal('0')),
            },
            'this_month': {
                'orders':  paid.filter(created_at__gte=month).count(),
                'revenue': str(paid.filter(created_at__gte=month).aggregate(r=Sum('total'))['r'] or Decimal('0')),
            },
            'all_time': {
                'orders':    paid.count(),
                'revenue':   str(paid.aggregate(r=Sum('total'))['r'] or Decimal('0')),
                'customers': Order.objects.values('user').distinct().count(),
            },
            'order_status_counts': list(Order.objects.values('status').annotate(count=Count('id'))),
            'top_products': list(
                OrderItem.objects.values('product_name')
                .annotate(total_qty=Sum('quantity'), total_revenue=Sum(F('price') * F('quantity')))
                .order_by('-total_qty')[:10]
            ),
            'recent_orders': list(
                Order.objects.order_by('-created_at')[:10]
                .values('order_number','user__name','user__email','total','status','payment_status','created_at')
            ),
            'top_searches': list(
                SearchQuery.objects.values('query').annotate(count=Count('id')).order_by('-count')[:10]
            ),
            'daily_chart': DailySalesSnapshotSerializer(daily_chart, many=True).data,
        })

class TrackProductViewView(APIView):
    """POST /api/analytics/product-view/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pid = request.data.get('product_id')
        if not pid:
            return Response({'detail': 'product_id required.'}, status=400)
        ProductView.objects.create(
            product_id=pid,
            user=request.user if request.user.is_authenticated else None,
            session_key=request.data.get('session_key', ''),
        )
        return Response({'tracked': True}, status=status.HTTP_201_CREATED)

class TrackSearchView(APIView):
    """POST /api/analytics/search/"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'detail': 'query required.'}, status=400)
        SearchQuery.objects.create(
            query=query,
            results_count=request.data.get('results_count', 0),
            user=request.user if request.user.is_authenticated else None,
        )
        return Response({'tracked': True}, status=status.HTTP_201_CREATED)