"""apps/accounts/admin.py"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address
    
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = ['email', 'name', 'phone', 'is_staff', 'is_active', 'date_joined']
    list_filter    = ['is_staff', 'is_active']
    search_fields  = ['email', 'name', 'phone']
    ordering       = ['-date_joined']
    fieldsets      = (
        (None,             {'fields': ('email', 'password')}),
        ('Personal info',  {'fields': ('name', 'phone', 'avatar')}),
        ('Permissions',    {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates',{'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets  = ((None, {'classes': ('wide',), 'fields': ('email', 'name', 'phone', 'password1', 'password2')}),)


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display  = ['user', 'label', 'city', 'state', 'is_default']
    list_filter   = ['label', 'is_default']
    search_fields = ['user__email', 'user__name', 'city', 'state']
