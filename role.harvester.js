const utils = require('utils');
const {
  isCarryAtCapacity,
  isCarryDepleted,
} = require('filters');

var roleHarvester = {
  getBody(maxEnergy) {
    const bodies = [
      [],
      [MOVE, CARRY, WORK, WORK], // 300
      [MOVE, CARRY, CARRY, WORK, WORK], // 350
      [MOVE, MOVE,  CARRY, CARRY, WORK, WORK], // 400
      [MOVE, MOVE,  CARRY, CARRY, WORK, WORK, WORK, WORK], // 600
      [MOVE, MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK], // 750
      [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK], // 850
      [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK], // 1050
    ].reverse();
    const body = bodies.find((b) => utils.getBodyEnergyCost(b) <= maxEnergy);

    return body;
  },
  name: 'harvester',
  getSource(creep) {
    let location = null;
    
    if (creep.memory.source) {
      location = utils.getFlagLocation(creep.memory.source);
    }
    
    if (!location) {
      return utils.getBestEnergySource(creep);  
    }
    
    if (!(location.roomName in Game.rooms)) {
      // We don't have access to the room the Flag is in,
      // just move towards the Flag for now
      return location;
    }

    return utils.lookForSources(location).pop();
  },
  
  getDestination(creep) {
    let location = null;
    
    if (creep.memory.dest) {
      location = utils.getFlagLocation(creep.memory.dest);
    }
    
    if (!location) {
      return utils.getBestEnergyDropOff(creep);
    }
    
    const dropOffs = utils.lookForDropOffs(location);
    return dropOffs.length ? dropOffs.pop() : location;
  },

  /** @param {Creep} creep **/
  run: function(creep) {
    if(!creep.memory.harvesting && isCarryDepleted(creep)) {
      creep.memory.harvesting = true;
      creep.say('harvesting');
    }
    if(creep.memory.harvesting && isCarryAtCapacity(creep)) {
      creep.memory.harvesting = false;
      creep.say('delivering');
    }

    if (creep.memory.harvesting) {
      var source = this.getSource(creep);
      
      if (creep.pos.inRangeTo(source, 1)) {
        utils.getResourceFrom(creep, RESOURCE_ENERGY, source);
      } else {
        creep.moveTo(source);
      }
    } else {
      const dropoff = this.getDestination(creep);
      if(creep.transfer(dropoff, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(dropoff);
      }
    }
  }
};

module.exports = roleHarvester;
