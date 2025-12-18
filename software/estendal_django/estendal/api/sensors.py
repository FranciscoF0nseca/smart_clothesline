import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from estendal.models import DryingRack, Sensor, ClotheslineState


@csrf_exempt
@require_POST
def ingest_sensor(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"ok": False, "error": "JSON inválido"}, status=400)

    serial = (data.get("serial_number") or "").strip().upper()
    if not serial:
        return JsonResponse({"ok": False, "error": "serial_number em falta"}, status=400)

    try:
        rack = DryingRack.objects.get(serial_number=serial)
    except DryingRack.DoesNotExist:
        return JsonResponse({"ok": False, "error": "Estendal não encontrado"}, status=404)

    sensor = Sensor.objects.create(
        drying_rack=rack,
        temperature=data.get("temperature"),
        humidity=data.get("humidity"),
        light_level=data.get("light_level"),
        rain=data.get("rain", False),
        drying_time_estimate=data.get("drying_time_estimate"),
        clothesline_state=data.get(
            "clothesline_state",
            ClotheslineState.EXTENDED,
        ),
    )

    return JsonResponse(
        {
            "ok": True,
            "sensor_id": sensor.id,
        }
    )
