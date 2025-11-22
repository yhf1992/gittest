import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { equipmentService, inventoryService } from '../services/api';
import './EquipmentManager.css';

const SLOT_CONFIG = [
  { key: 'head', label: 'Head', icon: '👑', apiSlot: 'armor' },
  { key: 'shoulder', label: 'Shoulder', icon: '🛡️', apiSlot: 'armor' },
  { key: 'body', label: 'Body', icon: '🥋', apiSlot: 'armor' },
  { key: 'hands', label: 'Hands', icon: '🪬', apiSlot: 'armor' },
  { key: 'waist', label: 'Waist', icon: '🧵', apiSlot: 'armor' },
  { key: 'legs', label: 'Legs', icon: '🦿', apiSlot: 'armor' },
  { key: 'feet', label: 'Feet', icon: '🥾', apiSlot: 'armor' },
  { key: 'weapon', label: 'Weapon', icon: '⚔️', apiSlot: 'weapon' },
  { key: 'magic', label: 'Magic Item', icon: '🔮', apiSlot: 'accessory' },
  { key: 'ring1', label: 'Ring I', icon: '💍', apiSlot: 'accessory' },
  { key: 'ring2', label: 'Ring II', icon: '💍', apiSlot: 'accessory' },
];

const RARITY_COLORS = {
  common: '#7f8c8d',
  uncommon: '#27ae60',
  rare: '#3498db',
  epic: '#9b59b6',
  legendary: '#f39c12',
};

const RARITY_ORDER = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

const SORT_OPTIONS = [
  { value: 'power', label: 'Power Score' },
  { value: 'attack', label: 'Attack' },
  { value: 'defense', label: 'Defense' },
  { value: 'hp', label: 'HP' },
  { value: 'speed', label: 'Speed' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'stun', label: 'Stun %' },
  { value: 'dot', label: 'DoT Damage' },
];

const buildEmptySlots = () =>
  SLOT_CONFIG.reduce((acc, slot) => {
    acc[slot.key] = null;
    return acc;
  }, {});

const formatAffixLabel = (affix) => {
  if (!affix) {
    return '';
  }

  const labels = {
    attack_bonus: 'ATK',
    defense_bonus: 'DEF',
    hp_bonus: 'HP',
    speed_bonus: 'SPD',
    crit_chance: 'CRIT',
    elemental_damage: 'Element',
    lifesteal: 'Lifesteal',
    proc_damage: 'Proc',
  };

  const prefix = labels[affix.affix_type] || affix.affix_type.replace(/_/g, ' ');
  const suffix = affix.affix_type === 'crit_chance' ? '%' : '';
  return `${prefix} +${affix.value}${suffix}`;
};

const deriveSpecialEffects = (payload) => {
  const baseStats = payload?.base_stats || {};
  const affixes = payload?.affixes || [];
  const specialProc = (payload?.special_proc || '').toLowerCase();

  const effects = {
    stunChance: 0,
    dotDamage: 0,
    defenseBreak: 0,
    multiHitChance: 0,
  };

  const attack = baseStats.attack || 0;
  const speed = baseStats.speed || 0;

  if (specialProc) {
    if (specialProc.includes('stun')) {
      effects.stunChance = Math.max(effects.stunChance, 10 + Math.round(speed * 0.4));
    }
    if (
      specialProc.includes('fire') ||
      specialProc.includes('burn') ||
      specialProc.includes('poison') ||
      specialProc.includes('damage over time') ||
      specialProc.includes('bleed')
    ) {
      effects.dotDamage = Math.max(effects.dotDamage, 8 + Math.round(attack * 0.5));
    }
    if (
      specialProc.includes('double') ||
      specialProc.includes('multi') ||
      specialProc.includes('combo') ||
      specialProc.includes('two hits')
    ) {
      effects.multiHitChance = Math.max(effects.multiHitChance, 12 + Math.round(speed * 0.6));
    }
    if (
      specialProc.includes('armor') ||
      specialProc.includes('shred') ||
      specialProc.includes('pierce') ||
      specialProc.includes('rupture')
    ) {
      effects.defenseBreak = Math.max(effects.defenseBreak, 10 + Math.round(attack * 0.35));
    }
  }

  affixes.forEach((affix) => {
    switch (affix.affix_type) {
      case 'proc_damage':
        effects.dotDamage = Math.max(effects.dotDamage, affix.value);
        break;
      case 'elemental_damage':
        effects.dotDamage = Math.max(effects.dotDamage, Math.round(affix.value * 0.8));
        break;
      case 'defense_bonus':
        effects.defenseBreak = Math.max(effects.defenseBreak, Math.round(affix.value * 0.25));
        break;
      case 'speed_bonus':
        effects.multiHitChance = Math.max(effects.multiHitChance, Math.round(affix.value * 0.7));
        break;
      case 'attack_bonus':
        effects.multiHitChance = Math.max(effects.multiHitChance, Math.round(affix.value * 0.3));
        effects.defenseBreak = Math.max(effects.defenseBreak, Math.round(affix.value * 0.2));
        break;
      default:
        break;
    }
  });

  return {
    stunChance: Math.round(effects.stunChance),
    dotDamage: Math.round(effects.dotDamage),
    defenseBreak: Math.round(effects.defenseBreak),
    multiHitChance: Math.round(effects.multiHitChance),
  };
};

