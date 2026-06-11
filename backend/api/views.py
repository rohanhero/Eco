# api/views.py

from .models import SignupOTP
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
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import random
import os
import urllib.parse
import urllib.request
import base64
import hashlib
import hmac
import json
import requests
import uuid
from decimal import Decimal, InvalidOperation

from .models import CustomUser, Report, PasswordResetOTP, Comment, TaxPayment
from .serializers import (
    UserSerializer,
    ReportSerializer,
    CommentSerializer,
    TaxPaymentSerializer,
    AdminUserSerializer,
    AdminReportSerializer,
    AdminCommentSerializer,
    AdminTaxPaymentSerializer,
)
from .utils.duplicate_detector import check_report_duplicates


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "name": self.user.name,
            "is_staff": self.user.is_staff,
            "is_superuser": self.user.is_superuser,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_whoami(request):
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_stats(request):
    return Response({
        'users': CustomUser.objects.count(),
        'reports': Report.objects.count(),
        'resolved_reports': Report.objects.filter(resolved=True).count(),
        'pending_reports': Report.objects.filter(resolved=False).count(),
        'comments': Comment.objects.count(),
        'tax_payments': TaxPayment.objects.count(),
        'pending_payments': TaxPayment.objects.filter(status='pending').count(),
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_mark_all_payments_success(request):
    updated = TaxPayment.objects.filter(
        status='pending').update(status='success')
    return Response({
        'updated': updated,
        'message': f'{updated} pending payment(s) marked as success.',
    })


class AdminUserListCreateView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all().order_by('-id')
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminReportListView(generics.ListCreateAPIView):
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = AdminReportSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Report.objects.all()
    serializer_class = AdminReportSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminCommentListView(generics.ListCreateAPIView):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = AdminCommentSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = AdminCommentSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminTaxPaymentListView(generics.ListAPIView):
    queryset = TaxPayment.objects.all().order_by('-created_at')
    serializer_class = AdminTaxPaymentSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminTaxPaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TaxPayment.objects.all()
    serializer_class = AdminTaxPaymentSerializer
    permission_classes = [permissions.IsAdminUser]


# -------------------------------
# Signup View
# -------------------------------


class SignupView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data.get("email")
        User = get_user_model()
        try:
            existing = User.objects.get(email=email)
            # If a placeholder user exists (no usable password), complete signup
            if not existing.has_usable_password():
                existing.name = serializer.validated_data.get(
                    "name", existing.name)
                existing.set_password(
                    serializer.validated_data.get("password"))
                existing.save()
                out_serializer = self.get_serializer(existing)
                return Response(out_serializer.data, status=status.HTTP_200_OK)
            return Response({"detail": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Check if perform_create returns a Response (for duplicate handling)
        result = self.perform_create(serializer)
        if isinstance(result, Response):
            return result

        headers = self.get_success_headers(serializer.data)

        # Get potential duplicates from serializer context
        potential_duplicates = getattr(
            serializer, 'context', {}).get('potential_duplicates', [])

        # Prepare duplicate data for response
        duplicate_data = []
        if potential_duplicates:
            for dup in potential_duplicates:
                duplicate_data.append({
                    'id': dup['report'].id,
                    'title': dup['report'].title,
                    'similarity_score': round(dup['similarity_score'], 2),
                    'location_distance_km': dup.get('location_distance_km'),
                    'created_at': dup['report'].created_at,
                    'category': dup['report'].category,
                    'severity': dup['report'].severity
                })

        response_data = serializer.data
        response_data['potential_duplicates'] = duplicate_data

        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

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

        # Check if this is a forced submission (user confirmed duplicates)
        force_submit = self.request.data.get('force_submit') == 'true'

        if not force_submit:
            # Check for duplicate reports before saving
            report_data = {
                'title': self.request.data.get('title', ''),
                'description': self.request.data.get('description', ''),
                'category': self.request.data.get('category', ''),
                'location_lat': location_lat,
                'location_lng': location_lng,
                'user_id': self.request.user.id
            }

            # Handle image for duplicate checking
            temp_image_path = None
            if 'image' in self.request.FILES:
                # Save image temporarily for duplicate checking
                image_file = self.request.FILES['image']
                import tempfile
                import os

                # Create temporary file
                temp_fd, temp_image_path = tempfile.mkstemp(
                    suffix=os.path.splitext(image_file.name)[1])
                try:
                    with os.fdopen(temp_fd, 'wb') as tmp:
                        for chunk in image_file.chunks():
                            tmp.write(chunk)
                    report_data['image_path'] = temp_image_path
                except Exception as e:
                    print(f"Error saving temp image: {e}")
                    if temp_image_path and os.path.exists(temp_image_path):
                        os.unlink(temp_image_path)
                    temp_image_path = None

            try:
                duplicates = check_report_duplicates(report_data)

                # If duplicates found, don't save the report yet - return duplicates for frontend confirmation
                if duplicates:
                    # Clean up temp image
                    if temp_image_path and os.path.exists(temp_image_path):
                        os.unlink(temp_image_path)

                    # Return duplicates without saving
                    duplicate_data = []
                    for dup in duplicates:
                        duplicate_data.append({
                            'id': dup['report'].id,
                            'title': dup['report'].title,
                            'description': dup['report'].description,
                            'category': dup['report'].category,
                            'severity': dup['report'].severity,
                            'similarity_score': dup['similarity_score'],
                            'text_similarity': dup['text_similarity'],
                            'image_similarity': dup['image_similarity'],
                            'location_distance_km': dup['location_distance_km'],
                            'created_at': dup['report'].created_at,
                            'user': dup['report'].user.name
                        })

                    # Return error response with duplicates
                    return Response({
                        'error': 'Potential duplicates found',
                        'potential_duplicates': duplicate_data,
                        'message': 'Please review similar reports before submitting.'
                    }, status=status.HTTP_409_CONFLICT)

            finally:
                # Clean up temp image
                if temp_image_path and os.path.exists(temp_image_path):
                    os.unlink(temp_image_path)

        # No duplicates found or force submit is true, proceed with saving
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
            'image_url': user.image.url if user.image else None,
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

        # Handle image upload
        if 'image' in request.FILES:
            user.image = request.FILES['image']

        user.save()
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'image_url': user.image.url if user.image else None,
        })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_tax_payment(request):
    amount = request.data.get("amount")
    tax_period = request.data.get("tax_period", "")
    description = request.data.get("description", "Online tax payment")

    if amount is None:
        return Response({"error": "Amount is required"}, status=400)

    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError):
        return Response({"error": "Invalid amount format"}, status=400)

    if amount <= 0:
        return Response({"error": "Amount must be greater than zero"}, status=400)

    payment = TaxPayment.objects.create(
        user=request.user,
        amount=amount,
        tax_period=tax_period,
        description=description,
    )

    return Response({
        "payment": TaxPaymentSerializer(payment).data,
        "esewa": {
            "action_url": settings.ESEWA_PAYMENT_URL,
            "pid": payment.pid,
            "amt": str(payment.amount),
            "tAmt": str(payment.amount),
            "txAmt": "0.00",
            "psc": "0.00",
            "pdc": "0.00",
            "scd": settings.ESEWA_MERCHANT_CODE,
            "su": settings.ESEWA_SUCCESS_URL,
            "fu": settings.ESEWA_FAILED_URL,
        },
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def verify_tax_payment(request):
    pid = request.data.get("pid")
    amt = request.data.get("amt")
    rid = request.data.get("refId") or request.data.get("rid")

    if not pid or not amt or not rid:
        return Response({"error": "pid, amt and refId are required"}, status=400)

    try:
        payment = TaxPayment.objects.get(pid=pid, user=request.user)
    except TaxPayment.DoesNotExist:
        return Response({"error": "Payment not found"}, status=404)

    try:
        amt_value = Decimal(str(amt))
    except (InvalidOperation, TypeError):
        return Response({"error": "Invalid amount format"}, status=400)

    if amt_value != payment.amount:
        return Response({"error": "Payment amount mismatch"}, status=400)

    body = ""
    try:
        verification_data = urllib.parse.urlencode({
            "amt": str(payment.amount),
            "pid": payment.pid,
            "rid": rid,
            "scd": settings.ESEWA_MERCHANT_CODE,
        }).encode()
        req = urllib.request.Request(
            settings.ESEWA_VERIFY_URL, data=verification_data, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode(errors="ignore")

        if "success" in body.lower():
            payment.status = "success"
            payment.esewa_ref = rid
            payment.save()
            return Response({"status": payment.status, "message": "Payment verified successfully."})

        payment.status = "failed"
        payment.esewa_ref = rid
        payment.save()
        return Response({"status": payment.status, "message": "eSewa verification failed.", "detail": body}, status=400)
    except Exception as exc:
        payment.status = "failed"
        payment.esewa_ref = rid
        payment.save()
        return Response({"error": "Verification request failed", "detail": str(exc), "body": body}, status=500)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_tax_payments(request):
    payments = TaxPayment.objects.filter(
        user=request.user).order_by("-created_at")
    serializer = TaxPaymentSerializer(payments, many=True)
    return Response(serializer.data)


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
# eSewa API Integration (OAuth2 + Inquiry/Payment/Status)
# -------------------------------

# Global variable to store access token (in production, use Redis/cache)
esewa_access_token = None
esewa_refresh_token = None
token_expires_at = None


def get_esewa_access_token():
    """Get valid eSewa access token, refreshing if needed"""
    global esewa_access_token, esewa_refresh_token, token_expires_at

    from django.utils import timezone
    now = timezone.now()

    # Check if we have a valid token
    if esewa_access_token and token_expires_at and now < token_expires_at:
        return esewa_access_token

    # Try to refresh token if we have refresh token
    if esewa_refresh_token:
        try:
            refresh_data = {
                "grant_type": "refresh_token",
                "refresh_token": esewa_refresh_token,
                "client_secret": base64.b64encode(settings.ESEWA_CLIENT_SECRET.encode()).decode()
            }

            response = requests.post(
                settings.ESEWA_AUTH_URL, json=refresh_data, timeout=30)
            if response.status_code == 200:
                token_data = response.json()
                esewa_access_token = token_data['access_token']
                esewa_refresh_token = token_data.get(
                    'refresh_token', esewa_refresh_token)
                token_expires_at = now + \
                    timezone.timedelta(
                        seconds=token_data['expires_in'] - 60)  # 1 min buffer
                return esewa_access_token
        except:
            pass

    # Get new token with client credentials
    try:
        auth_data = {
            "grant_type": "client_credentials",
            "client_secret": base64.b64encode(settings.ESEWA_CLIENT_SECRET.encode()).decode()
        }

        headers = {
            "Authorization": f"Basic {base64.b64encode(f'{settings.ESEWA_CLIENT_ID}:{settings.ESEWA_CLIENT_SECRET}'.encode()).decode()}",
            "Content-Type": "application/json"
        }

        response = requests.post(
            settings.ESEWA_AUTH_URL, json=auth_data, headers=headers, timeout=30)
        response.raise_for_status()

        token_data = response.json()
        esewa_access_token = token_data['access_token']
        esewa_refresh_token = token_data.get('refresh_token')
        token_expires_at = now + \
            timezone.timedelta(
                seconds=token_data['expires_in'] - 60)  # 1 min buffer

        return esewa_access_token
    except Exception as e:
        print(f"eSewa authentication failed: {e}")
        return None


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_tax_payment_api(request):
    """Create tax payment and return payment URL for eSewa API integration"""
    amount = request.data.get("amount")
    tax_period = request.data.get("tax_period", "")
    description = request.data.get("description", "Online tax payment")
    package_id = request.data.get("package_id")

    if amount is None:
        return Response({"error": "Amount is required"}, status=400)

    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError):
        return Response({"error": "Invalid amount format"}, status=400)

    if amount <= 0:
        return Response({"error": "Amount must be greater than zero"}, status=400)

    # Generate unique request ID
    request_id = str(uuid.uuid4())

    payment = TaxPayment.objects.create(
        user=request.user,
        amount=amount,
        tax_period=tax_period,
        description=description,
        pid=request_id,  # Use request_id as pid for API integration
        package_id=package_id,
    )

    # Return eSewa v2 form data for POST submission
    product_code = settings.ESEWA_PRODUCT_CODE
    total_amount = str(amount)
    transaction_uuid = request_id
    signed_field_names = "total_amount,transaction_uuid,product_code"
    signature_data = ",".join([
        f"total_amount={total_amount}",
        f"transaction_uuid={transaction_uuid}",
        f"product_code={product_code}"
    ])
    signature = base64.b64encode(
        hmac.new(
            settings.ESEWA_SECRET_KEY.encode("utf-8"),
            signature_data.encode("utf-8"),
            hashlib.sha256
        ).digest()
    ).decode("utf-8")

    esewa_form_data = {
        "action_url": settings.ESEWA_FORM_URL,
        "amount": total_amount,
        "tax_amount": "0",
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "product_code": product_code,
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "success_url": settings.ESEWA_SUCCESS_URL,
        "failure_url": settings.ESEWA_FAILED_URL,
        "signed_field_names": signed_field_names,
        "signature": signature,
    }

    return Response({
        "payment": TaxPaymentSerializer(payment).data,
        "esewa_form": esewa_form_data,
        "request_id": request_id
    })


@csrf_exempt
@require_http_methods(["GET"])
def esewa_inquiry(request, request_id=None):
    """eSewa Inquiry API - Called by eSewa to get payment details"""
    # Get request_id from URL path or query params
    if not request_id:
        request_id = request.GET.get('request_id')

    if not request_id:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Request ID is required"
        }, status=400)

    try:
        payment = TaxPayment.objects.get(pid=request_id)
    except TaxPayment.DoesNotExist:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Payment not found"
        }, status=404)

    # Check if payment is still pending
    if payment.status != "pending":
        return JsonResponse({
            "response_code": 1,
            "response_message": "Payment already processed"
        }, status=400)

    # Return payment details to eSewa
    response_data = {
        "request_id": request_id,
        "response_code": 0,
        "response_message": "success",
        "amount": float(payment.amount),
        "properties": {
            "customer_name": payment.user.name,
            "customer_email": payment.user.email,
            "tax_period": payment.tax_period,
            "description": payment.description,
            "customer_id": str(payment.user.id)
        }
    }

    # Add packages if this is a package-based payment
    if payment.package_id:
        response_data["packages"] = [
            {
                "display": f"Selected Package ID: {payment.package_id}",
                "value": float(payment.amount),
                "properties": {
                    "package_id": payment.package_id
                }
            }
        ]
    else:
        # Return available packages for selection
        response_data["packages"] = [
            {
                "display": "One Month Package. [ 1 Month at 499 ]",
                "value": 499,
                "properties": {
                    "package_id": 1
                }
            },
            {
                "display": "Three Months Package. [ 3 Months at 999 ]",
                "value": 999,
                "properties": {
                    "package_id": 2
                }
            },
            {
                "display": "1 Year Package. [ 1 Year at 2499 ]",
                "value": 2499,
                "properties": {
                    "package_id": 3
                }
            },
            {
                "display": "Special Package: Buy 2 Years, Get 1 Year Free. [ 3 Years at 4999 ]",
                "value": 4999,
                "properties": {
                    "package_id": 4
                }
            }
        ]

    return JsonResponse(response_data)


