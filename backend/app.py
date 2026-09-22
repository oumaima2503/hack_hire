import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

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

    return app


app = create_app()

if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 5000)), debug=not config.PRODUCTION)
