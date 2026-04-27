from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Report, Comment, TaxPayment

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


class TaxPaymentAdmin(admin.ModelAdmin):
    list_display = ('pid', 'user', 'amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('pid', 'user__email', 'user__name')
    readonly_fields = ('pid', 'created_at', 'updated_at')

    actions = ['delete_all_payments', 'mark_as_success']

    def delete_all_payments(self, request, queryset):
        """Delete all payment records with one click"""
        count = TaxPayment.objects.all().count()
        TaxPayment.objects.all().delete()
        self.message_user(request, f"Deleted {count} payment records.")
    delete_all_payments.short_description = "🗑️ Delete ALL payment history"

    def mark_as_success(self, request, queryset):
        """Mark selected payments as success"""
        updated = queryset.update(status='success')
        self.message_user(request, f"Marked {updated} payment(s) as success.")
    mark_as_success.short_description = "✅ Mark selected as success"


admin.site.register(TaxPayment, TaxPaymentAdmin)
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
