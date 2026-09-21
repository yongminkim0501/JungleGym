FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY backend backend
COPY frontend frontend

EXPOSE 3000

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:3000", "app:app"]
