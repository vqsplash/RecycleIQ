from pathlib import Path

from PIL import Image, UnidentifiedImageError
from rest_framework import serializers


MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image_file(uploaded_file):
    if uploaded_file.size > MAX_IMAGE_SIZE:
        raise serializers.ValidationError("Image must be 5 MB or smaller.")
    if Path(uploaded_file.name).suffix.lower() not in ALLOWED_IMAGE_EXTENSIONS:
        raise serializers.ValidationError("Only JPEG, PNG, and WEBP images are allowed.")

    try:
        uploaded_file.seek(0)
        with Image.open(uploaded_file) as image:
            if image.format not in ALLOWED_IMAGE_FORMATS:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and WEBP images are allowed."
                )
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise serializers.ValidationError("The uploaded file is not a valid image.") from error
    finally:
        uploaded_file.seek(0)

    return uploaded_file