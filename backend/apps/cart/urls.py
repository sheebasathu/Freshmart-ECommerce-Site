"""apps/cart/urls.py"""
from django.urls import path
from .views import CartView, CartAddView, CartItemView

urlpatterns = [
    path('',                 CartView.as_view(),     name='cart'),
    path('add/',             CartAddView.as_view(),  name='cart_add'),
    path('items/<int:pk>/',  CartItemView.as_view(), name='cart_item'),
]