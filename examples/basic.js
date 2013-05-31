var aerogel = require('../index');
var drone = new aerogel.Drone();

drone.takeoff()
	.then(drone.moveToAltitude(3.0))
	.then(drone.turnToHeading(90))
	.then(drone.move(2000, 0.5))
	.then(drone.land(), function(err)
	{
		console.log('awwww, something went wrong: ' + err);
		process.exit(1);
	}).then(function()
	{
		process.exit(0);
	});
