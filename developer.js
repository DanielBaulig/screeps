const roles = require('roles');
const log = require('log');
const utils = require('utils');

const {
  isContainer,
  isStoreAtCapacity,
  doesCreepExist,
  isEnergyAtCapacity,
  isHauler,
  isBuilder,
  isHarvester,
  isUpgrader,
  isExtension,
} = require('filters');

function getMaxExtensions(controllerLevel) {
  return 5 * (controllerLevel - 1);
}

function getMinimumEnergy(room) {
  if (room.find(FIND_MY_CREEPS).length > 3) {
    return room.energyCapacityAvailable;
  } else {
    return 300;
  }
}

function fillCreepRoleCap(room, role, cap) {
  const creeps = _.filter(Game.creeps, (creep) => {
     return creep.memory.role == role && creep.memory.home == room.name; 
  });
  if (creeps.length < cap && canBuildCreep(room, role, room.energyAvailable)) {
    buildCreep(room, role, room.energyAvailable);
  }
      
}

function fillCreepRoleCapFromMemory(room, role) {
  if (!room.memory.roleCaps) {
    return;
  }
  fillCreepRoleCap(room, role, room.memory.roleCaps[role]);
}

function canBuildCreep(room, role, maximumEnergy) {
  const spawns = room.find(FIND_MY_SPAWNS);
  
  if (spawns.length) {
    return OK == spawns[0].canCreateCreep(
      roles.getCreepBody(role, maximumEnergy)
    );
  }
  
  
  return false;
}

function buildCreep(room, role, maximumEnergy, memory) {
  const spawns = room.find(FIND_MY_SPAWNS);
  const home = room.name;
  const behaviors = roles.getBehaviorsByRole(role);
  
  if (spawns.length) {
    const name = spawns[0].createCreep(
      roles.getCreepBody(role, maximumEnergy), 
      undefined, 
      Object.assign({ role, behaviors, home }, memory) 
    );
    if (typeof name == 'string') {
      console.log('<b>Building creep', role, name, home, maximumEnergy, '</b>');
    }
    return name;
  }
}

function fillCreepRoleCapsFromMemory(room) {
  roles.availableRoles.forEach(role => {
    fillCreepRoleCapFromMemory(room, role);
  });
}

function fillExtensionPoints(room) {
  const controller = room.controller;
  if (!controller.my) {
    return;
  }
  const maxExtensions = getMaxExtensions(controller.level);
  const actualExtensions = room.find(FIND_MY_STRUCTURES, {
    filter: isExtension,
  }).length;
  console.log('maxExtensions', maxExtensions, actualExtensions);

  if (maxExtensions > actualExtensions) {
    fillConstructionPoints(room, COLOR_WHITE, STRUCTURE_EXTENSION);
  }
}

function fillConstructionPoints(room, secondaryColor, structureType) {
  const activeConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
  // Only have one construction site active at a time
  if (activeConstructionSites.length > 0) {
    return;
  }
  const constructionPoints = getFlags(COLOR_GREEN).filter(flag => {
    return flag.room == room && flag.secondaryColor == secondaryColor;
  });
  if (!constructionPoints.length) {
    return;
  }
  const constructionPoint = constructionPoints.shift();
  const result = room.createConstructionSite(
    constructionPoint.pos,
    structureType
  );
  if (result == OK) {
    constructionPoint.remove();
  }
}

function setupSourceSlots(room) {
  const sources = room.find(FIND_SOURCES);
  const memory = _.zipObject(
    sources.map(s => s.id), sources.map(s => ({assignedCreep:null}))
  );
  room.memory.sources = Object.assign(memory, room.memory.sources);
}

function getFlags(color) {
  return _.filter(Game.flags, (flag) => flag.color == color);
}

function fillGuardPoints(room) {
  const guardFlags = getFlags(COLOR_RED);
  guardFlags.forEach((flag) => {
    const guard = flag.memory.guard;
    if (!(guard in Game.creeps)) {
      flag.memory.guard = buildCreep(
        room,
        'warrior',
        room.energyAvailable, 
        {mission: 'guard', target: flag.name}
      );
    }
  });
}

function fillMiningPoints(room) {
  const mines = getFlags(COLOR_YELLOW);
  mines.forEach(flag => {
     const miner = flag.memory.miner;
     if (!(miner in Game.creeps)) {
       flag.memory.miner = buildCreep(room, 'miner', room.energyCapacityAvailable, {source: flag.name})
     }
  });
}

function fillPickupPoints(room) {
  const pickupPoints = getFlags(COLOR_BLUE);
  pickupPoints.forEach(flag => {
    const hauler = flag.memory.hauler;
    if (!(hauler in Game.creeps)) {
      flag.memory.hauler = buildCreep(room, 'hauler', room.energyCapacityAvailable, {source: flag.name});
    }
  });
}

function recycleOutdatedCreeps(room) {
  const maximumEnergy = room.energyCapacityAvailable;
  const creeps = room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      const possibleBody = roles.getCreepBody(creep.memory.role, maximumEnergy);
      let possibleBodyCost = utils.getBodyEnergyCost(possibleBody);
      const actualBody = creep.body.map(part => part.type);
      let actualBodyCost = utils.getBodyEnergyCost(actualBody);

      if (possibleBodyCost > actualBodyCost) {
        const memory = creep.memory;
        memory.behaviors = memory.behaviors.filter(v => 'autoRenew');
      }
    },
  });
}

const phases = {
  bootstrap: function(room) {
    
  },
  growControllerLevel: function (room) {
    // Only build creeps at maximum energy available
    if (room.energyAvailable >= room.energyCapacityAvailable) {
      // churn out as many upgrader as we can support with our energy
      // we use full storage container as a benchmark for how many upgrader we can support
      let fullContainers = room.find(
        FIND_STRUCTURES, 
        { filter: (s) => isContainer(s) && isStoreAtCapacity(s) }
      );
      if (fullContainers.length) {
        buildCreep(room, 'upgrader', room.energyAvailable);
      }
      
      // Fill memory caps for all roles
      fillCreepRoleCapsFromMemory(room);
      // Fill guard points
      fillGuardPoints(room); // Red Flags
      // Fill pikcup routes
      fillPickupPoints(room); // Blue Flags
      // Fill mining locations
      fillMiningPoints(room); // Yellow Flags
    }
    
    // In case we loose all haulers and havesters, we want to either convert another creep to
    // a harvester or crank out a low level harvester with whatever energy we have left.
    if (!room.find(FIND_MY_CREEPS, {filter: (c) => isHauler(c) || isHarvester(c) }).length) {
      // Try to convert a builder or upgrader
      const convertables = room.find(
        FIND_MY_CREEPS, {filter: (c) => isBuilder(c) || isUpgrader(c) }
      );
      if (convertables.length) {
        convertables[0].memory.role = 'harvester';
      } else {
        buildCreep(room, 'harvester', room.energyAvailable);
      }
    } 


    recycleOutdatedCreeps(room);
    fillExtensionPoints(room);
  },
};

module.exports = {
  getMinimumEnergy,
  run(room) {
    phases.growControllerLevel(room);
  },
};
