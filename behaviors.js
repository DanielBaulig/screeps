const behaviors = [
  require('behavior.roadRepair'),
  require('behavior.containerRepair'),
  require('behavior.autoRenew'),
  require('behavior.emergencyUpgrade'),
];

const behaviorsByName = behaviors.reduce((redux, behavior) => Object.assign(redux, {[behavior.name]: behavior}), {});

function runBehavior(behavior, creep) {
  var behaviors = creep.memory.behaviors;
  if(behaviors && behaviors.indexOf(behavior.tag) > -1) {
    behavior.run(creep);
  }
}

module.exports = {
  run: function(creep) {
  const creepBehaviors = creep.memory.behaviors;
  if (!creepBehaviors) {
    return;
  }
  creepBehaviors.forEach((behavior) => {
    if (!behaviorsByName.hasOwnProperty(behavior)) {
      console.log('Unknown behavior', behavior, 'on creep', creep.name);
      return;
    }
    behaviorsByName[behavior].run(creep);
  })
  }
};
