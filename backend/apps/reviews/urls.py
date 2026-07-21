from django.urls import path
from .views import ProductReviewsView, ReviewLikeView
urlpatterns = [
    path('product/<int:product_id>/', ProductReviewsView.as_view(), name='product_reviews'),
    path('<int:review_id>/like/',     ReviewLikeView.as_view(),     name='review_like'),
]