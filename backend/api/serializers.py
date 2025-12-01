from .models import Report, Comment, CustomUser
from django.db.models import Avg
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
    class Meta:
        model = Report
        fields = "__all__"
        # user and email cannot change, but name can
        read_only_fields = ["user", "email"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        validated_data["email"] = user.email  # always tie email to user
        return super().create(validated_data)

    # lau lau


class ReportSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    # Dynamically fetch name/email from related user
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'category', 'severity', 'title', 'description',
            'name', 'email', 'location_lat', 'location_lng',
            'location_address', 'image', 'image_url', 'created_at', 'resolved',
            'view_count'
        ]
        read_only_fields = ['id', 'created_at',
                            'image_url', 'view_count', 'name', 'email']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


# try
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = "__all__"
        # prevent frontend from overwriting
        read_only_fields = ["name", "email", "user"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        validated_data["name"] = user.name
        validated_data["email"] = user.email
        return super().create(validated_data)


# cmt
# api/serializers.py (CommentSerializer)

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    report = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "report", "user", "user_name",
                  "user_email", "text", "rating", "created_at"]
        read_only_fields = ["id", "user", "user_name",
                            "user_email", "created_at", "report"]

    def get_user_name(self, obj):
        return obj.user.name if obj.user else "Anonymous"

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value

    def create(self, validated_data):
        # user and report will be injected by view.perform_create
        return super().create(validated_data)


# Add average_rating to ReportSerializer
class ReportSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    average_rating = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'category', 'severity', 'title', 'description',
            'name', 'email', 'location_lat', 'location_lng',
            'location_address', 'image', 'image_url', 'created_at', 'resolved',
            'view_count', 'average_rating', 'comments_count'
        ]
        read_only_fields = ['id', 'created_at', 'image_url', 'view_count',
                            'name', 'email', 'average_rating', 'comments_count']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_average_rating(self, obj):
        agg = obj.comments.aggregate(avg=Avg('rating'))
        avg = agg.get('avg')
        if avg is None:
            return None
        return round(avg, 2)

    def get_comments_count(self, obj):
        return obj.comments.count()



#xya
from rest_framework import serializers
from .models import Report
from django.db.models import Avg

class ReportSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)   # Stored in DB
    email = serializers.EmailField(read_only=True) # Stored in DB
    average_rating = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            'id', 'category', 'severity', 'title', 'description',
            'name', 'email', 'location_lat', 'location_lng',
            'location_address', 'image', 'image_url', 'created_at', 'resolved',
            'view_count', 'average_rating', 'comments_count'
        ]
        read_only_fields = ['id', 'created_at', 'image_url', 'view_count',
                            'name', 'email', 'average_rating', 'comments_count']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_average_rating(self, obj):
        agg = obj.comments.aggregate(avg=Avg('rating'))
        avg = agg.get('avg')
        if avg is None:
            return None
        return round(avg, 2)

    def get_comments_count(self, obj):
        return obj.comments.count()
