const utils = require('utils');

module.exports = {
  name: 'warrior',
  getBody(maxEnergy) {
    const bodies = [
      [],
      [MOVE, ATTACK], // 130
      [MOVE, ATTACK, ATTACK], // 210
      [MOVE, MOVE, ATTACK, ATTACK], // 260
      [MOVE, MOVE, ATTACK, ATTACK, ATTACK], // 340
      [MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK], // 420
      [MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK], // 520
      [MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], // 630
      [MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, TOUGH, TOUGH], // 700
      [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, TOUGH, TOUGH, TOUGH, TOUGH], // 770
      [MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], // 840
      [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], // 1050
      [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK], // 1260
    ].reverse();
    
    const body = bodies.find((b) => utils.getBodyEnergyCost(b) <= maxEnergy);
    
    return body;  
  },
  getTarget(creep) {
    let target = creep.memory.assignedTo ?
      creep.memory.assignedTo :
      creep.memory.target;
    const leader = this.getLeader(creep);
    if (leader) {
      target = this.getTarget(leader);
    }
    if (target in Game.flags) {
      return Game.flags[target];
    }
    if (target in Game.creeps) {
      return Game.creeps[target];
    }
    return Game.getObjectById(target);
  },
  getMission(creep) {
    let mission = creep.memory.mission;
    const leader = this.getLeader(creep);
    if (leader) {
      mission = this.getMission(leader);
    }
    return mission;
  },
  getLeader(creep) {
    const leaderName = creep.memory.leader;
    if (!leaderName in Game.creeps) {
      return null;
    }
    return Game.creeps[leaderName];
  },
  getPosition(o) {
    if (o instanceof RoomPosition) {
      return o;
    }
    if (o instanceof RoomObject) {
      return o.pos;
    }
  },
  getObject(o) {
    if (o instanceof Flag) {
      o = this.getPosition(o);
    }
    if (o instanceof RoomPosition) {
      let objects = o.look();
      for(let i = 0; i < objects.length; i++) {
        let object = objects[i];
        switch (object.type) {
          case LOOK_CREEPS:
              return object.creep;
          case LOOK_STRUCTURES:
              return object.structure;
          case LOOK_CONSTRUCTION_SITES:
            return object;
        }
      }
    }
  },
  getThreatRange() {
    return 5;  
  },
  getThreats(position) {
    return position.roomName in Game.rooms ? position.findInRange(FIND_HOSTILE_CREEPS, this.getThreatRange()) : []    
  },
  guard(creep, position) {
    let threats = this.getThreats(position);
    let target = utils.getPriorityTarget(threats);
    if (target) {
      this.attack(creep, target);
    } else {
      creep.moveTo(position);
    }
  },
  attack(creep, hostile) {
    if (creep.attack(hostile) == ERR_NOT_IN_RANGE) {
      creep.moveTo(hostile);
    }
  },
  run(creep) {
    let target = this.getTarget(creep);
    let mission = this.getMission(creep);
    
    let threats = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1, {filter: (c) => utils.getThreatLevel(c) > 0});
    if (threats.length) {
      this.attack(creep, utils.getPriorityTarget(threats));
    }
    
    switch (mission) {
      case 'attack':
        if (target) {
          this.attack(creep, this.getObject(target));   
          break;
        }
      case 'guard':
      default:
        if (!target) {
          target = creep.pos;
        }
        this.guard(creep, this.getPosition(target));
    }
  },
};
