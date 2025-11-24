import { 
  RarityBadge, 
  StatusBadge, 
  StatDisplay, 
  EquipmentCard, 
  CombatLogEntry 
} from '../components';
import { 
  ItemRarity, 
  StatusEffectType, 
  Equipment, 
  EquipmentSlot,
  CombatAction 
} from '../types/combat';
import '../styles/theme.css';
import './ComponentShowcase.css';

const sampleEquipment: Equipment = {
  id: 'legendary-sword-1',
  name: 'Celestial Dragon Blade',
  slot: EquipmentSlot.WEAPON,
  rarity: ItemRarity.LEGENDARY,
  level: 75,
  attack: 250,
  defense: 50,
  hp: 100,
  speed: 30,
  special_effect: 'Summons a celestial dragon to strike enemies with 20% chance on hit',
};

const sampleCombatAction: CombatAction = {
  turn: 5,
  attacker_id: 'hero-1',
  attacker_name: 'Sword Saint Li',
  defender_id: 'demon-1',
  defender_name: 'Shadow Demon',
  action_type: 'attack',
  damage: 350,
  is_crit: true,
  message: 'Sword Saint Li unleashes a devastating strike!',
  status_effects_applied: [
    {
      effect_type: StatusEffectType.DOT,
      value: 50,
      duration: 3,
      source_character_id: 'hero-1',
    },
  ],
};

