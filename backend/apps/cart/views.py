"""apps/cart/views.py"""
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer
from apps.products.models import ProductVariant

def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'detail': 'Cart cleared.'}, status=status.HTTP_204_NO_CONTENT)

class CartAddView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = AddToCartSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        variant  = ProductVariant.objects.get(id=s.validated_data['variant_id'])
        qty      = s.validated_data['quantity']
        cart     = get_or_create_cart(request.user)
        item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        item.quantity = item.quantity + qty if not created else qty
        item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _item(self, request, pk):
        try:
            return CartItem.objects.get(pk=pk, cart__user=request.user)
        except CartItem.DoesNotExist:
            return None

    def patch(self, request, pk):
        item = self._item(request, pk)
        if not item:
            return Response({'detail': 'Not found.'}, status=404)
        s = UpdateCartItemSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        qty = s.validated_data['quantity']
        if qty == 0:
            item.delete()
        else:
            item.quantity = qty
            item.save()
        return Response(CartSerializer(get_or_create_cart(request.user), context={'request': request}).data)

    def delete(self, request, pk):
        item = self._item(request, pk)
        if not item:
            return Response({'detail': 'Not found.'}, status=404)
        item.delete()
        return Response(CartSerializer(get_or_create_cart(request.user), context={'request': request}).data)