@csrf_exempt
@require_http_methods(["POST"])
def esewa_payment(request):
    """eSewa Payment API - Called by eSewa when payment is completed"""
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Invalid JSON data"
        }, status=400)

    request_id = data.get('request_id')
    amount = data.get('amount')
    transaction_code = data.get('transaction_code')
    package_id = data.get('package_id')  # Optional package selection

    if not request_id or not amount or not transaction_code:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Missing required fields: request_id, amount, transaction_code"
        }, status=400)

    try:
        payment = TaxPayment.objects.get(pid=request_id)
    except TaxPayment.DoesNotExist:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Payment not found"
        }, status=404)

    # Verify amount
    try:
        if float(amount) != float(payment.amount):
            return JsonResponse({
                "response_code": 1,
                "response_message": "Amount mismatch"
            }, status=400)
    except (ValueError, TypeError):
        return JsonResponse({
            "response_code": 1,
            "response_message": "Invalid amount format"
        }, status=400)

    # Update payment status
    payment.status = "success"
    payment.esewa_ref = transaction_code
    payment.save()

    # Generate reference code for reconciliation
    reference_code = f"REF_{payment.id}_{transaction_code[:8]}"

    return JsonResponse({
        "request_id": request_id,
        "response_code": 0,
        "response_message": "Payment successful",
        "amount": float(payment.amount),
        "reference_code": reference_code
    })


