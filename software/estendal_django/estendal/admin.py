from django.contrib import admin
from .models import DryingRack, Sensor, Alert


@admin.register(DryingRack)
class DryingRackAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "location", "user", "active", "installation_date", "clothesline_state",)
    list_filter = ("active",)
    search_fields = ("name", "location"),



@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "drying_rack",
        "datetime",
        "temperature",
        "humidity",
        "light_level",
        "rain",
    )
    list_filter = ("rain", "drying_rack")
    search_fields = ("drying_rack__name",)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("id", "drying_rack", "alert_type", "datetime", "resolved")
    list_filter = ("alert_type", "resolved")
    search_fields = ("message",)
