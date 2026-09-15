from flask import Flask
from flask_cors import CORS
from routes.overview_routes import overview_bp
from routes.fia_routes import fia_bp
from routes.circuit_routes import circuit_bp
from routes.telemetry_routes import telemetry_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register modular feature blueprints
    app.register_blueprint(overview_bp)
    app.register_blueprint(fia_bp)
    app.register_blueprint(circuit_bp)
    app.register_blueprint(telemetry_bp)

    @app.route('/')
    def home():
        return 'ApexData FastF1 Telemetry & Weekend Intelligence Engine Active.'

    return app

app = create_app()

if __name__ == '__main__':
    app.config['JSON_SORT_KEYS'] = False
    app.run(debug=True, port=5000, threaded=True)
