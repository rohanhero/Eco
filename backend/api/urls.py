from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    SignupView,
    ReportListCreateView,
    ReportRetrieveView,
    ReportDeleteView,
    increment_report_views,
    user_profile,
    send_reset_otp,
    reset_password,
    change_password,
    delete_account,
    ReportCommentListCreateView,
    MyReportsListView,
    CommentDetailView,
    send_signup_otp, verify_signup_otp,
)

urlpatterns = [
    # Authentication
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Profile
    path('profile/', user_profile, name='profile'),

    # Reports
    path('reports/', ReportListCreateView.as_view(),
         name='report-list'),  # GET all / POST create
    path('reports/<int:pk>/', ReportRetrieveView.as_view(),
         name='report-detail'),  # GET detail (public)
    path('reports/<int:pk>/delete/', ReportDeleteView.as_view(),
         name='report-delete'),  # DELETE only for owner
    path('reports/<int:pk>/increment_views/', increment_report_views,
         name='increment-views'),  # POST increment views

    # Password reset
    path('send-reset-otp/', send_reset_otp, name='send-reset-otp'),
    path('reset-password/', reset_password, name='reset-password'),
    path('change-password/', change_password, name='change-password'),

    # Delete account
    path("delete-account/", delete_account, name="delete-account"),

    # Report Comments
    path('reports/<int:pk>/comments/',
         ReportCommentListCreateView.as_view(), name='report-comments'),
    # yourreport
    path('reports/my/', MyReportsListView.as_view(), name='my-reports'),

    # hehe dlt cmt
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    # singup
    path('send-otp/', send_signup_otp, name='send-signup-otp'),
    path('verify-otp/', verify_signup_otp, name='verify-signup-otp'),

]
