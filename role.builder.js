var utils = require('utils');
const { isCarryAtCapacity, isCarryDepleted } = require('filters');

var roleBuilder = {
  name: 'builder',
  /** @param {Creep} creep **/
  run: function(creep) {
    if(creep.memory.building && isCarryDepleted(creep)) {
      creep.memory.building = false;
      creep.say('collecting');
    }
    if(!creep.memory.building && isCarryAtCapacity(creep)) {
      creep.memory.building = true;
      creep.say('building');
    }

    if(creep.memory.building) {
      const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      if (!site) {
        const structureNeedingRepair = creep.pos.findClosestByPath(
          FIND_STRUCTURES, 
          { filter: (s) => s.hits < s.hitsMax - utils.getCreepRepairPower(creep) }
         );
         if (creep.repair(structureNeedingRepair) == ERR_NOT_IN_RANGE) {
           creep.moveTo(structureNeedingRepair);
         } else if (structureNeedingRepair && !creep.pos.inRangeTo(structureNeedingRepair, 1)) {
           creep.moveTo(structureNeedingRepair)
         }
      }
      
      if (!site) {
        return;
      }
      
      if (creep.build(site) == ERR_NOT_IN_RANGE) {
        creep.moveTo(site);
      } else if (!creep.pos.inRangeTo(site, 1)) {
        creep.moveTo(site);
      }
    } else {
      var source = utils.getBestEnergyPickup(creep);
      if (utils.getResourceFrom(creep, RESOURCE_ENERGY, source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      }
    }
  }
};

module.exports = roleBuilder;
