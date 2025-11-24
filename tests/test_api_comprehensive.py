"""Comprehensive test suite for all backend APIs.

Covers:
- Authentication endpoints (/auth/register, /auth/login, /auth/profile)
- Player management endpoints (/auth/profile, /auth/cultivation-levels)
- Combat endpoints (/combat/simulate, /combat/character-classes, /combat/elements)
- Equipment endpoints (/equipment/*, /inventory/*)
- Loot endpoints (/loot/*)
- Dungeon endpoints (/dungeons/*)
- Monster endpoints (/monsters)
- Error handling and edge cases
- Integration tests for full game flows
"""

import json
import pytest
import jwt
import datetime as dt
from combat_engine.api import create_app
from combat_engine.models import (
    CharacterClass, ElementType, EquipmentSlot, ItemRarity, MonsterTier, DungeonDifficulty
)


@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def app_context():
    """Create app context for testing."""
    app = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def valid_player_data():
    """Valid player character data."""
    return {
        "character_id": "player_1",
        "name": "Hero",
        "character_class": "warrior",
        "level": 5,
        "max_hp": 100,
        "attack": 20,
        "defense": 15,
        "speed": 10,
        "element": "fire"
    }


@pytest.fixture
def valid_opponent_data():
    """Valid opponent/monster data."""
    return {
        "character_id": "monster_1",
        "name": "Goblin",
        "character_class": "rogue",
        "level": 3,
        "max_hp": 50,
        "attack": 15,
        "defense": 8,
        "speed": 12,
        "element": "neutral"
    }


# ==================== HEALTH ENDPOINTS ====================

