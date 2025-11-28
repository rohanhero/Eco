from django.contrib.auth.models import AbstractUser, BaseUserManager, PermissionsMixin
from django.db import models

# Add custom manager that uses email as USERNAME_FIELD (no username parameter)
class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    # remove username field (use email as login)
    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # use the custom manager so createsuperuser() accepts email-only
    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    def __str__(self):
        return self.email

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
    view_count = models.IntegerField(default=0)  # Add this field

    def __str__(self):
        return f"{self.title} ({self.user.email})"

#xi
from django.db import models
from django.utils import timezone

class PasswordResetOTP(models.Model):
    user = models.ForeignKey("CustomUser", on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.email}"




