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
        # populate first_name/last_name to satisfy possible DB columns
        name = validated_data.get("name", "")
        first_name = name.split()[0] if name else ""
        last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else ""

        user = User(
            name=validated_data["name"],
            email=validated_data["email"],
        )
        # set optional fields if model supports them
        if hasattr(user, "first_name"):
            user.first_name = first_name
        if hasattr(user, "last_name"):
            user.last_name = last_name

        user.set_password(validated_data["password"])
        user.save()
        return user

# ------------------------
# Report Serializer
class ReportSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'category', 'severity', 'title', 'description',
            'name', 'email', 'location_lat', 'location_lng',
            'location_address', 'image', 'image_url', 'created_at', 'resolved',
            'view_count'
        ]
        read_only_fields = ['id', 'created_at', 'image_url', 'view_count']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None