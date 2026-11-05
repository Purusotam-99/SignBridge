"""Flask application factory, CORS configuration, and route registration."""
import os
import sys
import logging

# Ensure backend root is in python search path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, jsonify, request
try:
    from flask_cors import CORS
except ImportError:
    CORS = None

from config import PORT, HOST, DEBUG, ALLOWED_ORIGINS, MAX_IMAGE_BYTES
from routes import predict_bp, metrics_bp, health_bp

# Configure standard application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signbridge")


def create_app() -> Flask:
    """
    Application factory for the SignBridge backend API.
    Configures CORS for ALLOWED_ORIGINS only, registers API blueprints,
    and binds standard JSON error handlers.
    """
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_IMAGE_BYTES + (1024 * 1024)

    # Configure CORS strictly for ALLOWED_ORIGINS
    if CORS is not None:
        CORS(
            app,
            resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
            methods=["GET", "POST", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization"]
        )
    else:
        @app.after_request
        def add_cors_headers(response):
            origin = request.headers.get("Origin")
            if origin in ALLOWED_ORIGINS:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return response

    # Register API blueprints
    app.register_blueprint(predict_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(health_bp)

    # Standard JSON error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": getattr(error, "description", "Bad request")}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({"error": getattr(error, "description", "Payload too large")}), 413

    @app.errorhandler(500)
    def server_error(error):
        logger.error("Unhandled internal server error: %s", error)
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(503)
    def service_unavailable(error):
        return jsonify({"error": getattr(error, "description", "Service temporarily unavailable")}), 503

    logger.info("SignBridge backend configured with allowed origins: %s", ALLOWED_ORIGINS)
    return app


if __name__ == "__main__":
    app = create_app()
    logger.info("Starting SignBridge backend on http://%s:%s (debug=%s)", HOST, PORT, DEBUG)
    app.run(host=HOST, port=PORT, debug=DEBUG)
