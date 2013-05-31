aerogel
=======

Nodecopter control abstractions: for your apocalyptic robot air force.

__Current version:__ not yet released  
Travis status TBD  

## The plan

Promises for anything that takes a callback in the ar-drone client library.

Events/streams for repeating events (still images, video, nav data you've asked to subscribe to).

Control primitives

* heading/setHeading
* altitude/setAltitude
* battery level / emitted warnings on battery level
* move (speed, time)
* position/setPosition (relative to starting point) ? 

stream images to files
give me the last image

## What's working

Basic takeoff & landing. Timed movement.

## What's not working

Everything else.


## Drone API


```javascript
var aerogel = require('aerogel');
var drone = new Aerogel();

drone.takeoff()
	.then(drone.moveToAltitude(3.0))
	.then(drone.turnToHeading(90))
	.then(drone.move(2000, 0.5))
	.then(drone.land());

```

TBD.

## Testing

Possible sans drone?

## License

MIT.
