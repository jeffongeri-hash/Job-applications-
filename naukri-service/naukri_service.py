"""
naukri_service.py — Linux-compatible Naukri.com auto-applier
Reimplements darsan-in/Job-Hunter logic for headless Docker/Railway.
Exposes a minimal Flask REST API so the JobOps UI can trigger runs.
"""

import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from threading import Thread

from flask import Flask, jsonify, request
from selenium import webdriver
from selenium.common.exceptions import (
    ElementNotInteractableException,
    NoSuchElementException,
    TimeoutException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# ─── Config from env ──────────────────────────────────────────────────────────
DATA_DIR   = Path(os.environ.get("DATA_DIR", "/app/userdata"))
LOG_DIR    = Path(os.environ.get("LOG_DIR",  "/app/logs"))
CHROMEDRIVER = os.environ.get("CHROMEDRIVER_PATH", "/usr/bin/chromedriver")

DATA_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "naukri.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("naukri")

# ─── Shared run state (simple in-process tracker) ────────────────────────────
run_state = {
    "running": False,
    "applied": 0,
    "failed": 0,
    "last_run": None,
    "log": [],
}


# ─── Browser factory ─────────────────────────────────────────────────────────
def make_driver(headless: bool = True) -> webdriver.Chrome:
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    # Persistent profile so login session is reused across runs
    profile_dir = DATA_DIR / "chrome-profile"
    opts.add_argument(f"--user-data-dir={profile_dir}")
    # Desktop user-agent to avoid mobile redirects
    opts.add_argument(
        "user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    svc = Service(CHROMEDRIVER)
    return webdriver.Chrome(service=svc, options=opts)


# ─── Core helpers ─────────────────────────────────────────────────────────────
def _emit(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    entry = f"[{ts}] {msg}"
    run_state["log"].append(entry)
    log.info(msg)


def close_chatbot(driver):
    try:
        btn = driver.find_element(By.XPATH, '//button[@class="closeButton"]')
        btn.click()
    except Exception:
        pass


def login(driver, email: str, password: str) -> bool:
    _emit("Opening Naukri login page…")
    driver.get("https://www.naukri.com/nlogin/login")
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.ID, "usernameField"))
        )
        driver.find_element(By.ID, "usernameField").send_keys(email)
        driver.find_element(By.ID, "passwordField").send_keys(password)
        driver.find_element(
            By.XPATH, '//button[@type="submit" and contains(text(),"Login")]'
        ).click()
        WebDriverWait(driver, 15).until(EC.url_contains("naukri.com/mnjuser"))
        _emit("Login successful")
        return True
    except TimeoutException:
        # Already logged in via persistent profile
        if "naukri.com" in driver.current_url and "login" not in driver.current_url:
            _emit("Session already active — skipping login")
            return True
        _emit("Login failed — check credentials")
        return False


