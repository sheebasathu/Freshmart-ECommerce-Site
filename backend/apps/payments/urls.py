from django.urls import path
from .views import CreateRazorpayOrderView, VerifyPaymentView
urlpatterns = [
    path('razorpay/create/', CreateRazorpayOrderView.as_view(), name='razorpay_create'),
    path('razorpay/verify/', VerifyPaymentView.as_view(),       name='razorpay_verify'),
]