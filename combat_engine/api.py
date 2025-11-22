"""
Flask API for combat simulation service.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any
import jwt
import datetime as dt
from functools import wraps

from .models import (
    Character, CharacterClass, ElementType,
    EquipmentSlot, ItemRarity, MonsterTier, DungeonDifficulty,
    PlayerInventory, Equipment, Dungeon, DungeonRun,
    User, PlayerCharacter, CultivationLevel
)
from .engine import CombatSimulator
from .equipment import EquipmentGenerator, InventoryManager
from .loot import LootRoller, LootTableManager
from .dungeon import DungeonManager, DailyResetScheduler


def create_app() -> Flask:
    """Create and configure Flask app."""
    app = Flask(__name__)
    CORS(app)
    
    # Secret key for JWT
    app.config['SECRET_KEY'] = 'xianxia_combat_engine_secret_key_2024'
    
    # Initialize managers and storage
    dungeon_manager = DungeonManager()
    loot_tables = {}
    
    # In-memory user storage (in production, use a database)
    users = {}
    player_characters = {}
    
    # Create default loot tables
    for tier in MonsterTier:
        table_id = f"default_{tier.value}"
        loot_tables[table_id] = LootTableManager.create_default_loot_table(tier, table_id)

    def token_required(f):
        """Decorator to require JWT token for endpoints."""
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({"error": "Token is missing"}), 401
            
            try:
                # Remove 'Bearer ' prefix if present
                if token.startswith('Bearer '):
                    token = token[7:]
                
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                current_user_id = data['user_id']
                
                # Verify user exists
                if current_user_id not in users:
                    return jsonify({"error": "Invalid token - user not found"}), 401
                    
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token has expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Token is invalid"}), 401
            
            return f(current_user_id, *args, **kwargs)
        return decorated

    @app.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return jsonify({"status": "ok"}), 200

    # Authentication endpoints
    @app.route("/auth/register", methods=["POST"])
    def register():
        """
        Register a new user.
        
        Expected request body:
        {
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123"
        }
        """
        try:
            data = request.get_json()
            
            if not data or not all(k in data for k in ["username", "email", "password"]):
                return jsonify({"error": "Missing required fields: username, email, password"}), 400
            
            username = data["username"]
            email = data["email"]
            password = data["password"]
            
            # Check if user already exists
            for user in users.values():
                if user.username == username:
                    return jsonify({"error": "Username already exists"}), 400
                if user.email == email:
                    return jsonify({"error": "Email already exists"}), 400
            
            # Create new user
            user = User(
                username=username,
                email=email,
                password_hash=User.hash_password(password)
            )
            
            users[user.user_id] = user
            
            # Create initial character for the user
            character = PlayerCharacter(
                user_id=user.user_id,
                name=username,
                character_class=CharacterClass.WARRIOR,
                level=1,
                max_hp=100,
                current_hp=100,
                attack=20,
                defense=15,
                speed=10,
                element=ElementType.NEUTRAL
            )
            
            player_characters[character.character_id] = character
            
            # Generate token
            token = jwt.encode({
                'user_id': user.user_id,
                'exp': dt.datetime.utcnow() + dt.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                "message": "User registered successfully",
                "user": user.to_dict(),
                "character": character.to_dict(),
                "token": token
            }), 201
            
        except Exception as e:
            return jsonify({"error": f"Registration failed: {str(e)}"}), 500

    @app.route("/auth/login", methods=["POST"])
    def login():
        """
        Login user and return JWT token.
        
        Expected request body:
        {
            "username": "testuser",
            "password": "password123"
        }
        """
        try:
            data = request.get_json()
            
            if not data or not all(k in data for k in ["username", "password"]):
                return jsonify({"error": "Missing required fields: username, password"}), 400
            
            username = data["username"]
            password = data["password"]
            
            # Find user by username
            user = None
            for u in users.values():
                if u.username == username:
                    user = u
                    break
            
            if not user or not user.verify_password(password):
                return jsonify({"error": "Invalid username or password"}), 401
            
            # Update last login
            user.last_login = dt.datetime.now()
            
            # Get user's character
            character = None
            for char in player_characters.values():
                if char.user_id == user.user_id:
                    character = char
                    break
            
            # Generate token
            token = jwt.encode({
                'user_id': user.user_id,
                'exp': dt.datetime.utcnow() + dt.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                "message": "Login successful",
                "user": user.to_dict(),
                "character": character.to_dict() if character else None,
                "token": token
            }), 200
            
        except Exception as e:
            return jsonify({"error": f"Login failed: {str(e)}"}), 500

    @app.route("/auth/profile", methods=["GET"])
    @token_required
    def get_profile(current_user_id):
        """Get current user profile."""
        try:
            user = users.get(current_user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            # Get user's character
            character = None
            for char in player_characters.values():
                if char.user_id == user.user_id:
                    character = char
                    break
            
            return jsonify({
                "user": user.to_dict(),
                "character": character.to_dict() if character else None
            }), 200
            
        except Exception as e:
            return jsonify({"error": f"Failed to get profile: {str(e)}"}), 500

    @app.route("/auth/cultivation-levels", methods=["GET"])
    def get_cultivation_levels():
        """Get available cultivation levels."""
        return jsonify({
            "cultivation_levels": [level.value for level in CultivationLevel]
        }), 200

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

    # Equipment endpoints
    @app.route("/equipment/generate", methods=["POST"])
    def generate_equipment():
        """
        Generate random equipment.
        
        Expected request body:
        {
            "slot": "weapon|armor|accessory",
            "item_level": 10,
            "rarity": "common|uncommon|rare|epic|legendary",  // optional
            "seed": 12345  // optional for deterministic generation
        }
        """
        try:
            data = request.get_json()
            
            if not data or "slot" not in data or "item_level" not in data:
                return jsonify({"error": "Missing required fields: slot, item_level"}), 400
            
            slot = EquipmentSlot(data["slot"])
            item_level = data["item_level"]
            rarity = None
            if "rarity" in data:
                rarity = ItemRarity(data["rarity"])
            seed = data.get("seed", None)
            
            equipment = EquipmentGenerator.generate_equipment(
                slot=slot,
                item_level=item_level,
                rarity=rarity,
                seed=seed
            )
            
            return jsonify(equipment.to_dict()), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/equipment/slots", methods=["GET"])
    def get_equipment_slots():
        """Get available equipment slots."""
        return jsonify({"slots": [s.value for s in EquipmentSlot]}), 200

    @app.route("/equipment/rarities", methods=["GET"])
    def get_equipment_rarities():
        """Get available equipment rarities."""
        return jsonify({"rarities": [r.value for r in ItemRarity]}), 200

    # Inventory endpoints
    @app.route("/inventory/create", methods=["POST"])
    def create_inventory():
        """
        Create a new player inventory.
        
        Expected request body:
        {
            "player_id": "player_123",
            "currency": 1000  // optional, defaults to 0
        }
        """
        try:
            data = request.get_json()
            
            if not data or "player_id" not in data:
                return jsonify({"error": "Missing required field: player_id"}), 400
            
            inventory = PlayerInventory(
                player_id=data["player_id"],
                currency=data.get("currency", 0)
            )
            
            # Initialize equipment slots
            for slot in EquipmentSlot:
                inventory.equipment[slot] = None
            
            return jsonify(inventory.to_dict()), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/inventory/equip", methods=["POST"])
    def equip_item():
        """
        Equip an item from inventory.
        
        Expected request body:
        {
            "player_id": "player_123",
            "item_id": "item_456"
        }
        """
        try:
            data = request.get_json()
            
            if not data or "player_id" not in data or "item_id" not in data:
                return jsonify({"error": "Missing required fields: player_id, item_id"}), 400
            
            # This would typically fetch from database
            # For demo, we'll create a mock inventory
            inventory = PlayerInventory(player_id=data["player_id"])
            
            # Add mock item to inventory for demo
            mock_item = EquipmentGenerator.generate_equipment(
                slot=EquipmentSlot.WEAPON,
                item_level=10
            )
            inventory.inventory.append(mock_item)
            
            # Equip the item
            previous_item = InventoryManager.equip_item(inventory, data["item_id"])
            
            if previous_item is None and mock_item.item_id != data["item_id"]:
                return jsonify({"error": "Item not found in inventory"}), 404
            
            # Return previously equipped item (if any) back to inventory
            if previous_item:
                inventory.inventory.append(previous_item)
            
            return jsonify({
                "inventory": inventory.to_dict(),
                "previous_item": previous_item.to_dict() if previous_item else None
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/inventory/unequip", methods=["POST"])
    def unequip_item():
        """
        Unequip an item and return it to inventory.
        
        Expected request body:
        {
            "player_id": "player_123",
            "slot": "weapon|armor|accessory"
        }
        """
        try:
            data = request.get_json()
            
            if not data or "player_id" not in data or "slot" not in data:
                return jsonify({"error": "Missing required fields: player_id, slot"}), 400
            
            slot = EquipmentSlot(data["slot"])
            
            # Mock inventory with equipped item
            inventory = PlayerInventory(player_id=data["player_id"])
            mock_item = EquipmentGenerator.generate_equipment(
                slot=slot,
                item_level=10
            )
            inventory.equipment[slot] = mock_item
            
            # Unequip the item
            unequipped_item = InventoryManager.unequip_item(inventory, slot)
            
            return jsonify({
                "inventory": inventory.to_dict(),
                "unequipped_item": unequipped_item.to_dict() if unequipped_item else None
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/inventory/stats", methods=["GET"])
    def get_inventory_stats():
        """
        Get total stats from equipped items.
        
        Query parameters:
        - player_id: Player ID
        """
        try:
            player_id = request.args.get("player_id")
            if not player_id:
                return jsonify({"error": "Missing required query parameter: player_id"}), 400
            
            # Mock inventory with equipped items
            inventory = PlayerInventory(player_id=player_id)
            
            # Add some mock equipment
            for slot in EquipmentSlot:
                item = EquipmentGenerator.generate_equipment(
                    slot=slot,
                    item_level=10
                )
                inventory.equipment[slot] = item
            
            total_stats = InventoryManager.calculate_total_stats(inventory)
            
            return jsonify({
                "player_id": player_id,
                "total_stats": total_stats
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    # Loot endpoints
    @app.route("/loot/roll", methods=["POST"])
    def roll_loot():
        """
        Roll for loot from a loot table.
        
        Expected request body:
        {
            "loot_table_id": "default_tier_1",
            "seed": 12345  // optional for deterministic rolling
        }
        """
        try:
            data = request.get_json()
            
            if not data or "loot_table_id" not in data:
                return jsonify({"error": "Missing required field: loot_table_id"}), 400
            
            loot_table_id = data["loot_table_id"]
            loot_table = loot_tables.get(loot_table_id)
            
            if not loot_table:
                return jsonify({"error": f"Loot table not found: {loot_table_id}"}), 404
            
            seed = data.get("seed", None)
            equipment_drops, currency_dropped = LootRoller.roll_loot(loot_table, seed)
            
            return jsonify({
                "loot_table_id": loot_table_id,
                "equipment_drops": [item.to_dict() for item in equipment_drops],
                "currency_dropped": currency_dropped,
                "total_drops": len(equipment_drops)
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/loot/tables", methods=["GET"])
    def get_loot_tables():
        """Get all available loot tables."""
        return jsonify({
            "loot_tables": [table.to_dict() for table in loot_tables.values()]
        }), 200

    @app.route("/loot/monster-tiers", methods=["GET"])
    def get_monster_tiers():
        """Get available monster tiers."""
        return jsonify({"monster_tiers": [t.value for t in MonsterTier]}), 200

    # Dungeon endpoints
    @app.route("/dungeons", methods=["GET"])
    def get_dungeons():
        """Get all available dungeons."""
        return jsonify({
            "dungeons": [dungeon.to_dict() for dungeon in dungeon_manager.list_dungeons()]
        }), 200

    @app.route("/dungeons/<dungeon_id>", methods=["GET"])
    def get_dungeon(dungeon_id):
        """Get specific dungeon information."""
        dungeon = dungeon_manager.get_dungeon(dungeon_id)
        if not dungeon:
            return jsonify({"error": "Dungeon not found"}), 404
        
        return jsonify(dungeon.to_dict()), 200

    @app.route("/dungeons/enter", methods=["POST"])
    def enter_dungeon():
        """
        Enter a dungeon and start a run.
        
        Expected request body:
        {
            "player_id": "player_123",
            "dungeon_id": "goblin_caves",
            "character": {
                "character_id": "char_456",
                "name": "Hero",
                "character_class": "warrior",
                "level": 5,
                "max_hp": 100,
                "attack": 20,
                "defense": 15,
                "speed": 10,
                "element": "fire"
            },
            "inventory": {
                "player_id": "player_123",
                "currency": 1000,
                "equipment": {},
                "inventory": []
            }
        }
        """
        try:
            data = request.get_json()
            
            if not data or "player_id" not in data or "dungeon_id" not in data:
                return jsonify({"error": "Missing required fields: player_id, dungeon_id"}), 400
            
            # Parse character
            character_data = data.get("character", {})
            character = _parse_character(character_data)
            
            # Parse inventory
            inventory_data = data.get("inventory", {})
            inventory = PlayerInventory(
                player_id=inventory_data.get("player_id", data["player_id"]),
                currency=inventory_data.get("currency", 0)
            )
            
            # Start dungeon run
            run, message = dungeon_manager.start_dungeon_run(
                data["player_id"],
                data["dungeon_id"],
                character,
                inventory,
                loot_tables
            )
            
            if not run:
                return jsonify({"error": message}), 400
            
            return jsonify({
                "run": run.to_dict(),
                "message": message,
                "inventory": inventory.to_dict()
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/dungeons/complete", methods=["POST"])
    def complete_dungeon():
        """
        Complete a dungeon run.
        
        Expected request body:
        {
            "run_id": "run_789",
            "player_id": "player_123",
            "inventory": {
                "player_id": "player_123",
                "currency": 1000,
                "equipment": {},
                "inventory": []
            },
            "floors_completed": 5  // optional, defaults to all floors
        }
        """
        try:
            data = request.get_json()
            
            if not data or "run_id" not in data or "player_id" not in data:
                return jsonify({"error": "Missing required fields: run_id, player_id"}), 400
            
            # Parse inventory
            inventory_data = data.get("inventory", {})
            inventory = PlayerInventory(
                player_id=inventory_data.get("player_id", data["player_id"]),
                currency=inventory_data.get("currency", 0)
            )
            
            # Complete dungeon run
            run, message = dungeon_manager.complete_dungeon_run(
                data["run_id"],
                inventory,
                loot_tables,
                data.get("floors_completed")
            )
            
            if not run:
                return jsonify({"error": message}), 400
            
            return jsonify({
                "run": run.to_dict(),
                "message": message,
                "inventory": inventory.to_dict()
            }), 200
            
        except ValueError as e:
            return jsonify({"error": f"Invalid input: {str(e)}"}), 400
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

    @app.route("/dungeons/difficulties", methods=["GET"])
    def get_dungeon_difficulties():
        """Get available dungeon difficulties."""
        return jsonify({"difficulties": [d.value for d in DungeonDifficulty]}), 200

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(error):
        """Handle 500 errors."""
        return jsonify({"error": "Internal server error"}), 500

    return app
