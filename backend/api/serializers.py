from .models import Report, Comment, CustomUser, TaxPayment
from django.db.models import Avg
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# ------------------------
# User Serializer
# ------------------------


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "email", "password", "image", "image_url"]

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def create(self, validated_data):
        name = validated_data.get("name", "")
        first_name = name.split()[0] if name else ""
        last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else ""

        user = User(
            name=validated_data["name"],
            email=validated_data["email"],
        )
        if hasattr(user, "first_name"):
            user.first_name = first_name
        if hasattr(user, "last_name"):
            user.last_name = last_name

        user.set_password(validated_data["password"])
        user.save()
        return user

# ------------------------
# Report Serializer
# ------------------------


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

# ------------------------
# Comment Serializer
# ------------------------


class CommentSerializer(serializers.ModelSerializer):
    report = serializers.PrimaryKeyRelatedField(read_only=True)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()   # <-- ADD THIS

    class Meta:
        model = Comment
        fields = [
            "id", "report", "user", "user_name",
            "user_email", "text", "rating",
            "created_at", "is_owner"
        ]
        read_only_fields = [
            "id", "user", "user_name",
            "user_email", "created_at",
            "report", "is_owner"
        ]

    def get_user_name(self, obj):
        return obj.user.name if obj.user else "Anonymous"

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if not request or request.user.is_anonymous:
            return False
        return obj.user == request.user


class TaxPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxPayment
        fields = [
            "id",
            "pid",
            "amount",
            "tax_period",
            "description",
            "status",
            "esewa_ref",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "pid",
            "status",
            "esewa_ref",
            "created_at",
            "updated_at",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, min_length=8)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "password",
            "image",
            "image_url",
            "is_staff",
            "is_active",
            "is_superuser",
        ]
        read_only_fields = ["id", "image_url"]

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AdminReportSerializer(ReportSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta(ReportSerializer.Meta):
        fields = ReportSerializer.Meta.fields + \
            ["user_id", "user_email", "user_name"]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        if not user:
            raise serializers.ValidationError(
                "Authenticated admin user required to create reports.")
        return Report.objects.create(
            user=user,
            name=user.name,
            email=user.email,
            **validated_data,
        )


class AdminCommentSerializer(serializers.ModelSerializer):
    report = serializers.PrimaryKeyRelatedField(queryset=Report.objects.all())
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    report_title = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "report",
            "report_title",
            "user",
            "user_name",
            "user_email",
            "text",
            "rating",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "report_title",
            "user",
            "user_name",
            "user_email",
            "created_at",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        if not user:
            raise serializers.ValidationError(
                "Authenticated admin user required to create comments.")
        report = validated_data.pop("report")
        return Comment.objects.create(report=report, user=user, **validated_data)

    def get_user_name(self, obj):
        return obj.user.name if obj.user else "Anonymous"

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_report_title(self, obj):
        return obj.report.title if obj.report else None


class AdminTaxPaymentSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = TaxPayment
        fields = [
            "id",
            "pid",
            "user",
            "user_name",
            "user_email",
            "amount",
            "tax_period",
            "description",
            "status",
            "esewa_ref",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "pid",
            "esewa_ref",
            "created_at",
            "updated_at",
        ]
