from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignupView,
    ReportListCreateView,
    ReportRetrieveView,
    increment_report_views,
    user_profile,
    send_reset_otp,
    reset_password,
    change_password,
    delete_account,
)

urlpatterns = [
    # Authentication
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile
    path('profile/', user_profile, name='profile'),

    # Reports
    path('reports/', ReportListCreateView.as_view(), name='reports'),
    path('reports/<int:pk>/', ReportRetrieveView.as_view(), name='report-detail'),
    path('reports/<int:pk>/increment_views/',
         increment_report_views, name='increment-views'),

    # Password reset
    path('send-reset-otp/', send_reset_otp, name='send-reset-otp'),
    path('reset-password/', reset_password, name='reset-password'),
    path('change-password/', change_password, name='change-password'),
    path("delete-account/", delete_account, name="delete-account"),
]
