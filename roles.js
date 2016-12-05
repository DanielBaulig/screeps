const utils = require('utils');

const roles = [
  require('role.harvester'), 
  require('role.builder'), 
  require('role.upgrader'), 
  require('role.miner'), 
  require('role.hauler'), 
  require('role.recycle'), 
  require('role.warrior'),
];

const rolesByName = roles.reduce((redux, role) => Object.assign(redux, { [role.name]: role }), {});
const availableRoles = Object.keys(rolesByName);

function getCreepDefaultBody(maxEnergy) {
  const defaultBodies = [
    [],
    [MOVE], // 50
    [MOVE, CARRY], // 100
    [MOVE, CARRY, CARRY], // 150
    [MOVE, CARRY, WORK], // 200
    [MOVE, CARRY, WORK, WORK], // 300
    [MOVE, CARRY, CARRY, WORK, WORK], // 350 
    [MOVE, MOVE, CARRY, CARRY, WORK, WORK], // 400 
    [MOVE, MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK], // 550 
    [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK], // 600
    [MOVE, MOVE, MOVE, CARRY, CARRY, WORK, WORK, WORK, WORK], // 650
    [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK], // 750
    [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK], // 800
  ].reverse();
  
  const body = defaultBodies.find((b) => utils.getBodyEnergyCost(b) <= maxEnergy);
  
  return body;
}

function getBehaviorsByRole(role) {
  switch (role) {
    case 'harvester':
      return ['roadRepair', 'containerRepair'];
    case 'builder':
      return  ['roadRepair', 'containerRepair', 'autoRenew'];
    case 'upgrader':
    case 'hauler':
      return ['autoRenew'];
    case 'miner':
    default:
      return [];
  }
}

module.exports = {
  getCreepBody(role, maxEnergy) {
    if (!role in rolesByName) {
      return [];
    }
    const roleModule = rolesByName[role];
    if (typeof roleModule.getBody == 'function') {
      return roleModule.getBody(maxEnergy);
    } else {
      return getCreepDefaultBody(maxEnergy);
    }
  },
  availableRoles,
  getBehaviorsByRole,
  run: function(creep) {
    const startCPU = Game.cpu.getUsed();
    const role = creep.memory.role;
    if (!rolesByName.hasOwnProperty(role)) {
      console.log('Role', role, 'is not a valid role on creep', creep.name);
      return;
    }
    
    rolesByName[role].run(creep);
  },
  getRole(creep) {
    return creep.memory.role;
  },
};
