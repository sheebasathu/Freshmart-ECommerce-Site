"""apps/products/pagination.py"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class NineItemPagination(PageNumberPagination):
    """
    3 × 3 grid on the listing page → 9 products per page.
    Exposes `total_pages` and `current_page` directly so the React
    Pagination component doesn't need to compute them from count / page_size.
    """
    page_size             = 9
    page_size_query_param = 'page_size'
    max_page_size         = 72

    def get_paginated_response(self, data):
        return Response({
            'count':        self.page.paginator.count,
            'total_pages':  self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next':         self.get_next_link(),
            'previous':     self.get_previous_link(),
            'results':      data,
        })