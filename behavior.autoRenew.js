module.exports = {
  name: 'autoRenew',
  run(creep) {
    const ticksReplenished = 600 / creep.body.length;
    if (creep.ticksToLive <= 1500 - ticksReplenished) {
      const spawns = creep.pos.findInRange(FIND_MY_SPAWNS, 1);
      spawns.forEach((spawn) => {
        if (spawn.renewCreep(creep) == OK) {
          creep.say('renewed');
        }
      });    
    }
  }
};
