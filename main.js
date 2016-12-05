const behaviors = require('behaviors');
const roadRepair = require('behavior.roadRepair').tag;
const containerRepair = require('behavior.containerRepair').tag;
const roles = require('roles');
const utils = require('utils');
const towers = require('towers');
const creeps = require('creeps');
const developer = require('developer');
const log = require('log');
const {
  getCreepBody
} = require('developer');
const {
  isContainer,
  isStoreAtCapacity,
  isTower,
} = require('filters');


module.exports.loop = function () {
  log.perf('Time used at entry point', Game.cpu.getUsed());
  for(var name in Game.rooms) {
    const room = Game.rooms[name];
    
    const myTowers = room.find(FIND_MY_STRUCTURES, {
      filter: isTower,
    });
    myTowers.forEach((t) => towers.run(t));
    
    if (room.controller && room.controller.my) {
      let developerStartCPU = Game.cpu.getUsed();
      developer.run(room);
      log.perf('CPU used by developer', Game.cpu.getUsed() - developerStartCPU);
    }
  }
  
  let deleteMemoryStartCPU = Game.cpu.getUsed();
  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
  for (var flag in Memory.flags) {
    if (!Game.flags[flag]) {
      delete Memory.flags[flag];
    }
  }
  log.perf('CPU used by deleting Memory', Game.cpu.getUsed() - deleteMemoryStartCPU);
  
  creeps.run(Game.creeps);
  
  log.perf('Total time used', Game.cpu.getUsed());
}
