from django.contrib.auth.models import User
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as logar, logout as sair
from .models import DryingRack, Sensor, Alert
import re
from django.views.decorators.http import require_POST
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
import json
from django.http import JsonResponse

def home(request):
    return render(request, "estendal/index.html")

@login_required(login_url="/login/")
def dashboard(request):

    rack = (
        DryingRack.objects
        .filter(user=request.user, active=True)
        .order_by("installation_date")
        .first()
    )

    laststate = None
    sensor = None
    if rack:

        sensor = (
            Sensor.objects
            .filter(drying_rack=rack)
            .order_by("-datetime")
            .first()
        )

        laststate = rack.clothesline_state


    last_alert = (
        Alert.objects
        .filter(drying_rack__user=request.user)
        .order_by("-datetime")
        .first()
    )

    context = {
        "rack": rack,
        "sensor": sensor,
        "last_alert": last_alert,
        "clothesline_state": laststate,
    }
    return render(request, "estendal/dashboard.html", context)

def login(request):
    if request.method == "GET":
        return render(request, "sistema_login/login.html")

    username = request.POST.get("username", "")
    password = request.POST.get("password", "")

    user = authenticate(request, username=username, password=password)

    if user is None:
        return render(request, "sistema_login/login.html", {
            "error": "Username ou password incorretos.",
            "username": username
        })

    logar(request, user)
    return redirect("dashboard")


def register(request):
    if request.method == "GET":
        return render(request, "sistema_login/registo.html")


    username = request.POST.get("username", "").strip()
    email = request.POST.get("email", "").strip()
    password1 = request.POST.get("password1", "")
    password2 = request.POST.get("password2", "")

    errors = {}
    form_data = {"username": username, "email": email}

    # 1) Campos vazios
    if not username or not email or not password1 or not password2:
        errors["general"] = "Preencha todos os campos."

    # 2) Username já existe
    if username and User.objects.filter(username=username).exists():
        errors["username"] = "Este username já está registado."

    # 3) Email já existe
    if email and User.objects.filter(email=email).exists():
        errors["email"] = "Este email já está registado."

    # 4) Passwords diferentes
    if password1 and password2 and password1 != password2:
        errors["password2"] = "As passwords não coincidem."

    # 5) Regras da password (exemplo: 8 chars, 1 maiúscula, 1 minúscula, 1 dígito)
    pwd_errors = []
    if password1:
        if len(password1) < 8:
            pwd_errors.append("Pelo menos 8 caracteres.")
        if not re.search(r"[A-Z]", password1):
            pwd_errors.append("Pelo menos 1 letra maiúscula.")
        if not re.search(r"[a-z]", password1):
            pwd_errors.append("Pelo menos 1 letra minúscula.")
        if not re.search(r"\d", password1):
            pwd_errors.append("Pelo menos 1 número.")

    if pwd_errors:
        errors["password1"] = " ".join(pwd_errors)


    if errors:
        context = {
            "errors": errors,
            "form": form_data,
        }
        return render(request, "sistema_login/registo.html", context)

    user = User.objects.create_user(username=username, email=email, password=password1)
    user.save()
    return HttpResponseRedirect("/login/")

def logout(request):
    sair(request)
    return redirect("home")

@login_required(login_url='/login/')
def definicoes(request):
    user = request.user

    rack = (
        DryingRack.objects
        .filter(user=user, active=True)
        .first()
    )

    modo_automatico = [
        {
            "label": "Ativar Modo Automático",
            "desc": "Gestão automática baseada nas condições meteorológicas",
            "checked": True,
        },
    ]

    sensors = []
    errors =  {}
    if rack:
        sensors = (
            Sensor.objects
            .filter(drying_rack=rack)
            .order_by('-datetime')[:100]
        )

    if request.method == "POST":
        nome = request.POST.get("nome")
        email = request.POST.get("email")
        nova_password = request.POST.get("nova_password")

        user.username = nome
        user.email = email

        password_alterada = False

        if nova_password:
            user.set_password(nova_password)
            password_alterada = True

        pwd_errors = []
        if nova_password:
            if len(nova_password) < 8:
                pwd_errors.append("Pelo menos 8 caracteres.")
            if not re.search(r"[A-Z]", nova_password):
                pwd_errors.append("Pelo menos 1 letra maiúscula.")
            if not re.search(r"[a-z]", nova_password):
                pwd_errors.append("Pelo menos 1 letra minúscula.")
            if not re.search(r"\d", nova_password):
                pwd_errors.append("Pelo menos 1 número.")

        if pwd_errors:
            errors["password"] = " ".join(pwd_errors)

        if errors:
            context = {
                "errors": errors,
                "modo_automatico": modo_automatico,
                "rack": rack,
                "sensors": sensors,
            }
            return render(request, "estendal/definicoes.html", context)
        user.save()


        if password_alterada:
            return redirect("/logout/")

        return redirect("definicoes")

    return render(request, "estendal/definicoes.html", {
        "errors": errors,
        "modo_automatico": modo_automatico,
        "rack": rack,
        "sensors": sensors,
    })

@login_required(login_url="/login/")
def historico(request):
    rack = (
        DryingRack.objects
        .filter(user=request.user, active=True)
        .order_by("installation_date")
        .first()
    )

    sensors = []
    alerts = []

    if rack:
        last_24h = timezone.now() - timedelta(hours=24)

        sensors = [
            {
                "datetime": s.datetime.isoformat(),
                "temperature": s.temperature,
                "humidity": s.humidity,
            }
            for s in Sensor.objects.filter(
                drying_rack=rack,
                datetime__gte=last_24h
            ).order_by("datetime")
        ]

        alerts = (
            Alert.objects
            .filter(drying_rack=rack)
            .order_by("-datetime")[:20]
        )

    context = {
        "sensors": sensors,
        "alerts": alerts,
        "rack": rack,
    }

    return render(request, "estendal/historico.html", context)

@login_required(login_url="/login/")
@require_POST
def remover_estendal(request):
    rack = (
        DryingRack.objects
        .filter(user=request.user, active=True)
        .first()
    )

    if rack:
        rack.active = False
        rack.save()

    return redirect("definicoes")
