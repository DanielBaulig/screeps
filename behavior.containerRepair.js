const utils = require('utils');

module.exports = {
  name: 'containerRepair',
  run: function(creep) {
    if (!creep.carry.energy) {
      return;
    }
    
    var containers = creep.pos.findInRange(FIND_STRUCTURES, 1, { filter: (structure) => structure instanceof StructureContainer })
    if (containers.length && containers[0].hits < (containers[0].hitsMax - utils.getCreepRepairPower(creep))) {
    creep.repair(containers[0])
    creep.say('repaired');   
    }
  }
};
