const utils = require('utils');
const CreepBodyPartCosts = require('CreepBodyPartCosts');
const {
  isCarryAtCapacity,
  isCarryDepleted,
} = require('filters');

function getSource(creep) {
  let source = creep.memory.source;
  if (source) {
    if (source in Game.flags) {
      const flag = Game.flags[source];
      if (!(flag.pos.roomName in Game.rooms)) {
        return flag.pos;
      }
      
      source = (Game.flags[source].pos.lookFor(LOOK_SOURCES)).pop();
      return source;
    }
    return Game.getObjectById(source);
  } else {
    return utils.getClosestEnergySource(creep);
  }
}

function rememberSource(creep, source) {
  if (source) {
    creep.memory.source = source.id;
  }
}

function forgetSource(creep) {
  delete creep.memory.source;
}

var roleHarvester = {
  name: 'miner',
  getBody(maxEnergy) {
    if (maxEnergy < 50) {
      return [];
    }
    let move = [MOVE];
    const workParts = new Array(Math.min(Math.floor((maxEnergy - utils.getBodyEnergyCost(move)) / CreepBodyPartCosts[WORK]), 5));
    workParts.fill(WORK);
    return move.concat(workParts);
  },
  /** @param {Creep} creep **/
  run: function(creep) {
    if(!creep.memory.mining && isCarryDepleted(creep)) {
      creep.memory.mining = true;
      creep.say('mining');
    } else if(creep.memory.mining && creep.carryCapacity && isCarryAtCapacity(creep)) {
      creep.memory.mining = false;
      creep.say('dropping');
    }

    if (creep.memory.mining) {
      const source = getSource(creep);
      const result = utils.getResourceFrom(creep, RESOURCE_ENERGY, source);
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    } else {
      let containers = creep.pos.findInRange(
        FIND_STRUCTURES, 
        1, 
        { filter: isContainer }
      );
      if (containers.length) {
        creep.transfer(containers[0], RESOURCE_ENERGY);
      } else {
        creep.drop(RESOURCE_ENERGY);
      }
    }
  }
};

module.exports = roleHarvester;