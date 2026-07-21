"""apps/orders/urls.py"""
from django.urls import path
from .views import OrderListView, OrderDetailView, PlaceOrderView, CancelOrderView

urlpatterns = [
    path('',                           OrderListView.as_view(),   name='orders'),
    path('create/',                    PlaceOrderView.as_view(),  name='order_create'),
    path('<str:order_number>/',        OrderDetailView.as_view(), name='order_detail'),
    path('<str:order_number>/cancel/', CancelOrderView.as_view(), name='order_cancel'),
]