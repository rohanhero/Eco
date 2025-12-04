# api/views.py

from .models import PasswordResetOTP
from rest_framework.decorators import api_view
from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
import random
import os

from .models import CustomUser, Report, PasswordResetOTP, Comment
from .serializers import UserSerializer, ReportSerializer, CommentSerializer

# -------------------------------
# Signup View
# -------------------------------


class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("SIGNUP ERROR:", serializer.errors)
        return super().create(request, *args, **kwargs)

# -------------------------------
# Report List & Create
# -------------------------------


class ReportListCreateView(generics.ListCreateAPIView):
    parser_classes = (MultiPartParser, FormParser)
    queryset = Report.objects.all().order_by("-created_at")
    serializer_class = ReportSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        location_lat = self.request.data.get('location_lat')
        location_lng = self.request.data.get('location_lng')
        location_address = self.request.data.get('location_address', '')

        try:
            location_lat = float(location_lat) if location_lat else None
            location_lng = float(location_lng) if location_lng else None
        except ValueError:
            location_lat = None
            location_lng = None

        serializer.save(
            user=self.request.user,
            name=self.request.user.name,
            email=self.request.user.email,
            location_lat=location_lat,
            location_lng=location_lng,
            location_address=location_address
        )

# -------------------------------
# Report Retrieve
# -------------------------------


class ReportRetrieveView(generics.RetrieveAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

# -------------------------------
# Increment Views Count
# -------------------------------


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def increment_report_views(request, pk):
    try:
        report = Report.objects.get(pk=pk)
        report.view_count += 1
        report.save()
        return Response({'view_count': report.view_count})
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)

# -------------------------------
# User Profile
# -------------------------------


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
        })

    elif request.method == 'PATCH':
        name = request.data.get('name', user.name)
        email = request.data.get('email', user.email)

        if not name.strip():
            return Response({'name': ['Name cannot be empty']}, status=400)

        user.name = name.strip()

        if email != user.email:
            if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({'email': ['Email already in use']}, status=400)
            user.email = email

        user.save()
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
        })


@api_view(["POST"])
def send_reset_otp(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=400)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "No account with this email"}, status=404)

    # Generate a 6-digit OTP
    otp = random.randint(100000, 999999)

    # Save OTP with 10 min expiry
    PasswordResetOTP.objects.update_or_create(
        user=user,
        defaults={
            "otp": str(otp),
            "expires_at": timezone.now() + timezone.timedelta(minutes=10)
        }
    )

    try:
        # Compose the email
        email_message = EmailMessage(
            subject="EcoGuard Password Reset OTP",
            body=f"Your password reset OTP is: {otp}",
            # Professional sender
            from_email=f"no-reply<{settings.EMAIL_HOST_USER}>",
            to=[email],
            # Replies go to no-reply
            headers={'Reply-To': 'no-reply@ecoguard.com'}
        )

        # Send the email
        email_message.send(fail_silently=False)

    except Exception as e:
        # Catch any email sending errors
        return Response({"error": f"Failed to send OTP: {str(e)}"}, status=500)

    return Response({"message": "OTP sent to your email"})


# -------------------------------
# RESET PASSWORD
# -------------------------------


@api_view(['POST'])
@csrf_exempt
def reset_password(request):
    email = request.data.get("email")
    otp = request.data.get("otp", "").strip()
    new_password = request.data.get("new_password")

    if not email or not otp or not new_password:
        return Response({"error": "Missing fields"}, status=400)

    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    try:
        otp_record = PasswordResetOTP.objects.get(user=user)
    except PasswordResetOTP.DoesNotExist:
        return Response({"error": "OTP not found"}, status=400)

    if otp != otp_record.otp:
        return Response({"error": "Invalid OTP"}, status=400)

    if timezone.now() > otp_record.expires_at:
        return Response({"error": "OTP expired"}, status=400)

    user.set_password(new_password)
    user.save()
    otp_record.delete()

    return Response({"message": "Password reset successful"}, status=200)

# -------------------------------
# CHANGE PASSWORD
# -------------------------------


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    new_password = request.data.get("new_password")

    if not new_password:
        return Response({"detail": "New password is required."}, status=400)

    import re
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
    if not re.match(password_regex, new_password):
        return Response(
            {"detail": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."},
            status=400
        )

    user.set_password(new_password)
    user.save()

    return Response({"detail": "Password changed successfully."}, status=200)

# -------------------------------
# DELETE ACCOUNT
# -------------------------------


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({"detail": "Account deleted"}, status=status.HTTP_204_NO_CONTENT)

# -------------------------------
# Report Delete (User can delete only their own posts)
# -------------------------------


class ReportDeleteView(generics.DestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        report = self.get_object()
        if report.user != request.user:
            return Response(
                {"detail": "You are not allowed to delete this report."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().delete(request, *args, **kwargs)

# -------------------------------
# Comments for a report: GET (list) and POST (create)
# -------------------------------


class ReportCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        report_pk = self.kwargs.get("pk")
        return Comment.objects.filter(report_id=report_pk).order_by("created_at")

    # <-- This is the fix to make is_owner work
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        report_pk = self.kwargs.get("pk")
        report = get_object_or_404(Report, pk=report_pk)
        serializer.save(report=report, user=self.request.user)

        # ✅ Add this to ensure request is passed to serializer
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

# -------------------------------
# My Reports (for logged-in user)
# -------------------------------


class MyReportsListView(generics.ListAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user).order_by('-created_at')

# -------------------------------
# Comment Detail (Retrieve, Update, Delete)
# -------------------------------


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if serializer.instance.user != self.request.user:
            raise PermissionDenied("You can edit only your own comment.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("You can delete only your own comment.")
        instance.delete()
