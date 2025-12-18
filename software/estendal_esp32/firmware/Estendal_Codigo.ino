#include <DHT.h>
#include <ESP32Servo.h>

// ======== DHT11 ========
#define DHTPIN 22
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ======== Sensor de Chuva ========
#define CHUVA_PIN 36   // ADC1 - entrada analógica

// ======== Servos MG996R ==========
#define SERVO1_PIN 14
#define SERVO2_PIN 27

Servo servo1;
Servo servo2;

void setup() {
  Serial.begin(115200);

  dht.begin();

  // Liga os servos com pulsos calibrados
  servo1.attach(SERVO1_PIN, 500, 2500);
  servo2.attach(SERVO2_PIN, 500, 2500);

  Serial.println("Sistema iniciado: DHT11 + Chuva + 2 Servos");
}

void loop() {

  // ---------- Leitura do DHT11 ----------
  float hum = dht.readHumidity();
  float temp = dht.readTemperature();

  // ---------- Leitura do sensor de chuva ----------
  int leituraChuva = analogRead(CHUVA_PIN);

  String estadoChuva;

  // ======== Lógica de controlo ========
  if (leituraChuva < 500) {
    estadoChuva = "SECO";

    // Abrir estendal
    servo1.write(0);
    servo2.write(0);
  }
  else if (leituraChuva < 1500) {
    estadoChuva = "HÚMIDO";

    // Meio
    servo1.write(90);
    servo2.write(90);
  }
  else {
    estadoChuva = "CHUVA";

    // Fechar estendal
    servo1.write(180);
    servo2.write(180);
  }

  // ---------- Debug ----------
  Serial.print("Temp: ");
  Serial.print(temp);
  Serial.print(" °C | Humidade: ");
  Serial.print(hum);
  Serial.print(" % | Chuva: ");
  Serial.print(leituraChuva);
  Serial.print(" -> ");
  Serial.println(estadoChuva);

  delay(1000);
}