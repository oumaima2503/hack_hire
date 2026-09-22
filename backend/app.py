import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

load_dotenv()
logging.basicConfig(level=logging.INFO)

import config  # noqa: E402  (reads the environment loaded above)
from middleware.auth import csrf_guard  # noqa: E402
from repository import get_repository  # noqa: E402
from routes import auth, chat, funnel, learning, parents  # noqa: E402
from validators import ApiError  # noqa: E402


def create_app(repo=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 256 * 1024
    if os.getenv("TRUST_PROXY", "").lower() in ("1", "true", "yes"):
        # Behind Railway's proxy: use the real client IP (rate limits) and HTTPS scheme.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    app.json.ensure_ascii = False
    CORS(app, origins=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(","), supports_credentials=True)

    app.extensions["repo"] = repo or get_repository()
    app.logger.info("Storage: %s · Gemini: %s", app.extensions["repo"].name,
                    "on" if config.GEMINI_API_KEY else "off (offline helper)")

    for bp in (funnel.bp, auth.bp, parents.bp, learning.bp, chat.bp):
        app.register_blueprint(bp)

    app.before_request(csrf_guard)

    @app.after_request
    def security_headers(res):
        res.headers["X-Content-Type-Options"] = "nosniff"
        res.headers["X-Frame-Options"] = "DENY"
        res.headers["Referrer-Policy"] = "no-referrer"
        if request.path.startswith("/api"):
            res.headers["Cache-Control"] = "no-store"
        return res

    @app.errorhandler(ApiError)
    def api_error(e):
        return jsonify(error=e.message), e.status

    @app.errorhandler(HTTPException)
    def http_error(e):
        return jsonify(error=e.description), e.code

    @app.errorhandler(Exception)
    def unexpected(e):
        app.logger.exception("Unhandled error")
        return jsonify(error="Something went wrong"), 500

    _serve_frontend(app)
    return app


def _serve_frontend(app):
    """In production (one Railway service) Flask also serves the built React app, so the
    pages and /api share one origin and the httpOnly session cookie just works."""
    dist = os.path.abspath(os.getenv("FRONTEND_DIST", os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")))
    if not os.path.isfile(os.path.join(dist, "index.html")):
        return  # dev: Vite serves the frontend

    @app.get("/")
    @app.get("/<path:path>")
    def spa(path=""):
        if path.startswith("api/"):
            raise ApiError("Not found", 404)
        file = os.path.join(dist, path)
        if path and os.path.isfile(file):
            res = send_from_directory(dist, path)
            if path.startswith("assets/"):  # fingerprinted by Vite: cache forever
                res.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            return res
        res = send_from_directory(dist, "index.html")  # client-side routes (/play/…, /parent…)
        res.headers["Cache-Control"] = "no-cache"
        return res


app = create_app()

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 5000)), debug=not config.PRODUCTION)
