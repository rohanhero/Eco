

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'   # <-- use email as login
    REQUIRED_FIELDS = ['name'] # <-- any extra fields required for superuser

# api/models.py
class Report(models.Model):
    CATEGORY_CHOICES = [
        ("road", "Road & Infrastructure"),
        ("water", "Water & Utilities"),
        ("electricity", "Electricity Problems"),
        ("park", "Park & Recreation"),
        ("environment", "Environmental Issue"),
        ("waste", "Waste Management"),
        ("others", "Others"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low Priority"),
        ("medium", "Medium Priority"),
        ("high", "High Priority"),
        ("urgent", "Urgent"),
    ]

    user = models.ForeignKey("CustomUser", on_delete=models.CASCADE, related_name="reports")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    name = models.CharField(max_length=255)
    email = models.EmailField()
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)
    location_address = models.CharField(max_length=512, blank=True)
    image = models.ImageField(upload_to="report_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.user.email})"
