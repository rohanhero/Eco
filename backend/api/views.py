# api/views.py

from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
import random
from datetime import timedelta

from .models import CustomUser, Report, PasswordResetOTP
from .serializers import UserSerializer, ReportSerializer


# -------------------------------
# Signup View
# -------------------------------
class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


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


# -------------------------------
# Public Report List
# -------------------------------
class ReportListAPIView(generics.ListAPIView):
    queryset = Report.objects.all().order_by("-created_at")
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]


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


# -------------------------------
# SEND RESET OTP
# -------------------------------
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

    otp = random.randint(100000, 999999)

    # Save OTP in PasswordResetOTP model (IMPORTANT)
    PasswordResetOTP.objects.update_or_create(
        user=user,
        defaults={
            "otp": str(otp),
            "expires_at": timezone.now() + timezone.timedelta(minutes=10)
        }
    )

    # Send email
    send_mail(
        "EcoGuard Password Reset OTP",
        f"Your password reset OTP is: {otp}",
        "no-reply@ecoguard.com",
        [email],
        fail_silently=False,
    )

    return Response({"message": "OTP sent to your email"})


# -------------------------------
# RESET PASSWORD
# -------------------------------
@api_view(['POST'])
@csrf_exempt
def reset_password(request):
    print("REQ BODY:", request.data)

    email = request.data.get("email")
    otp = request.data.get("otp", "").strip()   # strip spaces
    new_password = request.data.get("new_password")

    print("EMAIL:", email)
    print("OTP SENT BY FRONTEND:", otp)

    if not email or not otp or not new_password:
        return Response({"error": "Missing fields"}, status=400)

    # Check user
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Check OTP
    try:
        otp_record = PasswordResetOTP.objects.get(user=user)
        print("OTP IN DATABASE:", otp_record.otp)
        print("EXPIRES AT:", otp_record.expires_at)
    except PasswordResetOTP.DoesNotExist:
        print("NO OTP RECORD FOUND")
        return Response({"error": "OTP not found"}, status=400)

    # Validate OTP
    if otp != otp_record.otp:
        return Response({"error": "Invalid OTP"}, status=400)

    # Check expiration
    if timezone.now() > otp_record.expires_at:
        return Response({"error": "OTP expired"}, status=400)

    # Update password
    user.set_password(new_password)
    user.save()

    # Delete OTP so it can't be reused
    otp_record.delete()

    print("PASSWORD RESET SUCCESSFUL")

    return Response({"message": "Password reset successful"}, status=200)


# -------------------------------
# CHANGE PASSWORD (for logged-in user)
# -------------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    new_password = request.data.get("new_password")

    if not new_password:
        return Response({"detail": "New password is required."}, status=400)

    # Optional: match frontend validation
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


# delete account


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({"detail": "Account deleted"}, status=status.HTTP_204_NO_CONTENT)


#report k po ho re
# example in DRF view
class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
