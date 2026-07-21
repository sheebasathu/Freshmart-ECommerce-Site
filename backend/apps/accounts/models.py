"""apps/accounts/models.py"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, name=name, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password, **extra):
        extra.setdefault('is_staff',     True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    email       = models.EmailField(unique=True)
    name        = models.CharField(max_length=150)
    phone       = models.CharField(max_length=15, blank=True)
    avatar      = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD  = 'email'      # ← SimpleJWT authenticates with this field
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'fm_users'

    def __str__(self):
        return f'{self.name} <{self.email}>'


class Address(models.Model):
    LABEL_CHOICES = [('home', 'Home'), ('work', 'Work'), ('other', 'Other')]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label      = models.CharField(max_length=10, choices=LABEL_CHOICES, default='home')
    name       = models.CharField(max_length=150)
    phone      = models.CharField(max_length=15)
    house      = models.CharField(max_length=200)
    street     = models.CharField(max_length=200)
    landmark   = models.CharField(max_length=200, blank=True)
    city       = models.CharField(max_length=100)
    state      = models.CharField(max_length=100)
    postcode   = models.CharField(max_length=10)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fm_addresses'

    def save(self, *args, **kwargs):
        # ── BUG FIX ────────────────────────────────────────────────────────────
        # Original code had super().save() INSIDE the `if self.is_default:` block.
        # This meant any address where is_default=False was NEVER written to DB.
        # super().save() must always be called regardless of the is_default flag.
        # ───────────────────────────────────────────────────────────────────────
        if self.is_default:
            # Clear any existing default for this user before setting the new one
            Address.objects.filter(
                user=self.user, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)   # ← ALWAYS called now (was missing when is_default=False)

    def __str__(self):
        return f'{self.label} — {self.user.name}'