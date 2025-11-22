"""
Minimal Flask API test for debugging
"""

from flask import Flask, jsonify

def create_app():
    """Create and configure Flask app."""
    app = Flask(__name__)
    
    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "ok"}), 200
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)