from rest_framework import serializers
from .models import Review
class ReviewSerializer(serializers.ModelSerializer):
    user_name   = serializers.CharField(source='user.name',  read_only=True)
    user_avatar = serializers.SerializerMethodField()
    class Meta:
        model=Review
        fields=['id','user_name','user_avatar','rating','title','body','likes','created_at']
        read_only_fields=['likes','created_at']
    def get_user_avatar(self, obj):
        req = self.context.get('request')
        if obj.user.avatar and req: return req.build_absolute_uri(obj.user.avatar.url)
        return f'https://i.pravatar.cc/80?u={obj.user.id}'
    def validate(self, data):
        req=self.context.get('request'); product=self.context.get('product')
        if req and product and not self.instance:
            if Review.objects.filter(product=product, user=req.user).exists():
                raise serializers.ValidationError('You already reviewed this product.')
        return data