export function ComponentShowcase() {
  return (
    <div className="showcase-container">
      <header className="showcase-header">
        <h1>Xianxia UI Component Library</h1>
        <p>Ancient cultivation-themed React components for your RPG</p>
      </header>

      <section className="showcase-section">
        <h2>RarityBadge</h2>
        <p className="section-description">
          Display item rarity with color-coded badges. Legendary items have a pulsing glow effect.
        </p>
        <div className="component-demo">
          <div className="demo-row">
            <RarityBadge rarity={ItemRarity.COMMON} />
            <RarityBadge rarity={ItemRarity.UNCOMMON} />
            <RarityBadge rarity={ItemRarity.RARE} />
            <RarityBadge rarity={ItemRarity.EPIC} />
            <RarityBadge rarity={ItemRarity.LEGENDARY} />
          </div>
          <div className="demo-row">
            <RarityBadge rarity={ItemRarity.RARE} size="sm" />
            <RarityBadge rarity={ItemRarity.RARE} size="md" />
            <RarityBadge rarity={ItemRarity.RARE} size="lg" />
          </div>
        </div>
        <div className="code-example">
          <pre>{`<RarityBadge rarity={ItemRarity.LEGENDARY} />
<RarityBadge rarity={ItemRarity.RARE} size="sm" />
<RarityBadge rarity={ItemRarity.EPIC} showLabel={false} />`}</pre>
        </div>
      </section>

      <section className="showcase-section">
        <h2>StatusBadge</h2>
        <p className="section-description">
          Display status effects with icons, duration, and values. Supports all combat status types.
        </p>
        <div className="component-demo">
          <div className="demo-row">
            <StatusBadge statusType={StatusEffectType.STUN} duration={2} />
            <StatusBadge statusType={StatusEffectType.DOT} value={50} duration={3} />
            <StatusBadge statusType={StatusEffectType.ATTACK_BUFF} value={25} duration={5} />
            <StatusBadge statusType={StatusEffectType.DEFENSE_DEBUFF} value={-15} duration={2} />
          </div>
          <div className="demo-row">
            <StatusBadge statusType={StatusEffectType.HEAL_OVER_TIME} value={30} duration={4} />
            <StatusBadge statusType={StatusEffectType.DEFENSE_BUFF} value={40} duration={3} />
            <StatusBadge statusType={StatusEffectType.MULTI_HIT} duration={1} />
          </div>
        </div>
        <div className="code-example">
          <pre>{`<StatusBadge statusType={StatusEffectType.STUN} duration={2} />
<StatusBadge 
  statusType={StatusEffectType.DOT} 
  value={50} 
  duration={3} 
  size="lg" 
/>`}</pre>
        </div>
      </section>

      <section className="showcase-section">
        <h2>StatDisplay</h2>
        <p className="section-description">
          Display character stats with icons and optional progress bars. Three variants available.
        </p>
        <div className="component-demo">
          <div className="demo-grid">
            <StatDisplay label="HP" value={850} maxValue={1000} />
            <StatDisplay label="Attack" value={250} />
            <StatDisplay label="Defense" value={180} />
            <StatDisplay label="Speed" value={95} />
          </div>
          <div className="demo-grid">
            <StatDisplay 
              label="HP" 
              value={850} 
              maxValue={1000} 
              variant="detailed" 
              showPercentage 
            />
            <StatDisplay label="Attack" value={250} variant="compact" />
          </div>
        </div>
        <div className="code-example">
          <pre>{`<StatDisplay label="HP" value={850} maxValue={1000} />
<StatDisplay 
  label="HP" 
  value={850} 
  maxValue={1000} 
  variant="detailed" 
  showPercentage 
/>
<StatDisplay label="Attack" value={250} color="#e74c3c" />`}</pre>
        </div>
      </section>

      <section className="showcase-section">
        <h2>EquipmentCard</h2>
        <p className="section-description">
          Display equipment with rarity colors, stats, and special effects. Interactive with equip/unequip actions.
        </p>
        <div className="component-demo">
          <div className="demo-card-grid">
            <EquipmentCard 
              equipment={sampleEquipment} 
              onEquip={() => console.log('Equipped!')}
            />
            <EquipmentCard 
              equipment={{
                id: 'armor-1',
                name: 'Phoenix Guard Armor',
                slot: EquipmentSlot.ARMOR,
                rarity: ItemRarity.EPIC,
                level: 60,
                defense: 180,
                hp: 200,
                special_effect: 'Reduces fire damage by 30%',
              }}
              isEquipped={true}
              onUnequip={() => console.log('Unequipped!')}
            />
          </div>
        </div>
        <div className="code-example">
          <pre>{`<EquipmentCard 
  equipment={equipment}
  isEquipped={false}
  onEquip={() => handleEquip()}
  onUnequip={() => handleUnequip()}
  showActions={true}
/>`}</pre>
        </div>
      </section>

      <section className="showcase-section">
        <h2>CombatLogEntry</h2>
        <p className="section-description">
          Display combat actions with damage, healing, and status effects. Animated on appearance.
        </p>
        <div className="component-demo">
          <div className="demo-column">
            <CombatLogEntry action={sampleCombatAction} />
            <CombatLogEntry 
              action={{
                turn: 6,
                attacker_id: 'demon-1',
                attacker_name: 'Shadow Demon',
                defender_id: 'hero-1',
                defender_name: 'Sword Saint Li',
                action_type: 'attack',
                damage: 0,
                is_miss: true,
                message: 'Shadow Demon attacks but misses!',
              }}
            />
            <CombatLogEntry 
              action={{
                turn: 7,
                attacker_id: 'hero-1',
                attacker_name: 'Sword Saint Li',
                defender_id: 'hero-1',
                defender_name: 'Sword Saint Li',
                action_type: 'heal',
                healing: 150,
                message: 'Sword Saint Li meditates and recovers health',
              }}
            />
          </div>
        </div>
        <div className="code-example">
          <pre>{`<CombatLogEntry 
  action={{
    turn: 5,
    attacker_name: 'Hero',
    defender_name: 'Monster',
    action_type: 'attack',
    damage: 350,
    is_crit: true,
    message: 'Critical strike!',
  }}
  variant="default"
/>`}</pre>
        </div>
      </section>

      <section className="showcase-section">
        <h2>Responsive Design</h2>
        <p className="section-description">
          All components are fully responsive and adapt to mobile, tablet, and desktop screens.
          Resize your browser to see the components adapt!
        </p>
        <div className="responsive-info">
          <div className="breakpoint-card">
            <h3>📱 Mobile</h3>
            <p>&lt; 640px</p>
            <ul>
              <li>Compact layouts</li>
              <li>Stacked components</li>
              <li>Touch-friendly sizing</li>
            </ul>
          </div>
          <div className="breakpoint-card">
            <h3>📱 Tablet</h3>
            <p>641px - 1023px</p>
            <ul>
              <li>Balanced layouts</li>
              <li>Grid adjustments</li>
              <li>Medium spacing</li>
            </ul>
          </div>
          <div className="breakpoint-card">
            <h3>🖥️ Desktop</h3>
            <p>&gt; 1024px</p>
            <ul>
              <li>Full layouts</li>
              <li>Maximum detail</li>
              <li>Hover effects</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="showcase-footer">
        <p>Built with React, TypeScript, and Xianxia aesthetics ✨</p>
      </footer>
    </div>
  );
}
