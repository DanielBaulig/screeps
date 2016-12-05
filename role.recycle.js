/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.recycle');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
  name: 'recycle',
  getSpawn(creep) {
    if (creep.memory.spawn) {
      return Game.getObjectById(creep.memory.spawn);
    }
    if (creep.pos.roomName != creep.memory.home) {
      return Game.rooms[creep.memory.home].find(FIND_MY_SPAWNS).pop();
    }
    return creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  },
  run(creep) {
    const spawn = this.getSpawn(creep);
    if (spawn) {
      creep.memory.spawn = spawn.id;
    }
    
    if (!(spawn instanceof StructureSpawn) || spawn.recycleCreep(creep) == ERR_NOT_IN_RANGE) {
      creep.moveTo(spawn);
    }
  }
};
