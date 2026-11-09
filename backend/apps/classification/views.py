from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from apps.classification.models import Prediction, PredictionCorrection
from apps.classification.serializers import (
    ClassifyUploadSerializer,
    PredictionCorrectionSerializer,
    PredictionSerializer,
)


class PredictionViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Prediction.objects.select_related("category", "user").all()
    serializer_class = PredictionSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if user.is_staff:
            return queryset
        return queryset.filter(user=user)

    def create(self, request, *args, **kwargs):
        serializer = ClassifyUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"detail": "The classification model is not loaded."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    @action(detail=True, methods=("post",), permission_classes=(permissions.IsAuthenticated,))
    def correct(self, request, pk=None):
        prediction = self.get_object()
        serializer = PredictionCorrectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        correction = PredictionCorrection.objects.create(
            prediction=prediction,
            user=request.user,
            correct_label=serializer.validated_data["correct_label"],
        )
        return Response(
            PredictionCorrectionSerializer(correction).data,
            status=status.HTTP_201_CREATED,
        )