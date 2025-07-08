Para ativar o servidor do backend basta seguir os seguintes passos:

1. Abra o cmd ou powershell e ache a pasta em que esta o projeto.

Exemplo: C:\Users\dlsilveira\Desktop\Projeto Integrador Web

2. Rode o comando a seguir:

venv\Scripts\activate

3. Instalar as dependências do projeto com o comando:

pip install -r requirements.txt

4. Use cd para entrar na pasta Script e rode o comando a seguir:

uvicorn main:app --reload --port 8000

