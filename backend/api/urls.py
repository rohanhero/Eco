from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SignupView,
    ReportListCreateView,
    ReportRetrieveView,
    ReportDeleteView,
    increment_report_views,
    user_profile,
    create_tax_payment,
    verify_tax_payment,
    user_tax_payments,
    send_reset_otp,
    reset_password,
    change_password,
    delete_account,
    ReportCommentListCreateView,
    MyReportsListView,
    CommentDetailView,
    send_signup_otp, verify_signup_otp,
    create_tax_payment_api,
    esewa_inquiry,
    esewa_payment,
    esewa_status_check,
    admin_whoami,
    admin_stats,
    AdminUserListCreateView,
    AdminUserDetailView,
    AdminReportListView,
    AdminReportDetailView,
    AdminCommentListView,
    AdminCommentDetailView,
    AdminTaxPaymentListView,
    AdminTaxPaymentDetailView,
    admin_mark_all_payments_success,
    CustomTokenObtainPairView,
)

urlpatterns = [
    # Authentication
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin UI API
    path('admin/whoami/', admin_whoami, name='admin-whoami'),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/users/', AdminUserListCreateView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(),
         name='admin-user-detail'),
    path('admin/reports/', AdminReportListView.as_view(), name='admin-reports'),
    path('admin/reports/<int:pk>/', AdminReportDetailView.as_view(),
         name='admin-report-detail'),
    path('admin/comments/', AdminCommentListView.as_view(), name='admin-comments'),
    path('admin/comments/<int:pk>/', AdminCommentDetailView.as_view(),
         name='admin-comment-detail'),
    path('admin/tax-payments/', AdminTaxPaymentListView.as_view(),
         name='admin-tax-payments'),
    path('admin/tax-payments/<int:pk>/',
         AdminTaxPaymentDetailView.as_view(), name='admin-tax-payment-detail'),
    path('admin/tax-payments/mark-all-success/', admin_mark_all_payments_success,
         name='admin-tax-payments-mark-all-success'),

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
    path('reports/my/', MyReportsListView.as_view(), name='my-reports'),

    path('tax-payments/', create_tax_payment, name='tax-payment-create'),
    path('tax-payments/verify/', verify_tax_payment, name='tax-payment-verify'),
    path('tax-payments/my/', user_tax_payments, name='tax-payment-my'),

    # New eSewa API Integration endpoints
    path('tax-payments/create/', create_tax_payment_api,
         name='tax-payment-create-api'),
    path('esewa/inquiry/<str:request_id>/',
         esewa_inquiry, name='esewa-inquiry'),
    path('esewa/inquiry/', esewa_inquiry, name='esewa-inquiry-query'),
    path('esewa/payment/', esewa_payment, name='esewa-payment'),
    path('esewa/status/', esewa_status_check, name='esewa-status'),

    # hehe dlt cmt
    path("comments/<int:pk>/", CommentDetailView.as_view(), name="comment-detail"),
    # singup
    path('send-otp/', send_signup_otp, name='send-signup-otp'),
    path('verify-otp/', verify_signup_otp, name='verify-signup-otp'),

]
