var
	_       = require('lodash'),
	ardrone = require('ar-drone'),
	events  = require('events'),
	fs      = require('fs'),
	meld    = require('meld'),
	path    = require('path'),
	util    = require('util'),
	when    = require('when')
	;

function Drone(name)
{
	events.EventEmitter.call(this);

	this.client       = ardrone.createClient();
	this.name         = name || 'nodecopter';

	// movement goals
	this.goalAltitude = undefined;
	this.goalHeading  = undefined;

	// current state
	this.heading      = undefined;
	this.altitude     = undefined;
	this.isFlying     = false;
	this.flyState     = undefined;

	this.client.config('general:navdata_demo', 'FALSE');
	this.client.on('altitudeChange', this.seekAltitude.bind(this));
	this.client.on('navdata', this.handleNav.bind(this));
	this.client.on('error', this.handleError.bind(this));

	// other emitted events: 'landing', 'landed', 'takeoff', 'hovering', 'flying'
}
util.inherits(Drone, events.EventEmitter);

Drone.prototype.log = function(msg)
{
	this.log(this.name + ': ' + msg);
}

Drone.prototype.selectCamera = function(position)
{
	if (position === 'bottom')
		this.client.config('video:video_channel', 3);
	else if (position === 'front')
		this.client.config('video:video_channel', 0);
	else
	{
		this.log('unknown camera position: ' + position);
		return;
	}

	this.log('camera selected: ' + position);
};

Drone.prototype.takeoff = function()
{
	var self = this,
		deferred = when.defer(),
		t;

	self.client.takeoff(function()
	{
		clearTimeout(t);
		self.client.after(100, function()
		{
			deferred.resolve('OK');
		});
	});

	t = setTimeout(function()
	{
		deferred.reject('TIMEOUT');
	}, 7500);

	return deferred.promise;
};

Drone.prototype.land = function()
{
	var self = this,
		deferred = when.defer(),
		t;

	this.client.land(function()
	{
		clearTimeout(t);
		deferred.resolve('OK');
	});

	t = setTimeout(function()
	{
		deferred.reject('TIMEOUT');
	}, 7500);

	return deferred.promise;
};

Drone.prototype.move = function(time, speed)
{
	var self = this,
		deferred = when.defer();

	var backward = false;
	if (speed < 0)
	{
		backward = true;
		speed = -speed;
	}

	if (backward)
		self.client.back(speed);
	else
		self.client.front(speed);

	self.client.after(time, function()
	{
		self.client.front(0);
		self.client.back(0);
		deferred.resolve('OK');
	});

	return deferred.promise;
};

Drone.prototype.seekAltitude = function(currentAltitude)
{
	var self = this;

	if (_.isUndefined(this.goalAltitude) || _.isUndefined(this.altitudeDeferred))
		return; // no work to do

	var diff = (this.goalAltitude - currentAltitude);

	if (Math.abs(diff) < 0.025)
	{
		this.client.up(0);
		this.client.down(0);
		this.goalAltitude = undefined;

		this.altitudeDeferred.resolve(currentAltitude);
		this.altitudeDeferred = undefined;
	}
	else if (diff > 0)
		this.client.up(0.5);
	else
		this.client.down(0.5);
};

Drone.prototype.seekHeading = function(currentHeading)
{
	if (_.isUndefined(this.goalHeading) || _.isUndefined(this.headingDeferred))
		return;

	var diff = (this.goalHeading - currentHeading);
	if (Math.abs(diff) < 0.025)
	{
		this.log('goal heading reached, diff=' +diff);
		this.client.clockwise(0);
		this.goalHeading = undefined;

		this.headingDeferred.resolve(currentHeading);
		this.headingDeferred = undefined;
	}
	else if (diff < 0)
		this.client.counterClockwise(0.3);
	else
		this.client.clockwise(0.3);
};

Drone.prototype.handleError = function(error)
{
	this.log('error: ' + JSON.stringify(error));
	// probably reject all deferreds in progress
}

Drone.prototype.handleNav = function(navdata)
{
	if (!navdata.demo)
		return;

	this.heading  = navdata.demo.rotation.clockwise;
	this.altitude = navdata.demo.altitudeMeters;
	this.controlState = navdata.demo.controlState;

	this.seekHeading(navdata.demo.rotation.clockwise);
};

Drone.prototype.moveToAltitude = function(height)
{
	this.goalAltitude = height;
	this.altitudeDeferred = when.defer();

	return this.altitudeDeferred.promise;
};

Drone.prototype.turnToHeading = function(heading)
{
	if (heading > 180 || heading < -180)
	{
		console.log("Heading should be in [-180...180]");
		return;
	}

	this.goalHeading = heading;
	this.headingDeferred = when.defer();

	return this.headingDeferred.promise;
};

Drone.prototype.pngs = function()
{
	if (!this.pngStream)
		this.pngStream = this.client.getPngStream();

	return this.pngStream;
};

Drone.prototype.savePNGStream = function(desired, imgdir)
{
	var self = this;
	desired = desired || 50;
	imgdir = imgdir || 'images';

	this.pngStream = this.client.getPngStream();

	var counter = 0;
	self.log('storing the next ' + desired + ' pngs');

	function handlePNG(data)
	{
		var imgfile = path.join(imgdir, util.format('%s_%d.png', self.name, counter);

		fs.writeFile(imgfile, data, function(e)
		{
			if (e)
				self.log('error writing png ' + imgfile);
		});

		if (++counter > desired)
			stopGrabbing();
	}

	function stopGrabbing()
	{
		self.log('png stream complete');
		self.pngStream.removeListener('data', handlePNG);
		self.emit('pngs');
	}

	this.pngStream.on('data', handlePNG);
};

Drone.prototype.animate = function(type, duration)
{
	// just punch through for now; I have an idea about timings here--- the
	// idea is to perform just one of any specific movement
	drone.client.animate(type, duration);
};

module.exports = Drone;
