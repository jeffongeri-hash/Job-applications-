# syntax=docker/dockerfile:1
# Naukri auto-applier — headless Chrome + Python
# Only built when: docker compose --profile naukri up -d
FROM python:3.11-slim

# Install Chrome + matching chromedriver in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget gnupg ca-certificates curl unzip \
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
       | gpg --dearmor -o /usr/share/keyrings/google.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google.gpg] \
       http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && CHROME_VER=$(google-chrome --version | grep -oP '\d+\.\d+\.\d+\.\d+') \
    && DRIVER_VER=$(curl -s "https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${CHROME_VER%%.*}") \
    && curl -sL "https://storage.googleapis.com/chrome-for-testing-public/${DRIVER_VER}/linux64/chromedriver-linux64.zip" \
       -o /tmp/cd.zip \
    && unzip /tmp/cd.zip -d /tmp/cd \
    && mv /tmp/cd/chromedriver-linux64/chromedriver /usr/bin/chromedriver \
    && chmod +x /usr/bin/chromedriver \
    && apt-get purge -y wget gnupg unzip \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /tmp/*

WORKDIR /app

# Layer-cached: only re-installs when requirements.txt changes
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY naukri_service.py ./

ENV DATA_DIR=/app/userdata \
    LOG_DIR=/app/logs \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    PYTHONUNBUFFERED=1

EXPOSE 4000
CMD ["python", "naukri_service.py"]
