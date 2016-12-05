var utils = require('utils');

var roleUpgrader = {
  name: 'upgrader',
  /** @param {Creep} creep **/
  run: function(creep) {

    if(creep.memory.upgrading && creep.carry.energy == 0) {
      creep.memory.upgrading = false;
      creep.say('collecting');
    }
    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
      creep.memory.upgrading = true;
      creep.say('upgrading');
    }

    if(creep.memory.upgrading) {
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
    }
    else {
      var source = utils.getBestEnergyPickup(creep);
      if (utils.getResourceFrom(creep, RESOURCE_ENERGY, source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    }
  }
};

module.exports = roleUpgrader;
