"""Tests for Flask API endpoints."""
import pytest
from combat_engine.api import create_app


@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"


class TestCharacterClassesEndpoint:
    """Test character classes endpoint."""

    def test_get_character_classes(self, client):
        """Test getting available character classes."""
        response = client.get("/combat/character-classes")
        assert response.status_code == 200
        data = response.get_json()
        assert "classes" in data
        assert "warrior" in data["classes"]
        assert "mage" in data["classes"]
        assert "rogue" in data["classes"]
        assert "paladin" in data["classes"]


class TestElementsEndpoint:
    """Test elements endpoint."""

    def test_get_elements(self, client):
        """Test getting available elements."""
        response = client.get("/combat/elements")
        assert response.status_code == 200
        data = response.get_json()
        assert "elements" in data
        assert "fire" in data["elements"]
        assert "water" in data["elements"]
        assert "earth" in data["elements"]
        assert "wind" in data["elements"]
        assert "neutral" in data["elements"]


class TestSimulateCombatEndpoint:
    """Test combat simulation endpoint."""

    def test_simulate_combat_success(self, client):
        """Test successful combat simulation."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire",
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
                "element": "neutral",
            },
            "seed": 12345,
        }

        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 200
        data = response.get_json()

        assert "combat_id" in data
        assert "player" in data
        assert "opponent" in data
        assert "turns" in data
        assert "winner_id" in data
        assert "total_turns" in data

        # Verify structure
        assert data["player"]["character_id"] == "player_1"
        assert data["opponent"]["character_id"] == "monster_1"
        assert len(data["turns"]) > 0

        # Verify turn structure
        first_turn = data["turns"][0]
        assert "turn_number" in first_turn
        assert "actor_id" in first_turn
        assert "actions" in first_turn
        assert len(first_turn["actions"]) > 0

    def test_simulate_combat_missing_player(self, client):
        """Test combat simulation with missing player."""
        payload = {
            "opponent": {
                "character_id": "monster_1",
                "name": "Goblin",
                "character_class": "rogue",
                "level": 3,
                "max_hp": 50,
                "attack": 15,
                "defense": 8,
                "speed": 12,
                "element": "neutral",
            }
        }

        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_missing_opponent(self, client):
        """Test combat simulation with missing opponent."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire",
            }
        }

        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_invalid_character_class(self, client):
        """Test combat simulation with invalid character class."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "invalid_class",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire",
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
                "element": "neutral",
            },
        }

        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400

    def test_simulate_combat_missing_required_field(self, client):
        """Test combat simulation with missing required field."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                # Missing 'level'
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire",
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
                "element": "neutral",
            },
        }

        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400

    def test_simulate_combat_deterministic(self, client):
        """Test that same seed produces same results."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire",
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
                "element": "neutral",
            },
            "seed": 99999,
        }

        response1 = client.post("/combat/simulate", json=payload)
        data1 = response1.get_json()

        response2 = client.post("/combat/simulate", json=payload)
        data2 = response2.get_json()

        # Both should have same winner and turn count
        assert data1["winner_id"] == data2["winner_id"]
        assert data1["total_turns"] == data2["total_turns"]


class TestNotFound:
    """Test 404 handling."""

    def test_nonexistent_endpoint(self, client):
        """Test accessing nonexistent endpoint."""
        response = client.get("/nonexistent")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data