@csrf_exempt
@require_http_methods(["POST"])
def esewa_status_check(request):
    """eSewa Status Check API - Called by eSewa to check payment status"""
    try:
        data = json.loads(request.body)
    except:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Invalid JSON data"
        }, status=400)

    request_id = data.get('request_id')
    amount = data.get('amount')
    transaction_code = data.get('transaction_code')

    if not request_id or not amount or not transaction_code:
        return JsonResponse({
            "response_code": 1,
            "response_message": "Missing required fields: request_id, amount, transaction_code"
        }, status=400)

    try:
        payment = TaxPayment.objects.get(pid=request_id)
    except TaxPayment.DoesNotExist:
        return JsonResponse({
            "request_id": request_id,
            "response_code": 3,
            "status": "NOT FOUND",
            "response_message": "Payment not found",
            "amount": float(amount),
            "reference_code": ""
        }, status=404)

    # Verify amount and transaction code
    try:
        amount_match = float(amount) == float(payment.amount)
        transaction_match = payment.esewa_ref == transaction_code
    except (ValueError, TypeError):
        return JsonResponse({
            "response_code": 1,
            "response_message": "Invalid amount format"
        }, status=400)

    if not amount_match:
        return JsonResponse({
            "request_id": request_id,
            "response_code": 1,
            "status": "FAILED",
            "response_message": "Amount mismatch",
            "amount": float(payment.amount),
            "reference_code": ""
        }, status=400)

    # Return status based on payment state
    if payment.status == "success" and transaction_match:
        return JsonResponse({
            "request_id": request_id,
            "response_code": 0,
            "status": "SUCCESS",
            "response_message": "Payment successful",
            "amount": float(payment.amount),
            "reference_code": f"REF_{payment.id}_{transaction_code[:8]}"
        })
    elif payment.status == "pending":
        return JsonResponse({
            "request_id": request_id,
            "response_code": 2,
            "status": "PENDING",
            "response_message": "Payment is being processed",
            "amount": float(payment.amount),
            "reference_code": ""
        })
    else:
        return JsonResponse({
            "request_id": request_id,
            "response_code": 1,
            "status": "FAILED",
            "response_message": "Payment failed",
            "amount": float(payment.amount),
            "reference_code": ""
        })

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


