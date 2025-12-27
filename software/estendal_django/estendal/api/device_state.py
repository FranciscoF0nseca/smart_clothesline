from django.http import JsonResponse
from estendal.models import DryingRack, Sensor, Alert

def device_state(request):
    serial = request.GET.get("serial_number")
    rack = DryingRack.objects.get(serial_number=serial)

    return JsonResponse({
        "ok": True,
        "clothesline_state": rack.clothesline_state
    })
