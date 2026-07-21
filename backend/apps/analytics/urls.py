from django.urls import path
from .views import SalesDashboardView, TrackProductViewView, TrackSearchView
urlpatterns = [
    path('dashboard/',     SalesDashboardView.as_view(),    name='analytics_dashboard'),
    path('product-view/',  TrackProductViewView.as_view(),  name='track_product_view'),
    path('search/',        TrackSearchView.as_view(),       name='track_search'),
]