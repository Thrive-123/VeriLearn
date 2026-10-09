from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'username',
        'email',
        'coins',
        'xp',
        'current_streak',
        'longest_streak',
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            'VeriLearn Progress',
            {
                'fields': (
                    'coins',
                    'xp',
                    'current_streak',
                    'longest_streak',
                    'total_study_minutes',
                )
            },
        ),
    )