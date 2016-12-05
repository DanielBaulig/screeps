const roles = require('roles');
const behaviors = require('behaviors');
const log = require('log');

module.exports = {
  run(creeps) {
  const cpuByRole = { };
  const runCreepsStartCPU = Game.cpu.getUsed();
  for(name in creeps) {
    const runCreepStartCPU = Game.cpu.getUsed();
    var creep = Game.creeps[name];
    behaviors.run(creep);
    roles.run(creep);
    
    cpuByRole[roles.getRole(creep)] = (cpuByRole[roles.getRole(creep)] || 0) + Game.cpu.getUsed() - runCreepStartCPU;
  }
  log.perf('CPU used by running creeps', Game.cpu.getUsed() - runCreepsStartCPU);
  _.forEach(cpuByRole, (role, cpu) => log.perf(role, cpu));
  }
};
