from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Coupon
from apps.cart.models import Cart

class ValidateCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        code = request.data.get('code','').strip()
        if not code: return Response({'detail':'Code required.'},status=400)
        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response({'valid':False,'detail':'Invalid coupon code.'})
        try:
            cart = Cart.objects.get(user=request.user)
            subtotal = cart.subtotal
        except Cart.DoesNotExist:
            subtotal = 0
        if not coupon.is_valid(subtotal):
            return Response({'valid':False,'detail':'Coupon not applicable.'})
        discount = coupon.get_discount(subtotal)
        return Response({'valid':True,'code':coupon.code,'description':coupon.description,
                         'discount_type':coupon.discount_type,'discount_value':str(coupon.discount_value),
                         'discount_amount':str(discount)})
