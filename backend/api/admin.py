from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Report, Comment

# Unregister first if already registered
if admin.site.is_registered(CustomUser):
    admin.site.unregister(CustomUser)


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'name', 'is_staff', 'is_active', 'is_superuser')
    list_filter = ('is_staff', 'is_active', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_staff', 'is_active',
         'is_superuser', 'groups', 'user_permissions')}),
    )
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

# --- Add Comment model to admin with delete authority for admin


class CommentAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'user_email',
                    'report', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user_name', 'user_email', 'text')
    # Admin can delete any comment
    actions = ['delete_selected']


admin.site.register(Comment, CommentAdmin)
