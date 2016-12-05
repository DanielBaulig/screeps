const CreepBodyPartCosts = require('CreepBodyPartCosts');
const { 
  isEnergyAtCapacity, 
  isStoreDepleted, 
  isContainer, 
  isExtension, 
  isStoreAtCapacity,
  isEnergy,
} = require('filters');

function findContainersWith(room, resource) {
  return room.find(
    FIND_STRUCTURES, 
    { filter: (s) => isContainer(s) && !isStoreDepleted(s, resource) }
  );
}

function findMySpawnsAtCapacity(room) {
  return room.find(
    FIND_MY_SPAWNS,
    { filter: isEnergyAtCapacity }
  );
}

function lookForPickups(pos, resource) {
  return pos.lookFor(LOOK_STRUCTURES, {
    filter: (s) => isContainer(s) && !isStoreDepleted(s, resource),
  }).concat(pos.lookFor(LOOK_RESOURCES, {
    filter: (r) => isEnergy(r)
  }));
}

function lookForSources(pos) {
  return pos.lookFor(LOOK_SOURCES).concat(lookForPickups(pos, RESOURCE_ENERGY));
}

function lookForDropOffs(pos) {
  return pos.lookFor(LOOK_STRUCTURES, {
    filter: (s) => isContainer(s) && !isStoreAtCapacity(s),
  });
}

function findDroppedEnergy(room) {
  return room.find(
    FIND_DROPPED_RESOURCES, 
    { filter: (resource) => isEnergy(resource) && resource.amount >= 50 }
  );
}

const utils = {
  getCreepRepairPower: function(creep) {
    return creep.getActiveBodyparts(WORK) * 100;
  },
  getCreepsWithRole(role) {
    var creeps = [];
    for(var name in Game.creeps) {
      var creep = Game.creeps[name];
       
      if(creep.memory.role == role) {
        creeps.push(creep);
      }
    }
    return creeps;
  },
  getBestEnergyPickup: function(creep) {
    const containers = findContainersWith(creep.room, RESOURCE_ENERGY);
    if (containers.length) {
      return creep.pos.findClosestByPath(containers);
    }
    
    const spawns = findMySpawnsAtCapacity(creep.room);
    if (spawns.length) {
      return creep.pos.findClosestByPath(spawns);
    }
    
    const emptyContainers = creep.room.find(
      FIND_STRUCTURES, 
      { filter: isContainer }
    );
    
    return creep.pos.findClosestByPath(emptyContainers);
  },
  getBestDroppedEnergy: function(creep) {
    const droppedEnergy = findDroppedEnergy(creep.room);
    const sortedEnergy = _.sortBy(droppedEnergy, (energy) => energy.amount);
    const most = sortedEnergy.pop();
    const least = sortedEnergy.shift();
    if (most && least && (most.amount > least.amount * 2)) {
      return most;
    } else
    return creep.pos.findClosestByPath(droppedEnergy);
  },
  getClosestEnergySource: function(creep) {
    return creep.pos.findClosestByPath(creep.room.find(FIND_SOURCES));
  },
  getBestEnergySource: function(creep) {
   const sources = creep.room.find(FIND_SOURCES);
   const drops = findDroppedEnergy(creep.room);
   
   return creep.pos.findClosestByPath(sources.concat(drops));
  },
  getBestEnergyDropOff: function(creep) {
    const extensions = creep.room.find(
      FIND_MY_STRUCTURES, 
      { filter: (s) => isExtension(s) && !isEnergyAtCapacity(s)}
    );
    if (extensions.length) {
      return creep.pos.findClosestByPath(extensions);
    }
    
    const spawns = creep.room.find(
      FIND_MY_SPAWNS, 
      { filter: (s) => !isEnergyAtCapacity(s) }
    );
    if (spawns.length) {
    return creep.pos.findClosestByPath(spawns);
    }
    
    let containers = creep.room.find(
      FIND_STRUCTURES,
      { filter: (s) => isContainer(s) && !isStoreAtCapacity(s) }
    );
    
    if (!containers.length) {
      containers = creep.room.find(
        FIND_STRUCTURES,
        { filter: (s) => isContainer(s) }
      );
    }
    
    return creep.pos.findClosestByPath(containers);
  },
  getResourceFrom: function(creep, resource, source) {
    if (source instanceof Resource) {
      return creep.pickup(source, resource);
    } else if (source instanceof Structure) {
      return creep.withdraw(source, resource);
    } else if (resource == RESOURCE_ENERGY) {
      return creep.harvest(source);
    } else {
      return ERR_NOT_IN_RANGE;
    }
  },
  putResourceTo: function(creep, resource, dest) {
    if (dest instanceof RoomPosition) {
      if (creep.pos.isEqualTo(dest)) {
      return creep.drop(resource);
      } else {
        return ERR_NOT_IN_RANGE;
      }
    } else if (dest instanceof Structure) {
    return creep.transfer(dest, resource) 
    } else {
      console.log('NOT IN RANGE');
      return ERR_NOT_IN_RANGE;
    }
  },
  getFlagLocation(name) {
    const flag = Game.flags[name];
    if (flag) {
      return flag.pos;
    } else
      console.log('Getting location for unknown flag', name);
  },
  getBodyEnergyCost(body) {
    return body.reduce((sum, part) => sum + CreepBodyPartCosts[part], 0);
  },
  getThreatLevel(creep) {
    return creep.getActiveBodyparts(ATTACK) * 30 + creep.getActiveBodyparts(RANGED_ATTACK) * 8;
  },
  getPriorityTarget(threats) {
    return threats.sort((threat1, threat2) => {
       return utils.getThreatLevel(threat1) / threat1.hits - (utils.getThreatLevel(threat2) / threat2.hits)
    }).pop();
  },
  lookForPickups,
  lookForDropOffs,
  lookForSources,
};

module.exports = utils;
