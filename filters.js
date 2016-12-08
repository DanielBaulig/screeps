function isEnergyAtCapacity(o) {
  return o.energy >= o.energyCapacity;
}

function isEnergyDepleted(o) {
  return o.energy <= 0;
}

function isStoreDepleted(c, resource) {
  if (!isContainer(c)) {
    console.log('Checking storage of non-Container');
    return true;
  }
  if (resource) {
    return c.store[resource] <= 0;
  }
  return _.sum(c.store) <= 0;
}

function isCarryAtCapacity(c) {
  if (!isCreep(c)) {
    console.log('Checking carry of non-Creep');
    return false;
  }
  return _.sum(c.carry) >= c.carryCapacity;
}

function isCarryDepleted(c, resource) {
  if(!isCreep(c)) {
    console.warn('Checking carry of non-Creep');
    return true;
  }
  
  if (resource) {
    return c.carry[resource] <= 0;
  }
  
  return _.sum(c.carry) <= 0;
}

function isStoreAtCapacity(c) {
  if (!isContainer(c)) {
    console.log('Checking storage of non-Container');
    return false;
  }
  return _.sum(c.store) >= c.storeCapacity;
}

function isContainer(o) {
  return o instanceof StructureContainer || o instanceof StructureStorage;
}

function isStorage(o) {
  return o instanceof StructureStorage;
}

function hasStore(o) {
  return isContainer(o) || isStorage(o);
}

function isCreep(o) {
  return o instanceof Creep;
}

function isExtension(o) {
  return o instanceof StructureExtension;
}

function isEnergy(r) {
  return r.resourceType == RESOURCE_ENERGY;
}

function isTower(s) {
  return s instanceof StructureTower;
}

function isDamaged(s) {
  return isDamagedMoreThan(s, 0);
}

function isDamagedMoreThan(s, percent) {
  return s.hits < s.hitsMax * (100 - percent) / 100;
}

function doesCreepExist(name) {
  return name in Game.creeps;
}

function isWall(s) {
  return s instanceof StructureWall;
}

function isHauler(c) {
  return isCreep(c) && c.memory.role == 'hauler';
}

function isBuilder(c) {
  return isCreep(c) && c.memory.role == 'builder';
}

function isHarvester(c) {
  return isCreep(c) && c.memory.role == 'harvester';
}

function isUpgrader(c) {
  return isCreep(c) && c.memory.role == 'upgrader';
}

function isMyRoom(r) {
  return r.controller && isMyObject(r.controller);
}

function isMyObject(o) {
  return o.my;
}

function isInRoom(o, r) {
  return o.pos.roomName == r.name;
}

module.exports = {
  isEnergyAtCapacity,
  isEnergyDepleted,
  isStoreAtCapacity,
  isStoreDepleted,
  isCarryAtCapacity,
  isCarryDepleted,
  isContainer,
  isCreep,
  isExtension,
  isEnergy,
  isTower,
  isDamaged,
  isDamagedMoreThan,
  doesCreepExist,
  isWall,
  isHarvester,
  isHauler,
  isBuilder,
  isUpgrader,
  hasStore,
  isMyObject,
  isMyRoom,
  isInRoom,
};
