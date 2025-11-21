"""
Flask API for combat simulation service.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any

from .models import Character, CharacterClass, ElementType
from .engine import CombatSimulator


def create_app() -> Flask:
    """Create and configure Flask app."""
    app = Flask(__name__)
    CORS(app)

    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "ok"}), 200

    @app.route("/combat/simulate", methods=["POST"])
    def simulate_combat():
        """
        Simulate a combat between player and opponent.

        Expected request body:
        {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire"
            },
            "opponent": {
                "character_id": "monster_1",
                "name": "Goblin",
                "character_class": "rogue",
                "level": 3,
                "max_hp": 50,
                "attack": 15,
                "defense": 8,
                "speed": 12,
                "element": "neutral"
            },
            "seed": 12345  // optional for deterministic testing
        }

        Returns:
        {
            "combat_id": "uuid",
            "player": { ... },
            "opponent": { ... },
            "turns": [
                {
                    "turn_number": 1,
                    "actor_id": "player_1",
                    "actions": [
                        {
                            "actor_id": "player_1",
                            "target_id": "monster_1",
                            "action_type": "attack",
                            "damage_dealt": 25,
                            "healing_done": 0,
                            "status_effects_applied": [],
                            "is_crit": false,
                            "is_miss": false,
                            "is_stun": false,
                            "multi_hit_count": 1
                        }
                    ],
                    "actor_status_before": { ... },
                    "actor_status_after": { ... },
                    "target_status_before": { ... },
                    "target_status_after": { ... }
                }
            ],
            "winner_id": "player_1",
            "total_turns": 5
        }
        """
        try:
            data = request.get_json()

            if not data or "player" not in data or "opponent" not in data:
                return (
                    jsonify(
                        {
                            "error": "Invalid request. Must include 'player' and 'opponent' objects."
                        }
                    ),
                    400,
                )

            # Parse player and opponent
            player = _parse_character(data["player"])
            opponent = _parse_character(data["opponent"])

            if not player or not opponent:
                return jsonify({"error": "Invalid character data."}), 400

            # Get optional seed for deterministic simulation
            seed = data.get("seed", None)

            # Run simulation
            simulator = CombatSimulator(seed=seed)
            combat_log = simulator.simulate_combat(player, opponent)

            # Return combat log as JSON
            return jsonify(combat_log.to_dict()), 200

        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    def _parse_character(data: Dict[str, Any]) -> Character:
        """Parse character data from request."""
        required_fields = [
            "character_id",
            "name",
            "character_class",
            "level",
            "max_hp",
            "attack",
            "defense",
            "speed",
            "element",
        ]

        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        character_class = CharacterClass(data["character_class"])
        element = ElementType(data["element"])

        character = Character(
            character_id=data["character_id"],
            name=data["name"],
            character_class=character_class,
            level=data["level"],
            max_hp=data["max_hp"],
            current_hp=data.get("current_hp", data["max_hp"]),
            attack=data["attack"],
            defense=data["defense"],
            speed=data["speed"],
            element=element,
        )

        return character

    @app.route("/combat/character-classes", methods=["GET"])
    def get_character_classes():
        """Get available character classes."""
        return jsonify({"classes": [c.value for c in CharacterClass]}), 200

    @app.route("/combat/elements", methods=["GET"])
    def get_elements():
        """Get available elements."""
        return jsonify({"elements": [e.value for e in ElementType]}), 200

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        """Handle 500 errors."""
        return jsonify({"error": "Internal server error"}), 500

    return app