const formatEquipment = (payload, slotKey) => {
  if (!payload) {
    return null;
  }

  const slotMeta = SLOT_CONFIG.find((slot) => slot.key === slotKey);
  return {
    id: payload.item_id,
    name: payload.name,
    slotKey,
    slotLabel: slotMeta?.label || slotKey,
    slotIcon: slotMeta?.icon || '⚔️',
    rarity: (payload.rarity || '').toLowerCase(),
    level: payload.level_requirement,
    baseStats: payload.base_stats || {},
    affixes: payload.affixes || [],
    specialProc: payload.special_proc,
    specialEffects: deriveSpecialEffects(payload),
  };
};

const getItemStatScore = (item, focus = 'power') => {
  if (!item) {
    return 0;
  }

  const base = { attack: 0, defense: 0, hp: 0, speed: 0 };
  Object.entries(item.baseStats || {}).forEach(([stat, value]) => {
    if (base[stat] !== undefined) {
      base[stat] += value;
    }
  });

  (item.affixes || []).forEach((affix) => {
    if (affix.affix_type === 'attack_bonus') base.attack += affix.value;
    if (affix.affix_type === 'defense_bonus') base.defense += affix.value;
    if (affix.affix_type === 'hp_bonus') base.hp += affix.value;
    if (affix.affix_type === 'speed_bonus') base.speed += affix.value;
  });

  const effects = item.specialEffects || {};

  switch (focus) {
    case 'attack':
      return base.attack;
    case 'defense':
      return base.defense;
    case 'hp':
      return base.hp;
    case 'speed':
      return base.speed;
    case 'rarity':
      return RARITY_ORDER[item.rarity] || 0;
    case 'stun':
      return effects.stunChance || 0;
    case 'dot':
      return effects.dotDamage || 0;
    default:
      return (
        base.attack * 1.3 +
        base.defense +
        base.hp * 0.5 +
        base.speed * 1.1 +
        (effects.multiHitChance || 0) +
        (effects.defenseBreak || 0) * 0.4
      );
  }
};

const summarizeStats = (equippedMap) => {
  const totals = {
    attack: 0,
    defense: 0,
    hp: 0,
    speed: 0,
    critChance: 0,
    lifesteal: 0,
    stunChance: 0,
    dotDamage: 0,
    defenseBreak: 0,
    multiHitChance: 0,
  };

  Object.values(equippedMap).forEach((item) => {
    if (!item) {
      return;
    }

    Object.entries(item.baseStats || {}).forEach(([stat, value]) => {
      if (stat === 'attack') totals.attack += value;
      if (stat === 'defense') totals.defense += value;
      if (stat === 'hp') totals.hp += value;
      if (stat === 'speed') totals.speed += value;
    });

    (item.affixes || []).forEach((affix) => {
      if (affix.affix_type === 'attack_bonus') totals.attack += affix.value;
      if (affix.affix_type === 'defense_bonus') totals.defense += affix.value;
      if (affix.affix_type === 'hp_bonus') totals.hp += affix.value;
      if (affix.affix_type === 'speed_bonus') totals.speed += affix.value;
      if (affix.affix_type === 'crit_chance') totals.critChance += affix.value;
      if (affix.affix_type === 'lifesteal') totals.lifesteal += affix.value;
    });

    if (item.specialEffects) {
      totals.stunChance += item.specialEffects.stunChance || 0;
      totals.dotDamage += item.specialEffects.dotDamage || 0;
      totals.defenseBreak += item.specialEffects.defenseBreak || 0;
      totals.multiHitChance += item.specialEffects.multiHitChance || 0;
    }
  });

  return totals;
};

