from django.urls import path, include
from estendal import views
from django.contrib.auth import views as auth_views
from estendal.api.sensors import ingest_sensor
from estendal.api.pairing import pair_drying_rack
from estendal.api.control import control_clothesline
from estendal.api.device_state import device_state

urlpatterns = [
    path('', views.dashboard, name='home'),
    path('definicoes/', views.definicoes, name='definicoes'),
    path('historico/', views.historico, name="historico"),
    path('login/', views.login, name="login"),
    path('registo/', views.register, name="registo"),
    path('dashboard/', views.dashboard, name="dashboard"),
    path('logout/', views.logout, name="logout"),
    path("api/sensors/", ingest_sensor, name="api_sensors"),
    path("api/pair/", pair_drying_rack, name="api_pair"),
    path("api/control/", control_clothesline, name="control_drying"),
    path("api/device/state/", device_state, name="device_state"),

    path(
        "password_reset/",
        auth_views.PasswordResetView.as_view(
            template_name="sistema_login/password_reset_form.html"
        ),
        name="password_reset",
    ),

    path(
        "password_reset/done/",
        auth_views.PasswordResetDoneView.as_view(
            template_name="sistema_login/password_reset_done.html"
        ),
        name="password_reset_done",
    ),

    path(
        "reset/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="sistema_login/password_reset_confirm.html"
        ),
        name="password_reset_confirm",
    ),

    path(
        "reset/done/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="sistema_login/password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),

]