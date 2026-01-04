# Montagem do Circuito
A montagem do circuito foi realizada após testes individuais de cada componente.
O sistema utiliza duas linhas de alimentação distintas: 3.3V para a lógica (ESP32 e sensores) e 5V dedicada aos atuadores, mantendo GND comum para todo o circuito.

A bateria foi ligada ao conversor LM2596 (positivo ao IN+ e negativo ao IN−), sendo a saída regulada para 5V. A partir do OUT+ e OUT− foi criada uma linha de alimentação dedicada aos motores, uma vez que estes necessitam de maior capacidade de corrente. O negativo desta linha foi ligado ao mesmo GND comum do restante circuito.

O ESP32 foi alimentado via cabo USB-C, por se tratar de um protótipo funcional.
Posteriormente, os sensores foram ligados às respetivas portas lógicas do ESP32:

- DHT11 → GPIO22
- LDR → GPIO34 (entrada ADC)
- Sensor de chuva → GPIO36
- Servos MG996R (sinal PWM) → GPIO14 e GPIO27

Os servos MG996R foram alimentados através da saída de 5V do LM2596, enquanto os sensores foram alimentados a partir da linha de 3.3V do ESP32.
Por fim, garantiu-se que todos os componentes partilham o mesmo GND, assegurando uma referência comum de sinal e o correto funcionamento do sistema.
