from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Report

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    # Fields to display in the user list
    list_display = ('email', 'name', 'is_staff', 'is_active', 'is_superuser')
    list_filter = ('is_staff', 'is_active', 'is_superuser')
    
    # Fields to show in user edit page
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )

    # Fields for creating a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    search_fields = ('email', 'name')
    ordering = ('email',)

# Register models
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Report)
