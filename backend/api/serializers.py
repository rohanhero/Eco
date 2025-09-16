from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Report
# api/serializers.py
from .models import CustomUser

User = get_user_model()

# ------------------------
# User Serializer
# ------------------------
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "name", "email", "password"]

    def create(self, validated_data):
        user = User(
            name=validated_data["name"],
            email=validated_data["email"]
        )
        user.set_password(validated_data["password"])
        user.save()
        return user

# ------------------------
# Report Serializer
class ReportSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = ['id', 'title', 'description', 'location_lat', 'location_lng',
                  'location_address', 'image', 'image_url', 'created_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None