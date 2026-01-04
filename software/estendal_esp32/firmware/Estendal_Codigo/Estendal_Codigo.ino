#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

/* =====================================================
   CONFIGURAÇÃO GERAL
   ===================================================== */

// ---- WiFi ----
const char* ssid = "Xiaomi";
const char* password = "francisco125";

// ---- APIs ----
const char* apiSensors =
  "https://hattie-erosional-unobesely.ngrok-free.dev/api/sensors/";

const char* apiState =
  "https://hattie-erosional-unobesely.ngrok-free.dev/api/device/state/?serial_number=SCL-1234";

// ---- Identificação ----
#define SERIAL_NUMBER "SCL-1234"

/* =====================================================
   SENSORES
   ===================================================== */

// ---- DHT11 ----
#define DHTPIN 22
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---- LDR ----
#define LDR_PIN 34

// ---- Sensor de chuva ----
#define CHUVA_PIN 36
#define CHUVA_THRESHOLD 1500
#define CHUVA_DETETA(v) ((v) >= CHUVA_THRESHOLD)

/* =====================================================
   SERVOS (CALIBRADOS)
   ===================================================== */

#define SERVO1_PIN 14
#define SERVO2_PIN 27

#define SERVO1_ABERTO   70
#define SERVO1_FECHADO  3

#define SERVO2_ABERTO   230
#define SERVO2_FECHADO  120

Servo servo1;
Servo servo2;

/* =====================================================
   ESTADO DO ESTENDAL
   ===================================================== */

enum EstadoEstendal { ABERTO, FECHADO };

EstadoEstendal estadoAtual    = FECHADO;
EstadoEstendal estadoDesejado = FECHADO;

/* =====================================================
   OVERRIDE MANUAL (BOTÕES)
   ===================================================== */

String backendState = "retracted";   // extended | retracted

bool overrideAtivo = false;
EstadoEstendal overrideEstado = FECHADO;
unsigned long overrideAteMs = 0;

// tempo do override (ex: 2 minutos)
const unsigned long OVERRIDE_TTL_MS = 2UL * 60UL * 1000UL;

/* =====================================================
   LIMIARES AUTOMÁTICOS
   ===================================================== */

#define LUZ_ABRIR   50
#define LUZ_FECHAR  40   // histerese

/* =====================================================
   ADC
   ===================================================== */

void setupADC() {
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
}

/* =====================================================
   WIFI
   ===================================================== */

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("A ligar ao WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi ligado");
  Serial.println(WiFi.localIP());
}

/* =====================================================
   CONTROLO DOS SERVOS
   ===================================================== */

void abrirEstendal() {
  if (estadoAtual == ABERTO) return;

  servo1.write(SERVO1_ABERTO);
  servo2.write(SERVO2_ABERTO);

  estadoAtual = ABERTO;
  Serial.println(">> ESTENDAL ABERTO");
}

void fecharEstendal() {
  if (estadoAtual == FECHADO) return;

  servo1.write(SERVO1_FECHADO);
  servo2.write(SERVO2_FECHADO);

  estadoAtual = FECHADO;
  Serial.println(">> ESTENDAL FECHADO");
}

void aplicarEstado() {
  if (estadoDesejado == ABERTO) abrirEstendal();
  else fecharEstendal();
}

/* =====================================================
   LEITURA DO BACKEND (BOTÕES)
   ===================================================== */

void lerEstadoDoBackend() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiState);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();

    String novoEstado = backendState;

    if (body.indexOf("extended") >= 0) novoEstado = "extended";
    else if (body.indexOf("retracted") >= 0) novoEstado = "retracted";

    // Se o utilizador clicou num botão
    if (novoEstado != backendState) {
      backendState = novoEstado;

      overrideAtivo = true;
      overrideEstado = (backendState == "extended") ? ABERTO : FECHADO;
      overrideAteMs = millis() + OVERRIDE_TTL_MS;

      Serial.println(">> OVERRIDE MANUAL ATIVO");
    }
  }

  http.end();
}

/* =====================================================
   LÓGICA DE DECISÃO
   ===================================================== */

void decidirEstado(bool rain, int lightLevel) {

  // PRIORIDADE 1 — chuva física
  if (rain) {
    estadoDesejado = FECHADO;
    return;
  }

  // Verificar se override expirou
  if (overrideAtivo && (long)(millis() - overrideAteMs) >= 0) {
    overrideAtivo = false;
    Serial.println(">> OVERRIDE EXPIROU, VOLTAR AO AUTOMÁTICO");
  }

  // PRIORIDADE 2 — override manual
  if (overrideAtivo) {
    estadoDesejado = overrideEstado;
    return;
  }

  // PRIORIDADE 3 — automático (sempre ON)
  if (estadoAtual == FECHADO && lightLevel >= LUZ_ABRIR) {
    estadoDesejado = ABERTO;
    return;
  }

  if (estadoAtual == ABERTO && lightLevel <= LUZ_FECHAR) {
    estadoDesejado = FECHADO;
    return;
  }

  estadoDesejado = estadoAtual;
}

/* =====================================================
   ENVIO DE SENSORES
   ===================================================== */

void enviarSensores(float temp, float hum, int lightLevel, bool rain) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(apiSensors);
  http.addHeader("Content-Type", "application/json");

  String payload = "{";
  payload += "\"serial_number\":\"" SERIAL_NUMBER "\",";
  payload += "\"temperature\":" + String(temp, 1) + ",";
  payload += "\"humidity\":" + String(hum, 1) + ",";
  payload += "\"light_level\":" + String(lightLevel) + ",";
  payload += "\"rain\":" + String(rain ? "true" : "false");
  payload += "}";

  int code = http.POST(payload);
  Serial.print("POST HTTP: ");
  Serial.println(code);

  http.end();
}

/* =====================================================
   SETUP
   ===================================================== */

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupADC();
  dht.begin();

  servo1.attach(SERVO1_PIN, 500, 2500);
  servo2.attach(SERVO2_PIN, 500, 2500);

  fecharEstendal();

  connectWiFi();

  Serial.println("=== ESTENDAL INICIADO ===");
}

/* =====================================================
   LOOP
   ===================================================== */

void loop() {

  // 1) Ler backend (botões)
  lerEstadoDoBackend();

  // 2) Ler sensores
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();

  int ldrRaw = analogRead(LDR_PIN);
  int lightLevel = map(ldrRaw, 0, 4095, 0, 100);
  lightLevel = constrain(lightLevel, 0, 100);

  int chuvaRaw = analogRead(CHUVA_PIN);
  bool rain = CHUVA_DETETA(chuvaRaw);

  // 3) Decidir e aplicar
  decidirEstado(rain, lightLevel);
  aplicarEstado();

  // 4) Enviar sensores
  if (!isnan(temperature) && !isnan(humidity)) {
    enviarSensores(temperature, humidity, lightLevel, rain);
  } else {
    Serial.println("Erro ao ler DHT11");
  }

  // 5) DEBUG
  Serial.println("---- SENSORES ----");
  Serial.print("Temp: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Hum: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Luz: "); Serial.print(lightLevel); Serial.println(" %");
  Serial.print("Chuva: "); Serial.print(chuvaRaw);
  Serial.print(" -> "); Serial.println(rain ? "CHUVA" : "SECO");

  Serial.print("Override: "); Serial.println(overrideAtivo ? "ON" : "OFF");
  Serial.print("Estado atual: ");
  Serial.println(estadoAtual == ABERTO ? "ABERTO" : "FECHADO");
  Serial.println();

  delay(5000);
}