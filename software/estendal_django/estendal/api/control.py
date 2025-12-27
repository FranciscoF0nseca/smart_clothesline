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
    data = json.loads(request.body)

    serial_number = data.get("serial_number")
    action = data.get("action")

    if action not in ["open", "close"]:
        return JsonResponse({"ok": False}, status=400)

    rack = DryingRack.objects.get(serial_number=serial_number)

    if rack.user != request.user:
        return JsonResponse({"ok": False}, status=403)

    rack.clothesline_state = "extended" if action == "open" else "retracted"
    rack.save()

    Alert.objects.create(
        drying_rack=rack,
        alert_type="manual",
        message=f"Estendal {'aberto' if action == 'open' else 'fechado'} manualmente"
    )

    return JsonResponse({
        "ok": True,
        "state": rack.clothesline_state
    })