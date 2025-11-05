# api/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser, Report
from .serializers import UserSerializer, ReportSerializer
import json

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
        location = self.request.data.get("location")
        
        # Handle location if sent as string
        if isinstance(location, str):
            try:
                location = json.loads(location)
            except json.JSONDecodeError:
                location = {}
        elif not isinstance(location, dict):
            location = {}

        lat = location.get("lat")
        lng = location.get("lng")
        address = location.get("address", "")

        serializer.save(
            user=self.request.user,
            location_lat=lat,
            location_lng=lng,
            location_address=address
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
