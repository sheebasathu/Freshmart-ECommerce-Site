"""apps/orders/views.py"""
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer, PlaceOrderSerializer
from apps.cart.models import Cart
from apps.coupons.models import Coupon


class OrderListView(generics.ListAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'history')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class   = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field       = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items', 'history')


class PlaceOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = PlaceOrderSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        data = s.validated_data

        try:
            cart = Cart.objects.prefetch_related('items__variant__product__images').get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'detail': 'Cart is empty.'}, status=400)

        if not cart.items.exists():
            return Response({'detail': 'Cart is empty.'}, status=400)

        # Apply coupon
        discount    = Decimal('0')
        coupon_code = data.get('coupon_code', '')
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code, is_active=True)
                if coupon.is_valid(cart.subtotal):
                    discount = coupon.get_discount(cart.subtotal)
                    coupon.used_count += 1
                    coupon.save()
            except Coupon.DoesNotExist:
                pass

        subtotal = cart.subtotal
        delivery = Decimal('0') if subtotal >= Decimal('499') else Decimal('40')
        tax      = round(subtotal * Decimal('0.05'), 2)
        total    = subtotal + delivery + tax - discount

        order = Order.objects.create(
            user=request.user,
            status='confirmed',
            payment_status='paid' if data['payment_method'] != 'cod' else 'pending',
            payment_method=data['payment_method'],
            subtotal=subtotal, delivery_charge=delivery, tax=tax,
            discount=discount, total=total,
            shipping_address={
                'name':    data['name'],    'email':   data['email'],
                'phone':   data['phone'],   'address': data['address'],
                'city':    data['city'],    'state':   data['state'],
                'zip':     data['zip'],
            },
            coupon_code=coupon_code,
            razorpay_order_id=data.get('razorpay_order_id', ''),
            razorpay_payment_id=data.get('razorpay_payment_id', ''),
            estimated_delivery=timezone.now() + timedelta(minutes=10),
        )

        for item in cart.items.select_related('variant__product'):
            img     = item.variant.product.primary_image
            img_url = request.build_absolute_uri(img.image.url) if (img and img.image) else ''
            OrderItem.objects.create(
                order=order,
                variant=item.variant,
                product_name=item.variant.product.name,
                brand=item.variant.product.brand,
                weight=item.variant.weight,
                price=item.variant.price,
                quantity=item.quantity,
                image_url=img_url,
            )
            item.variant.stock = max(0, item.variant.stock - item.quantity)
            item.variant.save(update_fields=['stock'])

        OrderStatusHistory.objects.create(order=order, status='confirmed',
                                           note='Order placed by customer.',
                                           created_by=request.user)
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        if order.status in ('delivered', 'cancelled'):
            return Response({'detail': f'Cannot cancel a {order.status} order.'}, status=400)
        order.status = 'cancelled'
        order.save()
        OrderStatusHistory.objects.create(order=order, status='cancelled',
                                           note='Cancelled by customer.', created_by=request.user)
        return Response(OrderSerializer(order).data)
