from .models import DryingRack

def active_rack(request):
    if not request.user.is_authenticated:
        return {}

    rack = (
        DryingRack.objects
        .filter(user=request.user, active=True)
        .first()
    )

    return {
        "rack": rack
    }
