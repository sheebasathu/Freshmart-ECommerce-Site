from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import WishlistItem
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
class WishlistView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def get(self, request):
        items=[i.product for i in WishlistItem.objects.filter(user=request.user).select_related('product')]
        return Response(ProductListSerializer(items, many=True, context={'request':request}).data)
    def post(self, request):
        pid=request.data.get('product_id')
        try: product=Product.objects.get(pk=pid)
        except Product.DoesNotExist: return Response({'detail':'Not found.'},status=404)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        if not created:
            item.delete()
            return Response({'wishlisted':False,'product_id':pid})
        return Response({'wishlisted':True,'product_id':pid},status=201)
