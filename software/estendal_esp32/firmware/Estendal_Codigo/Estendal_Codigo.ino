#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

// ---- WiFi ----
const char* ssid = "Vodafone-8C8BB5"; 
const char* password = "d9Y4495wJw";

// ---- API ----
const char* apiSensors =
  "https://hattie-erosional-unobesely.ngrok-free.dev/api/sensors/";

// ---- Identificação do estendal ----
#define SERIAL_NUMBER "SCL-1234"

/* =========================================================
   SENSORES
   ========================================================= */

// ---- DHT11 ----
#define DHTPIN 22
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ---- LDR ----
#define LDR_PIN 34   // ADC1

// ---- Sensor de chuva ----
#define CHUVA_PIN 36 // ADC1
#define CHUVA_THRESHOLD 1500

/* =========================================================
   SERVOS (CALIBRADOS)
   ========================================================= */

#define SERVO1_PIN 14
#define SERVO2_PIN 27

// Servo 1
#define SERVO1_ABERTO   20
#define SERVO1_FECHADO  160

// Servo 2
#define SERVO2_ABERTO   160
#define SERVO2_FECHADO  20

Servo servo1;
Servo servo2;

/* =========================================================
   REGRAS AUTOMÁTICAS
   ========================================================= */

#define LUZ_ABRIR    50   // %
#define LUZ_FECHAR   40   // %
#define HUMIDADE_MAX 85   // %

enum EstadoEstendal {
  ABERTO,
  FECHADO
};

EstadoEstendal estadoAtual   = FECHADO;
EstadoEstendal estadoDesejado = FECHADO;

/* =========================================================
   MODOS (PREPARADO PARA BACKEND)
   ========================================================= */

bool automaticMode = true;          // virá do Django
String manualCommand = "NONE";      // OPEN | CLOSE | NONE

/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

void setupADC() {
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Ligando ao WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi ligado");
  Serial.println(WiFi.localIP());
}

/* =========================================================
   CONTROLO DOS SERVOS
   ========================================================= */

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
  if (estadoDesejado == ABERTO) {
    abrirEstendal();
  } else {
    fecharEstendal();
  }
}

/* =========================================================
   LÓGICA DE DECISÃO
   ========================================================= */

void decidirEstado(bool rain, int lightLevel, float humidity) {

  // Fechar sempre com chuva
  if (rain) {
    estadoDesejado = FECHADO;
    return;
  }

  // Manual
  if (manualCommand == "OPEN") {
    estadoDesejado = ABERTO;
    return;
  }
  if (manualCommand == "CLOSE") {
    estadoDesejado = FECHADO;
    return;
  }

  // Automático 
  if (automaticMode) {
    if (estadoAtual == FECHADO) {
      if (lightLevel >= LUZ_ABRIR && humidity < HUMIDADE_MAX) {
        estadoDesejado = ABERTO;
      }
    } else { // ABERTO
      if (lightLevel <= LUZ_FECHAR || humidity >= HUMIDADE_MAX) {
        estadoDesejado = FECHADO;
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupADC();
  dht.begin();

  servo1.attach(SERVO1_PIN, 500, 2500);
  servo2.attach(SERVO2_PIN, 500, 2500);

  // Estado seguro inicial
  fecharEstendal();
  estadoDesejado = FECHADO;

  connectWiFi();

  Serial.println("Estendal iniciado (automático + manual)");
}

void loop() {

  // ---- Leitura sensores ----
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Erro ao ler DHT11");
    delay(2000);
    return;
  }

  int ldrRaw = analogRead(LDR_PIN);
  int lightLevel = map(ldrRaw, 0, 4095, 0, 100);
  lightLevel = constrain(lightLevel, 0, 100);

  int chuvaRaw = analogRead(CHUVA_PIN);
  bool rain = (chuvaRaw >= CHUVA_THRESHOLD);

  // ---- Debug ----
  Serial.println("---- SENSORES ----");
  Serial.print("Temp: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Hum: "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Luz: "); Serial.print(lightLevel); Serial.println(" %");
  Serial.print("Chuva: "); Serial.print(chuvaRaw);
  Serial.print(" -> "); Serial.println(rain ? "CHUVA" : "SECO");

  // ---- Decisão + execução ----
  decidirEstado(rain, lightLevel, humidity);
  aplicarEstado();

  // ---- Envio para backend ----
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiSensors);
    http.addHeader("Content-Type", "application/json");

    String payload = "{";
    payload += "\"serial_number\":\"" SERIAL_NUMBER "\",";
    payload += "\"temperature\":" + String(temperature, 1) + ",";
    payload += "\"humidity\":" + String(humidity, 1) + ",";
    payload += "\"light_level\":" + String(lightLevel) + ",";
    payload += "\"rain\":" + String(rain ? "true" : "false");
    payload += "}";

    int httpCode = http.POST(payload);
    Serial.print("HTTP status: ");
    Serial.println(httpCode);

    http.end();
  }

  delay(30000);
}
