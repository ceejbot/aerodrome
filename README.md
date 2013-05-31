aerogel
=======

Nodecopter control abstractions: for your apocalyptic robot air force.

This module wraps [node-ar-drone](https://github.com/felixge/node-ar-drone) with some higher-level control abstractions and a Promises API. The promises library used is [when.js](https://github.com/cujojs/when), which is [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/) compliant, so you may proceed with confidence.

__Current version:__ not yet released  
Travis status TBD  

```javascript
var aerogel = require('aerogel');
var drone = new Aerogel();

drone.takeoff()
	.then(drone.moveToAltitude(3.0))
	.then(drone.turnToHeading(90))
	.then(drone.move(2000, 0.5))
	.then(drone.land());
```

## The plan

Promises for anything that takes a callback in the ar-drone client library.

The client is available as `drone.client` in case you need to do something directly with the ar-drone API.

Events/streams for repeating events (still images, video, nav data you've asked to subscribe to).

Loggable events emitted as `log` events for listeners to log in whatever manner they choose.

Control primitives:

* heading/setHeading
* altitude/setAltitude
* battery level / emitted warnings on battery level
* move (speed, time)
* position/setPosition (relative to starting point) ? 

PNG/video:

* stream images to files
* stream video to a file
* give me the last image snapped

State:

* available as properties of the drone object
* 

## What's working

Basic takeoff & landing. Timed movement.

## What's not working

Everything else.


## Drone API

Docs TBD.

## Testing

Possible sans drone?

## License

MIT.
