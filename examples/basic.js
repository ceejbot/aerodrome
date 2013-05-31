var Aerogel = require('../index');
var drone = new Aerogel();

drone.takeoff()
	.then(drone.moveToAltitude(3.0))
	.then(drone.turnToHeading(90))
	.then(drone.move(2000, 0.5))
	.then(drone.land());
