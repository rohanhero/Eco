# api/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser, Report
from .serializers import UserSerializer, ReportSerializer
import json
from rest_framework.parsers import MultiPartParser, FormParser

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
    # default permission will be decided per-method in get_permissions()
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        """
        Allow public GET (list) but require authentication for POST (create).
        """
        if self.request.method == "GET":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        # Get location data from form
        location_lat = self.request.data.get('location_lat')
        location_lng = self.request.data.get('location_lng')
        location_address = self.request.data.get('location_address', '')

        # Convert string values to float if present
        if location_lat and location_lng:
            try:
                location_lat = float(location_lat)
                location_lng = float(location_lng)
            except (TypeError, ValueError):
                location_lat = None
                location_lng = None

        serializer.save(
            user=self.request.user,
            location_lat=location_lat,
            location_lng=location_lng,
            location_address=location_address
        )

# -------------------------------
# Report Retrieve (Detail)
# -------------------------------
class ReportRetrieveView(generics.RetrieveAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

# -------------------------------
# Report List (Public)
# -------------------------------
class ReportListAPIView(generics.ListAPIView):
    queryset = Report.objects.all().order_by("-created_at")
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]  # public view
