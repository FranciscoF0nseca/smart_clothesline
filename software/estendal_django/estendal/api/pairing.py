import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from estendal.models import DryingRack


@csrf_exempt
@require_POST
@login_required
def pair_drying_rack(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse(
            {"ok": False, "error": "JSON inválido"},
            status=400
        )

    serial_number = data.get("serial_number")
    pairing_code = data.get("pairing_code")
    name = data.get("name", "").strip()
    location = data.get("location", "").strip()

    if not serial_number or not pairing_code:
        return JsonResponse(
            {"ok": False, "error": "Número de série e código obrigatórios"},
            status=400
        )

    try:
        rack = DryingRack.objects.get(serial_number=serial_number)
    except DryingRack.DoesNotExist:
        return JsonResponse(
            {"ok": False, "error": "Estendal não encontrado"},
            status=404
        )

    if rack.pairing_code != pairing_code:
        return JsonResponse(
            {"ok": False, "error": "Código de emparelhamento incorreto"},
            status=403
        )

    if rack.user and rack.user != request.user:
        return JsonResponse(
            {"ok": False, "error": "Este estendal já pertence a outro utilizador"},
            status=409
        )

    rack.user = request.user
    rack.active = True

    if name:
        rack.name = name
    if location:
        rack.location = location

    rack.save()

    return JsonResponse({
        "ok": True,
        "rack_id": rack.id,
        "name": rack.name,
        "serial_number": rack.serial_number
    })