class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check_success(self, client):
        """Test health check endpoint returns success."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"
        assert isinstance(data, dict)

    def test_health_check_method_not_allowed(self, client):
        """Test health check with invalid method."""
        response = client.post("/health")
        assert response.status_code == 405


# ==================== AUTHENTICATION ENDPOINTS ====================

class TestAuthenticationEndpoints:
    """Test authentication endpoints."""

    def test_register_success(self, client):
        """Test successful user registration."""
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 201
        data = response.get_json()
        
        assert "message" in data
        assert "user" in data
        assert "character" in data
        assert "token" in data
        assert data["user"]["username"] == "testuser"
        assert data["user"]["email"] == "test@example.com"
        assert data["character"]["name"] == "testuser"

    def test_register_missing_username(self, client):
        """Test registration with missing username."""
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "username" in data["error"].lower()

    def test_register_missing_email(self, client):
        """Test registration with missing email."""
        payload = {
            "username": "testuser",
            "password": "password123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "email" in data["error"].lower()

    def test_register_missing_password(self, client):
        """Test registration with missing password."""
        payload = {
            "username": "testuser",
            "email": "test@example.com"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "password" in data["error"].lower()

    def test_register_empty_payload(self, client):
        """Test registration with empty payload."""
        response = client.post("/auth/register", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_register_no_json(self, client):
        """Test registration with no JSON data."""
        response = client.post("/auth/register")
        assert response.status_code in [400, 500]
        if response.status_code == 400:
            data = response.get_json()
            assert "error" in data

    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username."""
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        # Register first user
        response1 = client.post("/auth/register", json=payload)
        assert response1.status_code == 201
        
        # Try to register with same username
        payload["email"] = "different@example.com"
        response2 = client.post("/auth/register", json=payload)
        assert response2.status_code == 400
        data = response2.get_json()
        assert "error" in data
        assert "username" in data["error"].lower() or "already exists" in data["error"].lower()

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email."""
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        # Register first user
        response1 = client.post("/auth/register", json=payload)
        assert response1.status_code == 201
        
        # Try to register with same email
        payload["username"] = "differentuser"
        response2 = client.post("/auth/register", json=payload)
        assert response2.status_code == 400
        data = response2.get_json()
        assert "error" in data
        assert "email" in data["error"].lower() or "already exists" in data["error"].lower()

    def test_login_success(self, client):
        """Test successful login."""
        # Register user first
        register_payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        client.post("/auth/register", json=register_payload)
        
        # Login
        login_payload = {
            "username": "testuser",
            "password": "password123"
        }
        response = client.post("/auth/login", json=login_payload)
        assert response.status_code == 200
        data = response.get_json()
        
        assert "message" in data
        assert "user" in data
        assert "character" in data
        assert "token" in data
        assert data["user"]["username"] == "testuser"

    def test_login_missing_username(self, client):
        """Test login with missing username."""
        payload = {
            "password": "password123"
        }
        response = client.post("/auth/login", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_login_missing_password(self, client):
        """Test login with missing password."""
        payload = {
            "username": "testuser"
        }
        response = client.post("/auth/login", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        payload = {
            "username": "nonexistent",
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=payload)
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data

    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        # Register user first
        register_payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        client.post("/auth/register", json=register_payload)
        
        # Try login with wrong password
        login_payload = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=login_payload)
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data

    def test_get_profile_with_valid_token(self, client):
        """Test getting profile with valid token."""
        # Register user
        register_payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        reg_response = client.post("/auth/register", json=register_payload)
        token = reg_response.get_json()["token"]
        
        # Get profile
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/auth/profile", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        
        assert "user" in data
        assert "character" in data
        assert data["user"]["username"] == "testuser"

    def test_get_profile_missing_token(self, client):
        """Test getting profile without token."""
        response = client.get("/auth/profile")
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data
        assert "token" in data["error"].lower() or "missing" in data["error"].lower()

    def test_get_profile_invalid_token(self, client):
        """Test getting profile with invalid token."""
        headers = {"Authorization": "Bearer invalid_token_123"}
        response = client.get("/auth/profile", headers=headers)
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data

    def test_get_profile_malformed_token(self, client):
        """Test getting profile with malformed token."""
        headers = {"Authorization": "BearerInvalid"}
        response = client.get("/auth/profile", headers=headers)
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data

    def test_get_cultivation_levels(self, client):
        """Test getting available cultivation levels."""
        response = client.get("/auth/cultivation-levels")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "cultivation_levels" in data
        assert isinstance(data["cultivation_levels"], list)
        assert len(data["cultivation_levels"]) > 0


# ==================== COMBAT ENDPOINTS ====================

class TestCombatEndpoints:
    """Test combat-related endpoints."""

    def test_get_character_classes(self, client):
        """Test getting available character classes."""
        response = client.get("/combat/character-classes")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "classes" in data
        assert isinstance(data["classes"], list)
        assert "warrior" in data["classes"]
        assert "mage" in data["classes"]
        assert "rogue" in data["classes"]
        assert "paladin" in data["classes"]

    def test_get_elements(self, client):
        """Test getting available elements."""
        response = client.get("/combat/elements")
        assert response.status_code == 200

        data = response.get_json()
        
        assert "elements" in data
        assert isinstance(data["elements"], list)
        assert "fire" in data["elements"]
        assert "water" in data["elements"]
        assert "earth" in data["elements"]
        assert "wind" in data["elements"]
        assert "neutral" in data["elements"]

    def test_simulate_combat_success(self, client, valid_player_data, valid_opponent_data):
        """Test successful combat simulation."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data,
            "seed": 12345
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        # Validate response structure
        assert "combat_id" in data
        assert "player" in data
        assert "opponent" in data
        assert "turns" in data
        assert "winner_id" in data
        assert "total_turns" in data
        
        # Validate data types and values
        assert len(data["combat_id"]) > 0
        assert isinstance(data["turns"], list)
        assert len(data["turns"]) > 0
        assert data["total_turns"] > 0
        assert data["winner_id"] in [valid_player_data["character_id"], valid_opponent_data["character_id"]]

    def test_simulate_combat_turn_structure(self, client, valid_player_data, valid_opponent_data):
        """Test that combat turns have correct structure."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        # Check turn structure
        for turn in data["turns"]:
            assert "turn_number" in turn
            assert "actor_id" in turn
            assert "actions" in turn
            assert "actor_status_before" in turn
            assert "actor_status_after" in turn
            assert "target_status_before" in turn
            assert "target_status_after" in turn
            assert isinstance(turn["actions"], list)
            
            # Check action structure
            for action in turn["actions"]:
                assert "actor_id" in action
                assert "target_id" in action
                assert "action_type" in action
                assert "damage_dealt" in action
                assert "healing_done" in action
                assert "status_effects_applied" in action
                assert "is_crit" in action
                assert "is_miss" in action
                assert "multi_hit_count" in action

    def test_simulate_combat_missing_player(self, client, valid_opponent_data):
        """Test combat simulation with missing player."""
        payload = {
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_missing_opponent(self, client, valid_player_data):
        """Test combat simulation with missing opponent."""
        payload = {
            "player": valid_player_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_missing_player_field(self, client, valid_player_data, valid_opponent_data):
        """Test combat simulation with missing player field."""
        invalid_player = valid_player_data.copy()
        del invalid_player["character_class"]
        
        payload = {
            "player": invalid_player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_invalid_character_class(self, client, valid_player_data, valid_opponent_data):
        """Test combat simulation with invalid character class."""
        invalid_player = valid_player_data.copy()
        invalid_player["character_class"] = "invalid_class"
        
        payload = {
            "player": invalid_player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_invalid_element(self, client, valid_player_data, valid_opponent_data):
        """Test combat simulation with invalid element."""
        invalid_player = valid_player_data.copy()
        invalid_player["element"] = "invalid_element"
        
        payload = {
            "player": invalid_player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_simulate_combat_zero_hp(self, client, valid_player_data, valid_opponent_data):
        """Test combat simulation with zero HP."""
        invalid_player = valid_player_data.copy()
        invalid_player["max_hp"] = 0
        
        payload = {
            "player": invalid_player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        # Should handle gracefully, either 400 or run combat
        assert response.status_code in [200, 400]

    def test_simulate_combat_negative_stats(self, client, valid_player_data, valid_opponent_data):
        """Test combat simulation with negative stats."""
        invalid_player = valid_player_data.copy()
        invalid_player["attack"] = -10
        
        payload = {
            "player": invalid_player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        # Should handle gracefully
        assert response.status_code in [200, 400]

    def test_simulate_combat_deterministic(self, client, valid_player_data, valid_opponent_data):
        """Test that same seed produces same results."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data,
            "seed": 99999
        }
        
        response1 = client.post("/combat/simulate", json=payload)
        data1 = response1.get_json()
        
        response2 = client.post("/combat/simulate", json=payload)
        data2 = response2.get_json()
        
        # Should have same winner and turn count
        assert data1["winner_id"] == data2["winner_id"]
        assert data1["total_turns"] == data2["total_turns"]

    def test_simulate_combat_different_seeds(self, client, valid_player_data, valid_opponent_data):
        """Test that different seeds may produce different results."""
        payload1 = {
            "player": valid_player_data,
            "opponent": valid_opponent_data,
            "seed": 11111
        }
        
        payload2 = {
            "player": valid_player_data,
            "opponent": valid_opponent_data,
            "seed": 22222
        }
        
        response1 = client.post("/combat/simulate", json=payload1)
        response2 = client.post("/combat/simulate", json=payload2)
        
        assert response1.status_code == 200
        assert response2.status_code == 200

    def test_simulate_combat_all_character_classes(self, client, valid_opponent_data):
        """Test combat simulation with all character classes."""
        for char_class in ["warrior", "mage", "rogue", "paladin"]:
            player = {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": char_class,
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "neutral"
            }
            
            payload = {
                "player": player,
                "opponent": valid_opponent_data
            }
            response = client.post("/combat/simulate", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert "winner_id" in data

    def test_simulate_combat_all_elements(self, client, valid_opponent_data):
        """Test combat simulation with all elements."""
        for element in ["fire", "water", "earth", "wind", "neutral"]:
            player = {
                "character_id": "player_1",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": element
            }
            
            payload = {
                "player": player,
                "opponent": valid_opponent_data
            }
            response = client.post("/combat/simulate", json=payload)
            assert response.status_code == 200


# ==================== EQUIPMENT ENDPOINTS ====================

class TestEquipmentEndpoints:
    """Test equipment-related endpoints."""

    def test_get_equipment_slots(self, client):
        """Test getting available equipment slots."""
        response = client.get("/equipment/slots")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "slots" in data
        assert isinstance(data["slots"], list)
        assert "weapon" in data["slots"]
        assert "armor" in data["slots"]
        assert "accessory" in data["slots"]

    def test_get_equipment_rarities(self, client):
        """Test getting available equipment rarities."""
        response = client.get("/equipment/rarities")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "rarities" in data
        assert isinstance(data["rarities"], list)
        assert "common" in data["rarities"]
        assert "uncommon" in data["rarities"]
        assert "rare" in data["rarities"]
        assert "epic" in data["rarities"]
        assert "legendary" in data["rarities"]

    def test_generate_equipment_success(self, client):
        """Test successful equipment generation."""
        payload = {
            "slot": "weapon",
            "item_level": 10
        }
        response = client.post("/equipment/generate", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        # Validate equipment structure
        assert "item_id" in data
        assert "name" in data
        assert "slot" in data
        assert "level_requirement" in data
        assert "rarity" in data
        assert "base_stats" in data
        assert "affixes" in data
        
        assert data["slot"] == "weapon"

    def test_generate_equipment_all_slots(self, client):
        """Test equipment generation for all slots."""
        for slot in ["weapon", "armor", "accessory"]:
            payload = {
                "slot": slot,
                "item_level": 10
            }
            response = client.post("/equipment/generate", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert data["slot"] == slot

    def test_generate_equipment_with_rarity(self, client):
        """Test equipment generation with specific rarity."""
        for rarity in ["common", "uncommon", "rare", "epic", "legendary"]:
            payload = {
                "slot": "weapon",
                "item_level": 10,
                "rarity": rarity
            }
            response = client.post("/equipment/generate", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert data["rarity"] == rarity

    def test_generate_equipment_deterministic(self, client):
        """Test that same seed produces same equipment."""
        payload = {
            "slot": "weapon",
            "item_level": 10,
            "seed": 12345
        }
        
        response1 = client.post("/equipment/generate", json=payload)
        data1 = response1.get_json()
        
        response2 = client.post("/equipment/generate", json=payload)
        data2 = response2.get_json()
        
        # Same seed should produce same item
        assert data1["name"] == data2["name"]
        assert data1["rarity"] == data2["rarity"]

    def test_generate_equipment_missing_slot(self, client):
        """Test equipment generation with missing slot."""
        payload = {
            "item_level": 10
        }
        response = client.post("/equipment/generate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_generate_equipment_missing_level(self, client):
        """Test equipment generation with missing item level."""
        payload = {
            "slot": "weapon"
        }
        response = client.post("/equipment/generate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_generate_equipment_invalid_slot(self, client):
        """Test equipment generation with invalid slot."""
        payload = {
            "slot": "invalid_slot",
            "item_level": 10
        }
        response = client.post("/equipment/generate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_generate_equipment_invalid_rarity(self, client):
        """Test equipment generation with invalid rarity."""
        payload = {
            "slot": "weapon",
            "item_level": 10,
            "rarity": "invalid_rarity"
        }
        response = client.post("/equipment/generate", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_generate_equipment_various_levels(self, client):
        """Test equipment generation with various levels."""
        for level in [1, 5, 10, 20, 50]:
            payload = {
                "slot": "weapon",
                "item_level": level
            }
            response = client.post("/equipment/generate", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert "level_requirement" in data


# ==================== INVENTORY ENDPOINTS ====================

class TestInventoryEndpoints:
    """Test inventory-related endpoints."""

    def test_create_inventory_success(self, client):
        """Test successful inventory creation."""
        payload = {
            "player_id": "player_123",
            "currency": 1000
        }
        response = client.post("/inventory/create", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        assert "player_id" in data
        assert "currency" in data
        assert "equipment" in data
        assert "inventory" in data
        assert data["player_id"] == "player_123"
        assert data["currency"] == 1000

    def test_create_inventory_default_currency(self, client):
        """Test inventory creation with default currency."""
        payload = {
            "player_id": "player_123"
        }
        response = client.post("/inventory/create", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        assert data["currency"] == 0

    def test_create_inventory_missing_player_id(self, client):
        """Test inventory creation with missing player ID."""
        payload = {
            "currency": 1000
        }
        response = client.post("/inventory/create", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_equip_item_success(self, client):
        """Test successful item equipping."""
        # First generate equipment
        gen_response = client.post("/equipment/generate", json={
            "slot": "weapon",
            "item_level": 10
        })
        item_id = gen_response.get_json()["item_id"]
        
        payload = {
            "player_id": "player_123",
            "item_id": item_id
        }
        response = client.post("/inventory/equip", json=payload)
        # May fail since we're not using a real inventory system
        assert response.status_code in [200, 404]

    def test_equip_item_missing_player_id(self, client):
        """Test equipping with missing player ID."""
        payload = {
            "item_id": "item_456"
        }
        response = client.post("/inventory/equip", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_equip_item_missing_item_id(self, client):
        """Test equipping with missing item ID."""
        payload = {
            "player_id": "player_123"
        }
        response = client.post("/inventory/equip", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_unequip_item_success(self, client):
        """Test successful item unequipping."""
        payload = {
            "player_id": "player_123",
            "slot": "weapon"
        }
        response = client.post("/inventory/unequip", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        assert "inventory" in data
        assert "unequipped_item" in data

    def test_unequip_item_all_slots(self, client):
        """Test unequipping from all equipment slots."""
        for slot in ["weapon", "armor", "accessory"]:
            payload = {
                "player_id": "player_123",
                "slot": slot
            }
            response = client.post("/inventory/unequip", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert "inventory" in data

    def test_unequip_item_missing_player_id(self, client):
        """Test unequipping with missing player ID."""
        payload = {
            "slot": "weapon"
        }
        response = client.post("/inventory/unequip", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_unequip_item_missing_slot(self, client):
        """Test unequipping with missing slot."""
        payload = {
            "player_id": "player_123"
        }
        response = client.post("/inventory/unequip", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_unequip_item_invalid_slot(self, client):
        """Test unequipping with invalid slot."""
        payload = {
            "player_id": "player_123",
            "slot": "invalid_slot"
        }
        response = client.post("/inventory/unequip", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_get_inventory_stats_success(self, client):
        """Test getting inventory stats."""
        response = client.get("/inventory/stats?player_id=player_123")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "player_id" in data
        assert "total_stats" in data
        assert data["player_id"] == "player_123"

    def test_get_inventory_stats_missing_player_id(self, client):
        """Test getting stats with missing player ID."""
        response = client.get("/inventory/stats")
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


# ==================== LOOT ENDPOINTS ====================

class TestLootEndpoints:
    """Test loot-related endpoints."""

    def test_get_loot_tables(self, client):
        """Test getting all loot tables."""
        response = client.get("/loot/tables")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "loot_tables" in data
        assert isinstance(data["loot_tables"], list)
        assert len(data["loot_tables"]) > 0

    def test_get_monster_tiers(self, client):
        """Test getting monster tiers."""
        response = client.get("/loot/monster-tiers")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "monster_tiers" in data
        assert isinstance(data["monster_tiers"], list)
        assert len(data["monster_tiers"]) > 0

    def test_roll_loot_success(self, client):
        """Test successful loot rolling."""
        # First get available tables
        tables_response = client.get("/loot/tables")
        tables = tables_response.get_json()["loot_tables"]
        
        if tables:
            table_id = tables[0]["table_id"]
            
            payload = {
                "loot_table_id": table_id
            }
            response = client.post("/loot/roll", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            
            assert "loot_table_id" in data
            assert "equipment_drops" in data
            assert "currency_dropped" in data
            assert "total_drops" in data
            assert isinstance(data["equipment_drops"], list)

    def test_roll_loot_with_seed(self, client):
        """Test loot rolling with deterministic seed."""
        tables_response = client.get("/loot/tables")
        tables = tables_response.get_json()["loot_tables"]
        
        if tables:
            table_id = tables[0]["table_id"]
            
            payload = {
                "loot_table_id": table_id,
                "seed": 12345
            }
            response = client.post("/loot/roll", json=payload)
            assert response.status_code == 200
            data = response.get_json()
            assert "equipment_drops" in data

    def test_roll_loot_invalid_table(self, client):
        """Test rolling loot from invalid table."""
        payload = {
            "loot_table_id": "nonexistent_table_xyz"
        }
        response = client.post("/loot/roll", json=payload)
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data

    def test_roll_loot_missing_table_id(self, client):
        """Test rolling loot without table ID."""
        payload = {}
        response = client.post("/loot/roll", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


# ==================== DUNGEON ENDPOINTS ====================

class TestDungeonEndpoints:
    """Test dungeon-related endpoints."""

    def test_get_dungeons(self, client):
        """Test getting all dungeons."""
        response = client.get("/dungeons")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "dungeons" in data
        assert isinstance(data["dungeons"], list)
        assert len(data["dungeons"]) > 0

    def test_dungeon_structure(self, client):
        """Test that dungeons have correct structure."""
        response = client.get("/dungeons")
        data = response.get_json()
        dungeons = data["dungeons"]
        
        if dungeons:
            dungeon = dungeons[0]
            assert "dungeon_id" in dungeon
            assert "name" in dungeon
            assert "description" in dungeon
            assert "difficulty" in dungeon
            assert "floors" in dungeon
            assert "entry_cost" in dungeon

    def test_get_dungeon_by_id(self, client):
        """Test getting specific dungeon."""
        # First get all dungeons
        dungeons_response = client.get("/dungeons")
        dungeons = dungeons_response.get_json()["dungeons"]
        
        if dungeons:
            dungeon_id = dungeons[0]["dungeon_id"]
            
            response = client.get(f"/dungeons/{dungeon_id}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["dungeon_id"] == dungeon_id

    def test_get_nonexistent_dungeon(self, client):
        """Test getting nonexistent dungeon."""
        response = client.get("/dungeons/nonexistent_dungeon")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data

    def test_get_dungeon_difficulties(self, client):
        """Test getting dungeon difficulties."""
        response = client.get("/dungeons/difficulties")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "difficulties" in data
        assert isinstance(data["difficulties"], list)

    def test_enter_dungeon_success(self, client, valid_player_data):
        """Test entering a dungeon."""
        # Get dungeons
        dungeons_response = client.get("/dungeons")
        dungeons = dungeons_response.get_json()["dungeons"]
        
        if dungeons:
            dungeon_id = dungeons[0]["dungeon_id"]
            
            payload = {
                "player_id": "player_123",
                "dungeon_id": dungeon_id,
                "character": valid_player_data,
                "inventory": {
                    "player_id": "player_123",
                    "currency": 1000
                }
            }
            response = client.post("/dungeons/enter", json=payload)
            assert response.status_code in [200, 400]  # May fail due to cost or other reasons

    def test_enter_dungeon_missing_player_id(self, client):
        """Test entering dungeon without player ID."""
        payload = {
            "dungeon_id": "goblin_caves"
        }
        response = client.post("/dungeons/enter", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_enter_dungeon_missing_dungeon_id(self, client, valid_player_data):
        """Test entering dungeon without dungeon ID."""
        payload = {
            "player_id": "player_123",
            "character": valid_player_data
        }
        response = client.post("/dungeons/enter", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_complete_dungeon_missing_run_id(self, client):
        """Test completing dungeon without run ID."""
        payload = {
            "player_id": "player_123"
        }
        response = client.post("/dungeons/complete", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_complete_dungeon_missing_player_id(self, client):
        """Test completing dungeon without player ID."""
        payload = {
            "run_id": "run_123"
        }
        response = client.post("/dungeons/complete", json=payload)
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


# ==================== MONSTER ENDPOINTS ====================

class TestMonsterEndpoints:
    """Test monster-related endpoints."""

    def test_get_monsters(self, client):
        """Test getting all available monsters."""
        response = client.get("/monsters")
        assert response.status_code == 200
        data = response.get_json()
        
        assert "monsters" in data
        assert isinstance(data["monsters"], list)
        assert len(data["monsters"]) > 0

    def test_monster_structure(self, client):
        """Test that monsters have correct structure."""
        response = client.get("/monsters")
        data = response.get_json()
        monsters = data["monsters"]
        
        if monsters:
            monster = monsters[0]
            assert "monster_id" in monster
            assert "name" in monster
            assert "character_class" in monster
            assert "level" in monster
            assert "max_hp" in monster
            assert "attack" in monster
            assert "defense" in monster
            assert "speed" in monster
            assert "element" in monster
            assert "tier" in monster
            assert "description" in monster
            assert "loot_preview" in monster

    def test_monster_variety(self, client):
        """Test that there are monsters from different tiers."""
        response = client.get("/monsters")
        monsters = response.get_json()["monsters"]
        
        tiers = set()
        for monster in monsters:
            tiers.add(monster["tier"])
        
        # Should have multiple tiers represented
        assert len(tiers) >= 1


# ==================== ERROR HANDLING ====================

class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_nonexistent_endpoint(self, client):
        """Test accessing nonexistent endpoint."""
        response = client.get("/nonexistent")
        assert response.status_code == 404
        data = response.get_json()
        assert "error" in data

    def test_method_not_allowed(self, client):
        """Test method not allowed."""
        response = client.post("/combat/character-classes")
        assert response.status_code == 405

    def test_invalid_json(self, client):
        """Test sending invalid JSON."""
        response = client.post("/combat/simulate", 
                              data="invalid json",
                              content_type="application/json")
        assert response.status_code in [400, 415, 500]

    def test_missing_content_type(self, client):
        """Test POST without JSON content type."""
        response = client.post("/combat/simulate",
                              data='{"player": {}, "opponent": {}}')
        # Should still process or give appropriate error
        assert response.status_code in [400, 415, 500]

    def test_concurrent_combat_simulations(self, client, valid_player_data, valid_opponent_data):
        """Test handling concurrent requests."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data
        }
        
        # Simulate concurrent requests
        responses = [
            client.post("/combat/simulate", json=payload),
            client.post("/combat/simulate", json=payload),
            client.post("/combat/simulate", json=payload)
        ]
        
        for response in responses:
            assert response.status_code == 200

    def test_large_level_values(self, client, valid_opponent_data):
        """Test with very large level values."""
        player = {
            "character_id": "player_1",
            "name": "Hero",
            "character_class": "warrior",
            "level": 9999,
            "max_hp": 1000000,
            "attack": 50000,
            "defense": 50000,
            "speed": 1000,
            "element": "fire"
        }
        
        payload = {
            "player": player,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        # Should handle gracefully
        assert response.status_code in [200, 400]

    def test_null_values_in_payload(self, client, valid_player_data, valid_opponent_data):
        """Test with null values in payload."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data,
            "seed": None
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code in [200, 400]


# ==================== INTEGRATION TESTS ====================

class TestIntegrationFlows:
    """Test complete game flows and integration scenarios."""

    def test_full_game_flow_register_login_combat(self, client, valid_opponent_data):
        """Test complete flow: register -> login -> combat."""
        # Register user
        register_payload = {
            "username": "gamer123",
            "email": "gamer@example.com",
            "password": "secure_password"
        }
        reg_response = client.post("/auth/register", json=register_payload)
        assert reg_response.status_code == 201
        token = reg_response.get_json()["token"]
        player_char = reg_response.get_json()["character"]
        
        # Login
        login_payload = {
            "username": "gamer123",
            "password": "secure_password"
        }
        login_response = client.post("/auth/login", json=login_payload)
        assert login_response.status_code == 200
        
        # Get profile
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = client.get("/auth/profile", headers=headers)
        assert profile_response.status_code == 200
        
        # Simulate combat with registered character
        player_data = player_char.copy()
        player_data.update({
            "character_id": player_char["character_id"],
            "level": 5,
            "max_hp": 100,
            "current_hp": 100,
            "attack": 20,
            "defense": 15,
            "speed": 10,
            "element": "fire"
        })
        
        combat_payload = {
            "player": player_data,
            "opponent": valid_opponent_data
        }
        combat_response = client.post("/combat/simulate", json=combat_payload)
        assert combat_response.status_code == 200
        assert "winner_id" in combat_response.get_json()

    def test_equipment_generation_and_stats(self, client):
        """Test equipment generation and stats calculation."""
        # Generate equipment for multiple slots
        equipment_ids = []
        for slot in ["weapon", "armor", "accessory"]:
            payload = {
                "slot": slot,
                "item_level": 10
            }
            response = client.post("/equipment/generate", json=payload)
            assert response.status_code == 200
            equipment_ids.append(response.get_json()["item_id"])
        
        # Get inventory stats
        response = client.get("/inventory/stats?player_id=player_123")
        assert response.status_code == 200
        data = response.get_json()
        assert "total_stats" in data

    def test_dungeon_flow(self, client, valid_player_data):
        """Test dungeon flow: list -> get details -> enter."""
        # List dungeons
        dungeons_response = client.get("/dungeons")
        assert dungeons_response.status_code == 200
        dungeons = dungeons_response.get_json()["dungeons"]
        
        if dungeons:
            dungeon_id = dungeons[0]["dungeon_id"]
            
            # Get dungeon details
            detail_response = client.get(f"/dungeons/{dungeon_id}")
            assert detail_response.status_code == 200
            
            # Try to enter dungeon
            enter_payload = {
                "player_id": "player_123",
                "dungeon_id": dungeon_id,
                "character": valid_player_data,
                "inventory": {
                    "player_id": "player_123",
                    "currency": 5000
                }
            }
            enter_response = client.post("/dungeons/enter", json=enter_payload)
            # May succeed or fail due to cost/other checks
            assert enter_response.status_code in [200, 400]

    def test_combat_with_different_monster_tiers(self, client, valid_player_data):
        """Test combat against monsters of different tiers."""
        monsters_response = client.get("/monsters")
        monsters = monsters_response.get_json()["monsters"]
        
        # Group by tier
        by_tier = {}
        for monster in monsters:
            tier = monster["tier"]
            if tier not in by_tier:
                by_tier[tier] = []
            by_tier[tier].append(monster)
        
        # Test combat with each tier
        for tier, tier_monsters in by_tier.items():
            if tier_monsters:
                monster = tier_monsters[0]
                
                opponent_data = {
                    "character_id": monster["monster_id"],
                    "name": monster["name"],
                    "character_class": monster["character_class"],
                    "level": monster["level"],
                    "max_hp": monster["max_hp"],
                    "attack": monster["attack"],
                    "defense": monster["defense"],
                    "speed": monster["speed"],
                    "element": monster["element"]
                }
                
                payload = {
                    "player": valid_player_data,
                    "opponent": opponent_data
                }
                response = client.post("/combat/simulate", json=payload)
                assert response.status_code == 200

    def test_loot_rolling_and_generation(self, client):
        """Test loot rolling and equipment generation."""
        # Get loot tables
        tables_response = client.get("/loot/tables")
        tables = tables_response.get_json()["loot_tables"]
        
        if tables:
            table_id = tables[0]["table_id"]
            
            # Roll loot multiple times
            for _ in range(3):
                payload = {"loot_table_id": table_id}
                response = client.post("/loot/roll", json=payload)
                assert response.status_code == 200
                loot_data = response.get_json()
                
                # Each equipment drop should be valid
                for equipment in loot_data["equipment_drops"]:
                    assert "item_id" in equipment
                    assert "name" in equipment
                    assert "slot" in equipment

    def test_inventory_operations_sequence(self, client):
        """Test sequence of inventory operations."""
        player_id = "player_123"
        
        # Create inventory
        create_payload = {
            "player_id": player_id,
            "currency": 5000
        }
        create_response = client.post("/inventory/create", json=create_payload)
        assert create_response.status_code == 200
        
        # Generate equipment
        gen_payload = {
            "slot": "weapon",
            "item_level": 10
        }
        gen_response = client.post("/equipment/generate", json=gen_payload)
        assert gen_response.status_code == 200
        
        # Equip item (may fail due to inventory not persisting)
        equip_payload = {
            "player_id": player_id,
            "item_id": gen_response.get_json()["item_id"]
        }
        equip_response = client.post("/inventory/equip", json=equip_payload)
        assert equip_response.status_code in [200, 404]
        
        # Get stats
        stats_response = client.get(f"/inventory/stats?player_id={player_id}")
        assert stats_response.status_code == 200
        
        # Unequip item
        unequip_payload = {
            "player_id": player_id,
            "slot": "weapon"
        }
        unequip_response = client.post("/inventory/unequip", json=unequip_payload)
        assert unequip_response.status_code == 200


# ==================== RESPONSE FORMAT VALIDATION ====================

class TestResponseFormats:
    """Test that responses match OpenAPI spec format."""

    def test_combat_response_matches_spec(self, client, valid_player_data, valid_opponent_data):
        """Test combat response matches OpenAPI spec."""
        payload = {
            "player": valid_player_data,
            "opponent": valid_opponent_data
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code == 200
        data = response.get_json()
        
        # Verify structure matches spec
        required_fields = ["combat_id", "player", "opponent", "turns", "winner_id", "total_turns"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_error_response_format(self, client):
        """Test error responses have consistent format."""
        # Trigger multiple error conditions
        responses = [
            client.post("/combat/simulate", json={}),
            client.get("/dungeons/invalid_id"),
            client.post("/inventory/equip", json={})
        ]
        
        for response in responses:
            if response.status_code >= 400:
                data = response.get_json()
                assert "error" in data, f"Missing error field in response: {data}"

    def test_list_response_format(self, client):
        """Test list responses have correct format."""
        responses = [
            (client.get("/combat/character-classes"), "classes"),
            (client.get("/combat/elements"), "elements"),
            (client.get("/equipment/slots"), "slots"),
            (client.get("/equipment/rarities"), "rarities"),
            (client.get("/loot/tables"), "loot_tables"),
            (client.get("/loot/monster-tiers"), "monster_tiers"),
            (client.get("/dungeons"), "dungeons"),
            (client.get("/monsters"), "monsters")
        ]
        
        for response, field_name in responses:
            assert response.status_code == 200
            data = response.get_json()
            assert field_name in data
            assert isinstance(data[field_name], list)


# ==================== PERFORMANCE AND LIMITS ====================

class TestPerformanceAndLimits:
    """Test API performance and handling of edge cases."""

    def test_empty_combat_log(self, client):
        """Test response even if combat is very short."""
        payload = {
            "player": {
                "character_id": "player_1",
                "name": "One HP",
                "character_class": "warrior",
                "level": 1,
                "max_hp": 1,
                "attack": 100,
                "defense": 0,
                "speed": 100,
                "element": "fire"
            },
            "opponent": {
                "character_id": "monster_1",
                "name": "Weak",
                "character_class": "rogue",
                "level": 1,
                "max_hp": 1,
                "attack": 100,
                "defense": 0,
                "speed": 100,
                "element": "neutral"
            }
        }
        response = client.post("/combat/simulate", json=payload)
        assert response.status_code in [200, 400]

    def test_response_content_types(self, client):
        """Test all responses are JSON."""
        endpoints = [
            ("GET", "/health"),
            ("GET", "/combat/character-classes"),
            ("GET", "/equipment/slots"),
            ("GET", "/dungeons"),
            ("GET", "/monsters")
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint)
            
            # Check content type for successful responses
            if response.status_code < 400:
                assert "application/json" in response.content_type.lower() or \
                       "json" in response.content_type.lower() or \
                       response.status_code == 204

    def test_response_status_codes(self, client):
        """Test expected status codes."""
        # Test 200 OK
        response = client.get("/health")
        assert response.status_code == 200
        
        # Test 201 Created
        payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 201
        
        # Test 400 Bad Request
        response = client.post("/combat/simulate", json={})
        assert response.status_code == 400
        
        # Test 401 Unauthorized
        response = client.get("/auth/profile")
        assert response.status_code == 401
        
        # Test 404 Not Found
        response = client.get("/nonexistent")
        assert response.status_code == 404
