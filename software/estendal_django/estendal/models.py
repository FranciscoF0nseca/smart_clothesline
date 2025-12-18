from django.db import models
from django.utils import timezone
from django.conf import settings

# ============================
# ENUMS (Choice Fields Django)
# ============================

class ClotheslineState(models.TextChoices):
    EXTENDED = "extended", "Estendido"
    RETRACTED = "retracted", "Recolhido"


class AlertType(models.TextChoices):
    RAIN = "rain", "Chuva"
    ERROR = "error", "Erro"
    MANUAL = "manual", "Manual"

# ============================
# DRYING RACK (Estendal)
# ============================

class DryingRack(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="drying_racks",
        on_delete=models.CASCADE
    )
    installation_date = models.DateTimeField(default=timezone.now)
    active = models.BooleanField(default=True)

    # 🔽 NOVOS CAMPOS
    serial_number = models.CharField(
        max_length=32,
        unique=True,
        blank=True,
        null=True,  # deixo null=True para não rebentar com dados antigos
    )
    pairing_code = models.CharField(
        max_length=16,
        blank=True,
        null=True,
    )

    def __str__(self):
        # Mostramos também o nº de série se existir
        if self.serial_number:
            return f"{self.name} ({self.serial_number})"
        return f"{self.name} ({self.location})"


# ============================
# SENSOR READINGS
# ============================

class Sensor(models.Model):
    drying_rack = models.ForeignKey(DryingRack, related_name="sensors", on_delete=models.CASCADE)
    datetime = models.DateTimeField(default=timezone.now)

    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    light_level = models.IntegerField(null=True, blank=True)
    rain = models.BooleanField(default=False)


    drying_time_estimate = models.IntegerField(null=True, blank=True)

    clothesline_state = models.CharField(
        max_length=20,
        choices=ClotheslineState.choices,
        default=ClotheslineState.EXTENDED,
    )

    def __str__(self):
        return f"Sensor {self.id} - {self.datetime}"


# ============================
# ALERTS
# ============================

class Alert(models.Model):
    drying_rack = models.ForeignKey(DryingRack, related_name="alerts", on_delete=models.CASCADE)
    datetime = models.DateTimeField(default=timezone.now)

    alert_type = models.CharField(
        max_length=20,
        choices=AlertType.choices,
    )

    message = models.CharField(max_length=255, blank=True, null=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert {self.id} - {self.alert_type}"
