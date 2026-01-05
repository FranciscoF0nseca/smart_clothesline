# Esquemática do Circuito – Smart Clothesline

## Enquadramento

A esquemática apresentada neste projeto representa a **arquitetura funcional** do sistema eletrónico do *Smart Clothesline* (Estendal Inteligente), desenvolvido como protótipo funcional no âmbito académico.

O objetivo principal desta esquemática é demonstrar:
- A correta interligação entre os vários blocos do sistema;
- A separação entre alimentação lógica e alimentação de potência;
- O correto uso de sensores, atuadores e microcontrolador;
- A coerência elétrica do sistema como um todo.

Não se trata de uma esquemática para fabrico de PCB, mas sim de uma representação funcional e conceptual.

---

## Utilização de Módulos Comerciais

Os sensores e conversores utilizados neste projeto foram implementados sob a forma de **módulos comerciais prontos a usar**, nomeadamente:

- **ESP32 Dev Board (ESP32-WROOM-32)**
- **Sensor de Temperatura e Humidade DHT11 (módulo)**
- **Sensor de Chuva (módulo resistivo)**
- **Conversor DC-DC LM2596**
- **Servomotores (MG996R)**

Estes módulos integram internamente componentes eletrónicos auxiliares, tais como:
- Resistências de *pull-up*;
- Reguladores de tensão;
- Condensadores de filtragem;
- Circuitos de condicionamento de sinal.

Por esse motivo, **esses componentes internos não se encontram representados individualmente na esquemática**.

---

## Alimentação do Sistema

O sistema utiliza **duas fontes de alimentação distintas**, de forma a garantir estabilidade elétrica e fiabilidade do funcionamento:

### Bateria Principal
- **Tipo:** Bateria Li-ion
- **Tensão nominal:** 12 V
- **Capacidade:** 50 000 mAh

Esta bateria é responsável pela alimentação dos componentes de maior consumo energético, neste caso os servomotores.

### USB-C
O ESP32 até ao momento é alimentado por USB-C.

---

## Justificação Técnica

A opção por representar os dispositivos como módulos justifica-se por:

- Corresponder à implementação real do protótipo físico;
- Simplificar a leitura e compreensão da esquemática;
- Evitar a representação de circuitaria interna que não foi projetada pelo autor;
- Estar alinhada com boas práticas de documentação em projetos de integração de sistemas.

Sempre que aplicável, assume-se que os módulos cumprem as especificações elétricas indicadas pelos fabricantes.

---

## Alimentação do Sistema

- O **ESP32** é alimentado através de **USB-C** (5 V regulados na própria placa).
- Os **servomotores** são alimentados separadamente através de um **conversor LM2596**, regulado para 5–6 V, a partir de uma bateria de 12 V.
- O **GND é comum** a todo o sistema, garantindo referência elétrica partilhada entre lógica e potência.

Esta separação evita quedas de tensão e interferências causadas pelos motores.

---

## Sensores e Entradas

- **DHT11**: ligado a um pino digital do ESP32 (dados), assumindo resistência de *pull-up* integrada no módulo.
- **LDR**: implementado com divisor resistivo externo para leitura analógica.
- **Sensor de Chuva**: representado como módulo de 3 pinos (VCC, GND, SIGNAL).

---

## Nota Final

Caso este projeto evolua para uma fase de **industrialização ou desenvolvimento de PCB dedicada**, será necessária uma nova esquemática ao nível de componentes discretos.  
Para o âmbito atual, a presente representação cumpre os requisitos funcionais, académicos e documentais do projeto.

---

**Autor:** Francisco Fonseca, Patrick Santos, Gonçalo Amorim  
**Projeto:** Smart Clothesline  
**Versão:** Protótipo Funcional v1.0
