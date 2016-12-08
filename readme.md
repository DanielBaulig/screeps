This is my screeps repository. If you don't know what screeps is, checkout their
website at https://www.screeps.com

My current GCL is 2

The basic philosophy behind my screeps code is to have a healthy mix of
configuration (mostly through memory), direct planning (utilizing flags) and 
automatic adjustment to changing situations through the `developer` and 
`strategy` modules (work on latter has not begun yet).  

I am still pretty new to the game and for the most part I've only had a single
controller and room. I've dabbled a little bit in combat and accessing other
rooms to farm resources though. I just recently reached GCL 2 and have now
access to a second controller. I am still adjusting my scripts to scale to the
new setup. I will probably end up refactoring large parts to accomodate for that.
Even though my creep number is steadily increasing I have yet to have the need
for a routing module for optimized and cached path finding, although that will 
likely change in the future.

Some shortcomings of my code that I will likely be addressing going forward:

- Lack of central routes and route planning. Causes lots of gcpu waste and
  multiple creeps to often select the same destination when one would suffice.
- My combat and defense code is pretty shitty and mostly depending on manual
  guard points.
- There's no logging, especially not for engagements with enemies. My last base
  was completely wiped out while I was offline and I never learned who did it
and how (I thought I had sufficient defenses in place). This has not yet been
addressed.
- When upgraders have been over-produced, they are not auto-recycled and
  continue to be renewed, unnecesarily draining resources. 
