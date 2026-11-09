from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """RecycleIQ user; staff status grants administrative access."""

    class Meta:
        db_table = "accounts_customuser"