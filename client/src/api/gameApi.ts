import { Player, CreatePlayerRequest, BattleResult, Monster, Dungeon } from 'xianxia-shared';

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class GameApi {
  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Players
  async createPlayer(username: string, email?: string): Promise<Player> {
    const response = await fetch(`${API_BASE_URL}/api/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email } as CreatePlayerRequest),
    });

    const data: ApiResponse<Player> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to create player');
    return data.data!;
  }

  async getPlayers(): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/api/players`);
    const data: ApiResponse<Player[]> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch players');
    return data.data || [];
  }

  async getPlayer(playerId: string): Promise<Player> {
    const players = await this.getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    return player;
  }

  // Stats
  async getPlayerStats(playerId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/stats`);
    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch player stats');
    return data.data;
  }

  // Combat
  async fightMonster(playerId: string, monsterId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/battle/${monsterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.error || 'Battle failed');
    return data.data;
  }

  // Equipment
  async equipItem(playerId: string, equipmentId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentId }),
    });

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to equip item');
    return data.data;
  }

  // Monsters
  async getMonsters(): Promise<Monster[]> {
    const response = await fetch(`${API_BASE_URL}/api/monsters`);
    const data: ApiResponse<Monster[]> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch monsters');
    return data.data || [];
  }

  async getMonster(monsterId: string): Promise<Monster> {
    const response = await fetch(`${API_BASE_URL}/api/monsters/${monsterId}`);
    const data: ApiResponse<Monster> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch monster');
    return data.data!;
  }

  // Dungeons
  async getDungeons(): Promise<Dungeon[]> {
    const response = await fetch(`${API_BASE_URL}/api/dungeons`);
    const data: ApiResponse<Dungeon[]> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch dungeons');
    return data.data || [];
  }

  async getDungeon(dungeonId: string): Promise<Dungeon> {
    const response = await fetch(`${API_BASE_URL}/api/dungeons/${dungeonId}`);
    const data: ApiResponse<Dungeon> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch dungeon');
    return data.data!;
  }

  async enterDungeon(playerId: string, dungeonId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/dungeons/${dungeonId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to enter dungeon');
    return data.data;
  }

  async completeDungeon(playerId: string, dungeonId: string, timeSpent: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/dungeons/${dungeonId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpent }),
    });

    const data: ApiResponse<any> = await response.json();
    if (!data.success) throw new Error(data.error || 'Failed to complete dungeon');
    return data.data;
  }
}

export const gameApi = new GameApi();
