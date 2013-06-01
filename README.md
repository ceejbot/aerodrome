aerogel
=======

Nodecopter control abstractions for your apocalyptic robot air force.

```javascript
var aerogel = require('aerogel');
var drone = new aerogel.Drone();

drone.takeoff()
	.then(drone.moveToAltitude(3.0))
	.then(drone.turnToHeading(90))
	.then(drone.move(2000, 0.5))
	.then(drone.land());
```

This module wraps [node-ar-drone](https://github.com/felixge/node-ar-drone) with some higher-level control abstractions and a Promises API. The promises library used is [when.js](https://github.com/cujojs/when), which is [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/) compliant, so you may proceed with confidence in your plans for aerial domination and the destruction of all nodebots.

__Current version:__ not yet released  
__TravisCI status:__ TBD  

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
* animations, somehow

PNG/video:

* stream images to files
* stream video to a file
* give me the last image snapped

State:

* available as properties of the drone object
* altitude / heading
* current speed forward/back

## What's working

Basic takeoff & landing. Timed movement.

## What's not working

Everything else.


## Drone API

Docs TBD.

### new areogel.Drone(*name*)

Create a new drone object. The `name` parameter is used in log events and in file names for saved images & videos.

### drone.client

The underlying ar-drone client object is available in `drone.client` if you need more direct access.


### drone.savePNGStream(*count*, *dir*)

Save the next `count` pngs captured by the drone into the directory specified by `dir`. Images are named 

## Testing

Possible sans drone?

## Contributions

Allman bracing, tabs to indent, camel case. Write tests in Mocha.

## License

MIT.