# singupotp

# -------------------------------
# SEND SIGNUP OTP
# -------------------------------

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def send_signup_otp(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=400)

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Save or update OTP (keyed by email) with 2 min expiry. Do NOT create a user here.
    SignupOTP.objects.update_or_create(
        email=email,
        defaults={
            "otp": otp,
            "expires_at": timezone.now() + timezone.timedelta(minutes=2),
        },
    )

    try:
        email_message = EmailMessage(
            subject="EcoGuard Signup OTP",
            body=f"Your OTP for signing up is: {otp}",
            from_email=f"no-reply<{settings.EMAIL_HOST_USER}>",
            to=[email],
            headers={'Reply-To': 'no-reply@ecoguard.com'}
        )
        email_message.send(fail_silently=False)
    except Exception as e:
        return Response({"error": f"Failed to send OTP: {str(e)}"}, status=500)

    return Response({"message": "OTP sent successfully"})


# -------------------------------
# VERIFY SIGNUP OTP
# -------------------------------
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def verify_signup_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")

    if not email or not otp:
        return Response({"error": "Email and OTP are required"}, status=400)

    try:
        otp_record = SignupOTP.objects.get(email=email)
    except SignupOTP.DoesNotExist:
        return Response({"error": "OTP not found"}, status=404)

    if otp_record.is_expired():
        otp_record.delete()
        return Response({"error": "OTP expired"}, status=400)

    if otp != otp_record.otp:
        return Response({"error": "Invalid OTP"}, status=400)

    # OTP is valid — remove OTP record and return success. Do NOT create a user here.
    otp_record.delete()
    return Response({"message": "OTP verified successfully"}, status=200)
