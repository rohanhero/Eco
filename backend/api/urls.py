# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import SignupView, ReportListCreateView, ReportRetrieveView

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # This endpoint handles login
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("reports/", ReportListCreateView.as_view(), name="reports"),
    path("reports/<int:pk>/", ReportRetrieveView.as_view(), name="report_detail"),
]
