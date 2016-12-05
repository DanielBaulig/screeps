const {
  isDamaged,
  isDamagedMoreThan,
  isWall,
} = require('filters');

module.exports = {
  run: function(tower) {
    if (tower.room.memory.towerTarget) {
      return tower.repair(Game.getObjectById(tower.room.memory.towerTarget));
    }
    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
      return tower.attack(closestHostile);
    }
    
    var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => isDamaged(structure) && !isWall(structure)
    });
    if(closestDamagedStructure) {
      tower.repair(closestDamagedStructure);
    }

    const badlyDamagedStructures = tower.room.find(FIND_STRUCTURES, {
      filter: (s) => isDamagedMoreThan(s, 90) && s.hits < 250000,
    }).sort((ls, rs) => rs.hits - ls.hits);
    if (badlyDamagedStructures) {
      tower.repair(badlyDamagedStructures.pop());
    }
    
  }
};
