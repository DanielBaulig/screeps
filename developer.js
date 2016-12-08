const roles = require('roles');
const log = require('log');
const utils = require('utils');

const {
  isStoreAtCapacity,
  doesCreepExist,
  isEnergyAtCapacity,
  isHauler,
  isBuilder,
  isHarvester,
  isUpgrader,
  isExtension,
  hasStore,
  isMyRoom,
  isInRoom,
} = require('filters');

function getRoomControllerLevel(room) {
  if (!room.controller) {
    return null;
  }
  return room.controller.level;
}

function getMaxExtensions(controllerLevel) {
  const levelToExtensions = [
    0,
    0,
    5,
    10,
    20,
    30,
    40,
    50,
    60
  ];
  return levelToExtensions[controllerLevel];
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
  const controllerLevel = getRoomControllerLevel(room);
  const maxExtensions = getMaxExtensions(controllerLevel);
  const actualExtensions = room.find(FIND_MY_STRUCTURES, {
    filter: isExtension,
  }).length;

  if (maxExtensions > actualExtensions) {
    fillConstructionPoints(room, COLOR_WHITE, STRUCTURE_EXTENSION);
  }
}

function fillRemoteBuilderPoints(room) {
  const remoteBuildPoint = getFlags(COLOR_GREEN).forEach(flag => {
    if (flag.secondaryColor != COLOR_GREEN) {
      return;
    }
    if (flag.memory.builder in Game.creeps) {
      return;
    }
    flag.memory.builder = buildCreep(
      room,
      'builder',
      room.energyAvailable,
      {
        home: flag.room.name,
        behaviors: ['emergencyUpgrade', 'autoRenew'],
        unconvertable: true,
        allowMining: true
      }
    );
  });
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

function getFlags(color, secondaryColor, room) {
  return _.filter(Game.flags, (flag) => {
    const secondaryColorTest = 
      secondaryColor ? secondaryColor == flag.secondaryColor : true;
    const roomTest = 
      room ? isInRoom(flag, room) : true;
    const colorTest = flag.color == color;

    return colorTest && secondaryColorTest && roomTest;
  });
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

function fillClaimPoints(room) {
  const claimFlags = getFlags(COLOR_PURPLE);
  claimFlags.filter((flag) => {
    const threshold = flag.memory.threshold;
    if (threshold) {
      if (flag.room) {
        const structures = flag.pos.lookFor(LOOK_STRUCTURES);
        if (!(
          structures.length && 
          structures[0] instanceof StructureController && 
          structures[0].reservation && 
          structures[0].reservation.ticksToEnd < threshold
        )) {
          return false;
        }
      }
    }
    if (!hasHighLevelController(room)) {
      return false;
    }
    return true;
  });
  claimFlags.forEach(flag => {
    const claimer = flag.memory.claimer;
    if (!(claimer in Game.creeps)) {
      flag.memory.claimer = buildCreep(
        room,
        'claimer',
        room.energyAvailable,
        {
          target: flag.name,
          mission: flag.secondaryColor === COLOR_BLUE ? 'claim' : 'reserve',
        }
      );
    }
  });
}

function hasHighLevelController(room) {
  const level = getRoomControllerLevel(room);
  const max = _.reduce(Game.rooms, (max, room) => Math.max(max, getRoomControllerLevel(room)), 0);
  return max <= level;
}

function fillMiningPoints(room) {
  const mines = getFlags(COLOR_YELLOW).filter(flag => 
    isInRoom(flag, room) || hasHighLevelController(room)
  );
  fillPointsWithRole(room, mines, 'miner');
}

function fillPointsWithRole(room, points, role, memory) {
  points.forEach((point) => {
    const mem = typeof memory == 'function' ? memory(point) : memory;
    const assignee = point.memory[role];
    if (!doesCreepExist(assignee)) {
      point.memory[role] = buildCreep(
        room,
        role,
        room.energyCapacityAvailable,
        Object.assign({assignedTo: point.name}, mem)
      );
    }
  });
}

function fillPickupPoints(room) {
  const pickupPoints = getFlags(COLOR_BLUE, COLOR_BLUE).filter(flag => 
    isInRoom(flag, room) || hasHighLevelController(room)
  );
  fillPointsWithRole(room, pickupPoints, 'hauler');
}

function recycleOutdatedCreeps(room) {
  const maximumEnergy = room.energyCapacityAvailable;
  const creeps = room.find(
    FIND_MY_CREEPS, {
    filter: (creep) => {
      const possibleBody = roles.getCreepBody(creep.memory.role, maximumEnergy);
      let possibleBodyCost = utils.getBodyEnergyCost(possibleBody);
      const actualBody = creep.body.map(part => part.type);
      let actualBodyCost = utils.getBodyEnergyCost(actualBody);

      return possibleBodyCost > actualBodyCost;
      }
    }
  );

  creeps.forEach(creep => {
    // For now, let's not actively recycle them but just let them 
    // run out of turns to live.
    const memory = creep.memory;
    memory.behaviors = memory.behaviors.filter(v => v != 'autoRenew');
  });
}

function transitionToPhase(room, phase) {
  room.memory.phase = phase;
  return phases[phase](room);
}

const phases = {
  bootstrap: function(room) {
    if (room.controller.level > 1) {
      return transitionToPhase(room, 'growControllerLevel');
    }
    const sources = room.find(FIND_SOURCES);
    if (room.energyAvailable >= room.energyCapacityAvailable) {
      fillCreepRoleCap(room, 'harvester', sources.length);
      fillCreepRoleCap(room, 'upgrader', sources.length);
    }

  },
  growControllerLevel: function (room) {
    // Only build creeps at maximum energy available
    if (room.energyAvailable >= room.energyCapacityAvailable) {
      // churn out as many upgrader as we can support with our energy
      // we use full storage container as a benchmark for how many upgrader we can support

      let containers = room.find(
        FIND_STRUCTURES, 
        { filter: (s) => hasStore(s) }
      );
      const energyStored = containers.reduce((sum, container) => sum + container.store[RESOURCE_ENERGY], 0);
      if (energyStored > 1000 * getRoomControllerLevel(room)) {
        buildCreep(room, 'upgrader', room.energyAvailable);
      }
      
      fillRemoteBuilderPoints(room);
      fillClaimPoints(room);
      // Fill memory caps for all roles
      fillCreepRoleCapsFromMemory(room);
      // Fill guard points
      fillGuardPoints(room); // Red Flags
      // Fill pickup routes
      fillPickupPoints(room); // Blue Flags
      // Fill mining locations
      fillMiningPoints(room); // Yellow Flags
    }
    
    // In case we loose all haulers and havesters, we want to either convert another creep to
    // a harvester or crank out a low level harvester with whatever energy we have left.
    if (!room.find(FIND_MY_CREEPS, {filter: (c) => isHauler(c) || isHarvester(c) }).length) {
      // Try to convert a builder or upgrader
      const convertables = room.find(
        FIND_MY_CREEPS, {filter: (c) => !c.memory.unconvertable && (isBuilder(c) || isUpgrader(c))  }
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
    const phase = room.memory.phase;
    if (typeof phases[phase] != 'function') {
      return console.log('Phase', phase,'is not a valid phase for room', room.name);
    }
    console.log('Running', phase, 'on Room', room);
    phases[phase](room);
  },
};
