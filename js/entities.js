export const UnitTypes = {
  HARVESTER: {
    name: "Harvester",
    speed: 70,
    capacity: 50,
    size: 20,
    color: "#FFD700",
    label: "H",
    hp: 140, // Increased from 100 to 140
    attackPower: 0,
    attackRange: 0,
    cost: 0,
  },
  TROOPER: {
    name: "Trooper",
    speed: 110,
    capacity: 0,
    size: 16,
    color: "#88CCFF",
    label: "T",
    hp: 90, // Increased from 60 to 90
    attackPower: 15, // Lowered from 18 to 15
    attackRange: 26,
    cost: 50,
  },
};

export const BuildingTypes = {
  BASE: {
    name: "Base",
    size: 56,
    color: "#2233AA",
    cost: 0,
    hp: 500,
  },
  BARRACKS: {
    name: "Barracks",
    size: 56,
    color: "#338833",
    cost: 100,
    hp: 300,
  },
  ENEMY_BASE: {
    name: "Enemy Base",
    size: 56,
    color: "#AA2222",
    hp: 500,
  },
  ENEMY_BARRACKS: {
    name: "Enemy Barracks",
    size: 56,
    color: "#992222",
    hp: 300,
  },
};

