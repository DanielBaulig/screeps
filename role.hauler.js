const utils = require('utils');
const {
  isCarryAtCapacity,
  isCarryDepleted,
  isContainer,
} = require('filters');

var roleHauler = {
  name: 'hauler',
  getBody(maxEnergy) {
    const bodies = [
      [],
      [MOVE, CARRY], // 100
      [MOVE, CARRY, CARRY], // 150
      [MOVE, CARRY, CARRY, CARRY, CARRY], // 250
      [MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], // 300
      [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], // 450
      [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], // 600
      [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], // 750
    ].reverse();
    
    const body = bodies.find((b) => utils.getBodyEnergyCost(b) <= maxEnergy);
    
    return body;  
  },
  
  startHauling(creep) {
    creep.memory.hauling = true;
    creep.memory.target = utils.serializeRoomPosition(
      utils.getPosition(this.getSource(creep))
    );
    creep.say('hauling');
  },
  stopHauling(creep) {
    creep.memory.hauling = false;
    delete creep.memory.target;
    creep.say('delivering');
  },
  
  getSource(creep) {
    let location = null;
    
    if (creep.memory.source) {
      location = utils.getFlagLocation(creep.memory.source);
    }
    
    if (!location) {
      return utils.getBestDroppedEnergy(creep);  
    }
    
    if (!(location.roomName in Game.rooms)) {
      // We don't have access to the room the Flag is in,
      // just move towards the Flag for now
      return location;
    }
    
    return utils.lookForPickups(location, RESOURCE_ENERGY).pop();
  },
  
  getDestination(creep) {
    let location = null;
    const home = creep.memory.home;
    if (creep.room.name != home) {
      return creep.pos.findClosestByRange(creep.room.findExitTo(Game.rooms[home]));
    }
    
    if (creep.memory.dest) {
      location = utils.getFlagLocation(creep.memory.dest);
    }
    
    if (!location) {
      return utils.getBestEnergyDropOff(creep);
    }
    
    const dropOffs = utils.lookForDropOffs(location);
    return dropOffs.length ? dropOffs.pop() : location;
  },
  
  haul(creep) {
    const target = creep.memory.target;
    let source = null;

    if (target) {
      source = utils.lookForPickups(
        utils.deserializeRoomPosition(target),
        RESOURCE_ENERGY
      ).pop();
    } 

    if(!source) {
      source = this.getSource(creep);
    }

    if (!source && _.sum(creep.carry) >= creep.carryCapacity / 2) {
      return this.stopHauling(creep);
    }
    
    if (!source) {
      return;
    }
    
    if (creep.pos.inRangeTo(source, 1)) {
      utils.getResourceFrom(creep, RESOURCE_ENERGY, source);
    } else {
      creep.moveTo(source);
    }
  },
  
  dropOff(creep) {
    const dropoff = this.getDestination(creep);
    if(utils.putResourceTo(creep, RESOURCE_ENERGY, dropoff) == ERR_NOT_IN_RANGE) {
      creep.moveTo(dropoff);
    }
  },

  /** @param {Creep} creep **/
  run: function(creep) {
    if (!creep.memory.hauling && isCarryDepleted(creep)) {
      this.startHauling(creep);
    }
    if (creep.memory.hauling && isCarryAtCapacity(creep)) {
      this.stopHauling(creep);
    }

    if (creep.memory.hauling) {
       this.haul(creep);
    } else {
      this.dropOff(creep);
    }
  }
};

module.exports = roleHauler;
