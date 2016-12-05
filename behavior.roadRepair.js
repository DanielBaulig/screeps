var utils = require('utils');

module.exports = {
  name: 'roadRepair',
  run: function(creep) {
    if (!creep.carry.energy) {
      return;
    }
    
    var structures = creep.pos.lookFor(LOOK_STRUCTURES);
    var roads = _.filter(structures, function(structure) { return structure.structureType == STRUCTURE_ROAD; });
    
    if (roads.length && roads[0].hits < roads[0].hitsMax - utils.getCreepRepairPower(creep)) {
      creep.repair(roads[0]);
      creep.say('repaired');
    }
  }
};
