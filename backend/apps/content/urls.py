from django.urls import path
from .views import (
    HomepageContentView,
    NavCategoryListView,
    NavMenuListView,
    FruitsVegetableCardListView,
    DailyDealCardListView,
)
urlpatterns = [
    path('homepage/', HomepageContentView.as_view(), name='homepage_content'),
    path('nav-categories/', NavCategoryListView.as_view(), name='nav_categories'),
    path('nav-menus/', NavMenuListView.as_view(), name='nav_menus'),
    path('fruits-vegetables/', FruitsVegetableCardListView.as_view(), name='fruits_vegetables'),
    path('daily-deals/',       DailyDealCardListView.as_view(), name='daily_deals'),
    ]