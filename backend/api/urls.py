# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignupView, ReportListCreateView, ReportRetrieveView, 
    increment_report_views, user_profile
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", user_profile, name="user_profile"),
    path("reports/", ReportListCreateView.as_view(), name="reports"),
    path("reports/<int:pk>/", ReportRetrieveView.as_view(), name="report-detail"),
    path("reports/<int:pk>/view/", increment_report_views, name="increment-views"),
]
