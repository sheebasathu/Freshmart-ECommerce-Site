from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Review
from .serializers import ReviewSerializer
class ProductReviewsView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    def get_permissions(self):
        return [permissions.IsAuthenticated()] if self.request.method=='POST' else [permissions.AllowAny()]
    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs['product_id'],is_approved=True).select_related('user')
    def get_serializer_context(self):
        ctx=super().get_serializer_context()
        from apps.products.models import Product
        ctx['product']=Product.objects.filter(pk=self.kwargs['product_id']).first()
        return ctx
    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs['product_id'])
class ReviewLikeView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def post(self, request, review_id):
        try:
            r=Review.objects.get(pk=review_id); r.likes+=1; r.save(update_fields=['likes'])
            return Response({'likes':r.likes})
        except Review.DoesNotExist:
            return Response({'detail':'Not found.'},status=404)