def apply_jobs(driver, filtered_url: str, limit: int = 10):
    """Navigate to a Naukri filtered search URL and apply to Easy Apply jobs."""
    _emit(f"Loading jobs page (limit={limit})…")
    driver.get(filtered_url)
    time.sleep(3)
    close_chatbot(driver)

    applied = 0
    failed  = 0

    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, "srp-jobtuple-wrapper"))
        )
    except TimeoutException:
        _emit("No job listings found at that URL")
        return applied, failed

    cards = driver.find_elements(By.CLASS_NAME, "srp-jobtuple-wrapper")
    _emit(f"Found {len(cards)} job cards")

    for i, card in enumerate(cards[:limit]):
        if applied >= limit:
            break
        try:
            title_el = card.find_element(By.CLASS_NAME, "title")
            title = title_el.text.strip()
            # Only click Easy Apply buttons
            try:
                apply_btn = card.find_element(
                    By.XPATH, './/button[contains(text(),"Apply") or contains(text(),"Easy Apply")]'
                )
            except NoSuchElementException:
                _emit(f"  [{i+1}] {title} — no Easy Apply button, skipping")
                continue

            # Open in new tab
            driver.execute_script("window.open(arguments[0].href, '_blank');", title_el)
            driver.switch_to.window(driver.window_handles[-1])
            time.sleep(2)
            close_chatbot(driver)

            # Click apply
            try:
                btn = WebDriverWait(driver, 8).until(
                    EC.element_to_be_clickable(
                        (By.XPATH, '//button[contains(text(),"Apply") or contains(text(),"Easy Apply")]')
                    )
                )
                btn.click()
                time.sleep(2)

                # Confirm if a confirmation dialog appears
                try:
                    confirm = driver.find_element(
                        By.XPATH, '//button[contains(text(),"Apply") and @class]'
                    )
                    confirm.click()
                    time.sleep(1)
                except Exception:
                    pass

                _emit(f"  [{i+1}] Applied: {title}")
                applied += 1
                run_state["applied"] += 1
            except (TimeoutException, ElementNotInteractableException) as e:
                _emit(f"  [{i+1}] Failed: {title} — {e}")
                failed += 1
                run_state["failed"] += 1
            finally:
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                time.sleep(1)

        except Exception as exc:
            _emit(f"  [{i+1}] Error on card: {exc}")
            failed += 1
            run_state["failed"] += 1

    return applied, failed


# ─── Background runner ────────────────────────────────────────────────────────
def _run_worker(email: str, password: str, filtered_url: str, limit: int):
    run_state["running"] = True
    run_state["applied"] = 0
    run_state["failed"]  = 0
    run_state["log"]     = []
    run_state["last_run"] = datetime.utcnow().isoformat()

    driver = None
    try:
        driver = make_driver(headless=True)
        ok = login(driver, email, password)
        if ok:
            apply_jobs(driver, filtered_url, limit)
        else:
            _emit("Aborting — login failed")
    except Exception as exc:
        _emit(f"Fatal error: {exc}")
        log.exception("Unhandled error in run worker")
    finally:
        if driver:
            driver.quit()
        run_state["running"] = False
        _emit("Run complete")


# ─── Flask API ────────────────────────────────────────────────────────────────
app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"ok": True})


@app.get("/status")
def status():
    return jsonify({
        "running":   run_state["running"],
        "applied":   run_state["applied"],
        "failed":    run_state["failed"],
        "last_run":  run_state["last_run"],
        "log":       run_state["log"][-50:],   # last 50 lines
    })


@app.post("/run")
def start_run():
    if run_state["running"]:
        return jsonify({"error": "A run is already in progress"}), 409

    body = request.get_json(silent=True) or {}
    email        = body.get("email")        or os.environ.get("NAUKRI_EMAIL", "")
    password     = body.get("password")     or os.environ.get("NAUKRI_PASSWORD", "")
    filtered_url = body.get("filteredUrl")  or os.environ.get("NAUKRI_FILTERED_URL", "")
    limit        = int(body.get("limit", os.environ.get("NAUKRI_APPLY_LIMIT", 10)))

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
    if not filtered_url:
        return jsonify({"error": "filteredUrl is required"}), 400

    # Persist config for re-use
    cfg = {"email": email, "filteredUrl": filtered_url, "limit": limit}
    (DATA_DIR / "config.json").write_text(json.dumps(cfg, indent=2))

    Thread(
        target=_run_worker,
        args=(email, password, filtered_url, limit),
        daemon=True,
    ).start()

    return jsonify({"ok": True, "message": f"Run started — applying to up to {limit} jobs"}), 202


@app.post("/stop")
def stop_run():
    # Graceful stop is handled by limiting the loop; flag it
    run_state["running"] = False
    return jsonify({"ok": True})


@app.get("/config")
def get_config():
    cfg_file = DATA_DIR / "config.json"
    if cfg_file.exists():
        return jsonify(json.loads(cfg_file.read_text()))
    return jsonify({})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 4000))
    app.run(host="0.0.0.0", port=port)