const EquipmentManager = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const playerId = user?.user_id || user?.id || 'demo-player';

  const [equippedSlots, setEquippedSlots] = useState(buildEmptySlots);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [slotFilter, setSlotFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [statSort, setStatSort] = useState('power');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingItemId, setPendingItemId] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const inventoryRef = useRef(null);

  const scrollToInventory = useCallback(() => {
    if (inventoryRef.current) {
      inventoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const focusSlotInInventory = useCallback(
    (slotKey) => {
      setSlotFilter(slotKey);
      scrollToInventory();
    },
    [scrollToInventory]
  );

  const generateSlotItems = useCallback(async (slotMeta) => {
    const attempts = [0, 1];
    const items = await Promise.all(
      attempts.map(async (idx) => {
        const itemLevel = 8 + Math.floor(Math.random() * 6) + idx * 3;
        const rarityBias = Math.random() > 0.7 ? ['rare', 'epic', 'legendary'][Math.floor(Math.random() * 3)] : undefined;
        try {
          const payload = await equipmentService.generate(slotMeta.apiSlot, itemLevel, rarityBias);
          return formatEquipment(payload, slotMeta.key);
        } catch (err) {
          console.error('Failed to generate equipment', err);
          return null;
        }
      })
    );

    return items.filter(Boolean);
  }, []);

  const initializeLoad = useCallback(async () => {
    if (!playerId) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await inventoryService.create(playerId);

      const generated = (
        await Promise.all(SLOT_CONFIG.map((slot) => generateSlotItems(slot)))
      ).flat();

      const grouped = SLOT_CONFIG.reduce((acc, slot) => {
        acc[slot.key] = [];
        return acc;
      }, {});

      generated.forEach((item) => {
        if (item) {
          grouped[item.slotKey].push(item);
        }
      });

      const slotMap = buildEmptySlots();
      const leftovers = [];

      SLOT_CONFIG.forEach((slot) => {
        const sorted = grouped[slot.key].sort((a, b) => getItemStatScore(b) - getItemStatScore(a));
        if (sorted.length) {
          slotMap[slot.key] = sorted.shift();
        }
        leftovers.push(...sorted);
      });

      setEquippedSlots(slotMap);
      setInventoryItems(leftovers);
      setStatusMessage({ type: 'info', text: 'Loaded relics from your vault.' });
    } catch (err) {
      console.error(err);
      setError(err?.error || err?.message || 'Failed to load equipment data');
    } finally {
      setLoading(false);
    }
  }, [generateSlotItems, playerId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    initializeLoad();
  }, [authLoading, initializeLoad]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const aggregatedStats = useMemo(() => summarizeStats(equippedSlots), [equippedSlots]);

  const filteredInventory = useMemo(() => {
    const filtered = inventoryItems
      .filter((item) => (slotFilter === 'all' ? true : item.slotKey === slotFilter))
      .filter((item) => (rarityFilter === 'all' ? true : item.rarity === rarityFilter));

    const sorted = [...filtered].sort((a, b) => {
      const diff = getItemStatScore(a, statSort) - getItemStatScore(b, statSort);
      return sortDirection === 'asc' ? diff : -diff;
    });

    return sorted;
  }, [inventoryItems, rarityFilter, slotFilter, sortDirection, statSort]);

  const handleEquip = useCallback(
    async (item) => {
      setPendingItemId(item.id);
      try {
        await inventoryService.equip(playerId, item.id);
      } catch (err) {
        console.warn('Equip API failed, using client state', err);
        setStatusMessage({ type: 'error', text: err?.error || err?.message || 'Equip request failed, applied locally.' });
      } finally {
        setPendingItemId('');
      }

      setEquippedSlots((prev) => {
        const displaced = prev[item.slotKey];
        setInventoryItems((prevItems) => {
          const withoutCurrent = prevItems.filter((inv) => inv.id !== item.id);
          if (displaced) {
            return [...withoutCurrent, displaced];
          }
          return withoutCurrent;
        });
        return { ...prev, [item.slotKey]: item };
      });

      setStatusMessage({ type: 'success', text: `${item.name} equipped to ${item.slotLabel}` });
    },
    [playerId]
  );

  const handleUnequip = useCallback(
    async (slotKey) => {
      const equippedItem = equippedSlots[slotKey];
      if (!equippedItem) {
        focusSlotInInventory(slotKey);
        setStatusMessage({ type: 'info', text: 'Slot is empty — showing matching inventory pieces.' });
        return;
      }

      setPendingItemId(slotKey);
      try {
        const apiSlot = SLOT_CONFIG.find((slot) => slot.key === slotKey)?.apiSlot || 'weapon';
        await inventoryService.unequip(playerId, apiSlot);
      } catch (err) {
        console.warn('Unequip API failed, using client state', err);
        setStatusMessage({ type: 'error', text: err?.error || err?.message || 'Unequip request failed, applied locally.' });
      } finally {
        setPendingItemId('');
      }

      setEquippedSlots((prev) => ({ ...prev, [slotKey]: null }));
      setInventoryItems((prev) => [...prev, equippedItem]);
      setStatusMessage({ type: 'info', text: `${equippedItem.name} moved back to inventory` });
    },
    [equippedSlots, focusSlotInInventory, playerId]
  );

  const handleRefreshLoot = useCallback(async () => {
    try {
      setRefreshing(true);
      const randomSlots = Array.from({ length: 4 }, () => SLOT_CONFIG[Math.floor(Math.random() * SLOT_CONFIG.length)]);
      const newItems = (
        await Promise.all(
          randomSlots.map(async (slot) => {
            try {
              const payload = await equipmentService.generate(slot.apiSlot, 10 + Math.floor(Math.random() * 10));
              return formatEquipment(payload, slot.key);
            } catch (err) {
              console.error('Failed to forge new item', err);
              return null;
            }
          })
        )
      ).filter(Boolean);

      setInventoryItems((prev) => {
        const merged = [...prev];
        newItems.forEach((item) => {
          if (!merged.some((existing) => existing.id === item.id)) {
            merged.push(item);
          }
        });
        return merged;
      });

      setStatusMessage({
        type: 'success',
        text: newItems.length ? `Forged ${newItems.length} new artifacts.` : 'No new loot found this time.',
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.error || err?.message || 'Failed to roll new loot.' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="equipment-page">
      <header className="equipment-header">
        <div className="equipment-title-block">
          <button className="ghost-button" onClick={() => navigate('/dashboard')}>
            ← Back to dashboard
          </button>
          <h1>Equipment & Inventory</h1>
          <p>Review all 11 gear slots, manage your relics, and watch total stats update instantly.</p>
        </div>

        <div className="equipment-filters">
          <div className="filter-group">
            <label htmlFor="slotFilter">Slot</label>
            <select
              id="slotFilter"
              value={slotFilter}
              onChange={(event) => setSlotFilter(event.target.value)}
            >
              <option value="all">All slots</option>
              {SLOT_CONFIG.map((slot) => (
                <option key={slot.key} value={slot.key}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="rarityFilter">Rarity</label>
            <select
              id="rarityFilter"
              value={rarityFilter}
              onChange={(event) => setRarityFilter(event.target.value)}
            >
              <option value="all">All rarities</option>
              {Object.keys(RARITY_COLORS).map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="statSort">Sort by</label>
            <select
              id="statSort"
              value={statSort}
              onChange={(event) => setStatSort(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="sort-toggle"
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          >
            {sortDirection === 'desc' ? '⬇️ High → Low' : '⬆️ Low → High'}
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className={`equipment-toast ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {error && <div className="equipment-error">{error}</div>}

      {loading ? (
        <div className="equipment-loading">
          <div className="spinner" />
          <p>Attuning to your vault...</p>
        </div>
      ) : (
        <div className="equipment-layout">
          <section className="equipped-section">
            <div className="section-header">
              <h2>Equipped Gear</h2>
              <p>All 11 slots update in real-time as you equip or unequip items.</p>
            </div>
            <div className="slot-grid">
              {SLOT_CONFIG.map((slot) => {
                const item = equippedSlots[slot.key];
                return (
                  <div key={slot.key} className={`slot-card ${item ? `rarity-${item.rarity}` : 'empty'}`}>
                    <div className="slot-heading">
                      <span className="slot-icon">{slot.icon}</span>
                      <div>
                        <div className="slot-label">{slot.label}</div>
                        {item && <div className="slot-level">Lv. {item.level}</div>}
                      </div>
                    </div>

                    {item ? (
                      <>
                        <div className="equipped-name" style={{ color: RARITY_COLORS[item.rarity] || '#fff' }}>
                          {item.name}
                        </div>
                        <div className="stat-badges">
                          {Object.entries(item.baseStats).map(([stat, value]) => (
                            <span key={`${item.id}-${stat}`} className="stat-pill">
                              {stat.toUpperCase()}: {value}
                            </span>
                          ))}
                        </div>
                        {item.affixes?.length > 0 && (
                          <div className="affix-badges">
                            {item.affixes.map((affix) => (
                              <span key={`${item.id}-${affix.affix_type}`} className="affix-pill">
                                {formatAffixLabel(affix)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="effect-grid">
                          <div>
                            <label>Stun</label>
                            <strong>{item.specialEffects.stunChance}%</strong>
                          </div>
                          <div>
                            <label>DoT</label>
                            <strong>{item.specialEffects.dotDamage}</strong>
                          </div>
                          <div>
                            <label>Armor Shred</label>
                            <strong>{item.specialEffects.defenseBreak}</strong>
                          </div>
                          <div>
                            <label>Multi-hit</label>
                            <strong>{item.specialEffects.multiHitChance}%</strong>
                          </div>
                        </div>
                        <button
                          className="ghost-button"
                          type="button"
                          disabled={pendingItemId === slot.key}
                          onClick={() => handleUnequip(slot.key)}
                        >
                          {pendingItemId === slot.key ? 'Working...' : 'Unequip'}
                        </button>
                      </>
                    ) : (
                      <div className="empty-slot">
                        <p>Nothing equipped</p>
                        <button type="button" className="ghost-button" onClick={() => focusSlotInInventory(slot.key)}>
                          Find gear
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="stats-section">
            <div className="section-header">
              <h2>Total Bonuses</h2>
              <p>Aggregated directly from the equipped loadout.</p>
            </div>
            <div className="stats-grid">
              {[
                { key: 'attack', label: 'Attack', icon: '⚔️' },
                { key: 'defense', label: 'Defense', icon: '🛡️' },
                { key: 'hp', label: 'Vitality', icon: '❤️' },
                { key: 'speed', label: 'Speed', icon: '💨' },
                { key: 'critChance', label: 'Crit %', icon: '🎯', suffix: '%' },
                { key: 'lifesteal', label: 'Lifesteal %', icon: '🩸', suffix: '%' },
              ].map((stat) => (
                <div key={stat.key} className="stat-card">
                  <span className="stat-icon">{stat.icon}</span>
                  <div>
                    <p>{stat.label}</p>
                    <strong>
                      {aggregatedStats[stat.key]}
                      {stat.suffix || ''}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="effect-stats">
              {[
                { key: 'stunChance', label: 'Stun Chance', suffix: '%' },
                { key: 'dotDamage', label: 'DoT Damage', suffix: '' },
                { key: 'defenseBreak', label: 'Defense Reduction', suffix: '' },
                { key: 'multiHitChance', label: 'Multi-hit Chance', suffix: '%' },
              ].map((effect) => (
                <div key={effect.key} className="effect-card">
                  <p>{effect.label}</p>
                  <strong>
                    {aggregatedStats[effect.key]}
                    {effect.suffix}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="inventory-section" ref={inventoryRef}>
            <div className="section-header inventory-header">
              <div>
                <h2>Inventory ({filteredInventory.length})</h2>
                <p>Sort and filter by slot, rarity, or stat focus to find the perfect upgrade.</p>
              </div>
              <button type="button" className="primary-button" onClick={handleRefreshLoot} disabled={refreshing}>
                {refreshing ? 'Rolling loot...' : 'Forge new loot'}
              </button>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="inventory-empty">No items match the current filters.</div>
            ) : (
              <div className="inventory-grid">
                {filteredInventory.map((item) => (
                  <article key={item.id} className={`inventory-card rarity-${item.rarity}`}>
                    <div className="card-top">
                      <span className="slot-pill">
                        {item.slotIcon} {item.slotLabel}
                      </span>
                      <span className="rarity-pill" style={{ backgroundColor: RARITY_COLORS[item.rarity] || '#95a5a6' }}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>

                    <h3>{item.name}</h3>
                    <p className="card-level">Level {item.level}</p>

                    <div className="stat-badges">
                      {Object.entries(item.baseStats).map(([stat, value]) => (
                        <span key={`${item.id}-${stat}`} className="stat-pill">
                          {stat.toUpperCase()}: {value}
                        </span>
                      ))}
                    </div>

                    {item.affixes?.length > 0 && (
                      <div className="affix-badges">
                        {item.affixes.map((affix) => (
                          <span key={`${item.id}-${affix.affix_type}`} className="affix-pill">
                            {formatAffixLabel(affix)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="effect-grid">
                      <div>
                        <label>Stun</label>
                        <strong>{item.specialEffects.stunChance}%</strong>
                      </div>
                      <div>
                        <label>DoT</label>
                        <strong>{item.specialEffects.dotDamage}</strong>
                      </div>
                      <div>
                        <label>Armor Shred</label>
                        <strong>{item.specialEffects.defenseBreak}</strong>
                      </div>
                      <div>
                        <label>Multi-hit</label>
                        <strong>{item.specialEffects.multiHitChance}%</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={pendingItemId === item.id}
                      onClick={() => handleEquip(item)}
                    >
                      {pendingItemId === item.id ? 'Equipping...' : 'Equip'}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default EquipmentManager;
