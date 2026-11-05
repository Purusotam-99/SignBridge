"""Routes package registering Flask blueprints."""
from .predict import predict_bp
from .metrics import metrics_bp
from .health import health_bp

__all__ = ["predict_bp", "metrics_bp", "health_bp"]
