## Dependencies
As dependências Python são definidas no ficheiro requirements.txt 
e são instaladas automaticamente pelo Docker com o Docker Compose.

## Docker
Para inicializar pela primeira vez o Django Containerizado utilizar comando:
cd software\estendal_django
docker compose up --build

## Venv
Caso utilize um ambiente Virtual, o fluxo correto seria:
cd software\estendal_django
python -m pip install --upgrade pip
pip install -r requirements.txt
docker compose up --build

(Nas próximas vezes basta utilizar o "docker compose up", **é necessário ter o docker desktop instalado**)