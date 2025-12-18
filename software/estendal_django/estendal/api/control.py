import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from estendal.models import DryingRack, Sensor, Alert


@csrf_exempt
@require_POST
@login_required
def control_clothesline(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse(
            {"ok": False, "error": "JSON inválido"},
            status=400
        )

    serial_number = data.get("serial_number")
    action = data.get("action")

    if not serial_number or action not in ["open", "close"]:
        return JsonResponse(
            {"ok": False, "error": "Parâmetros inválidos"},
            status=400
        )

    try:
        rack = DryingRack.objects.get(serial_number=serial_number)
    except DryingRack.DoesNotExist:
        return JsonResponse(
            {"ok": False, "error": "Estendal não encontrado"},
            status=404
        )

    # Segurança: só o dono pode controlar
    if rack.user != request.user:
        return JsonResponse(
            {"ok": False, "error": "Sem permissão para controlar este estendal"},
            status=403
        )

    new_state = "extended" if action == "open" else "retracted"

    # Criar nova leitura de sensor
    sensor = Sensor.objects.create(
        drying_rack=rack,
        datetime=timezone.now(),
        clothesline_state=new_state
    )

    # Criar alerta manual
    Alert.objects.create(
        drying_rack=rack,
        alert_type="manual",
        message=f"Estendal {'aberto' if action == 'open' else 'fechado'} manualmente"
    )

    return JsonResponse({
        "ok": True,
        "state": new_state,
        "sensor_id": sensor.id
    })
