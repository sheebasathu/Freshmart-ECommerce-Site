"""apps/payments/views.py"""
import hmac, hashlib
from django.utils import timezone
import razorpay
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.orders.models import Order
from .models import Payment
from .serializers import CreateRazorpayOrderSerializer, VerifyPaymentSerializer


class CreateRazorpayOrderView(APIView):
    """POST /api/payments/razorpay/create/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = CreateRazorpayOrderSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        amount = s.validated_data['amount']
        try:
            client   = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            rz_order = client.order.create({
                'amount':          int(float(amount) * 100),
                'currency':        'INR',
                'payment_capture': 1,
            })
            return Response({
                'razorpay_order_id': rz_order['id'],
                'amount':            rz_order['amount'],
                'currency':          rz_order['currency'],
                'key_id':            settings.RAZORPAY_KEY_ID,
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=500)


class VerifyPaymentView(APIView):
    """POST /api/payments/razorpay/verify/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        s = VerifyPaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        # Verify Razorpay signature
        msg      = f"{d['razorpay_order_id']}|{d['razorpay_payment_id']}".encode()
        secret   = settings.RAZORPAY_KEY_SECRET.encode()
        expected = hmac.new(secret, msg, hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, d['razorpay_signature']):
            return Response({'detail': 'Payment verification failed — invalid signature.'}, status=400)

        try:
            order = Order.objects.get(order_number=d['order_number'], user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=404)

        # Update order
        order.payment_status      = 'paid'
        order.razorpay_payment_id = d['razorpay_payment_id']
        order.save(update_fields=['payment_status', 'razorpay_payment_id'])

        # Create / update Payment record
        Payment.objects.update_or_create(
            order=order,
            defaults={
                'user':                 request.user,
                'method':               order.payment_method,
                'status':               'paid',
                'amount':               order.total,
                'razorpay_order_id':    d['razorpay_order_id'],
                'razorpay_payment_id':  d['razorpay_payment_id'],
                'razorpay_signature':   d['razorpay_signature'],
                'completed_at':         timezone.now(),
            }
        )

        return Response({'detail': 'Payment verified.', 'order_number': order.order_number})