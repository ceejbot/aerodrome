var
	_       = require('lodash'),
	ardrone = require('ar-drone'),
	events  = require('events'),
	fs      = require('fs'),
	meld    = require('meld'),
	util    = require('util'),
	when    = require('when')
	;

function Drone()
{
	events.EventEmitter.call(this);

	this.client       = ardrone.createClient();

	// movement goals
	this.goalAltitude = undefined;
	this.goalHeading  = undefined;

	// current state
	this.heading      = undefined;
	this.altitude     = undefined;

	this.client.config('general:navdata_demo', 'FALSE');
	this.client.on('navdata', this.handleNav.bind(this));
}
util.inherits(Drone, events.EventEmitter);

Drone.prototype.selectCamera = function(position)
{
	if (position === 'bottom')
		this.client.config('video:video_channel', 3);
	else if (position === 'front')
		this.client.config('video:video_channel', 0);
	else
		return this.emit('log', 'unknown camera position: ' + position);

	this.emit('log', 'camera selected: ' + position);
};

Drone.prototype.takeoff = function()
{
	var self = this,
		deferred = when.defer(),
		t;

	self.client.takeoff(function()
	{
		clearTimeout(t);
		self.client.after(250, function()
		{
			deferred.resolve('OK');
		});
	});

	var t = setTimeout(function()
	{
		deferred.reject('TIMEOUT');
	});

	return deferred.promise;
};

Drone.prototype.land = function()
{
	var self = this,
		deferred = when.defer();

	this.client.land(function()
	{
		deferred.resolve('OK');
	});

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
		self.client.stop();
		self.client.after(100, function()
		{
			deferred.resolve('OK');
		});
	});

	return deferred.promise;
};

Drone.prototype.seekAltitude = function(navdata)
{
	var self = this;

	if (_.isUndefined(this.goalAltitude) || _.isUndefined(this.altitudeDeferred))
		return; // no work to do

	var currAlt = navdata.demo.altitudeMeters;
	var diff = (this.goalAltitude - currAlt);

	if (Math.abs(diff) < 0.025)
	{
		this.client.up(0);
		this.client.down(0);
		this.goalAltitude = undefined;

		this.altitudeDeferred.resolve(currAlt);
		this.altitudeDeferred = undefined;
	}
	else if (diff > 0)
		this.client.up(0.5);
	else
		this.client.down(0.5);
};

Drone.prototype.seekHeading = function(navdata)
{
	if (_.isUndefined(this.goalHeading) || _.isUndefined(this.headingDeferred))
		return;
	var currentHeading = navdata.demo.rotation.clockwise;

	var diff = (this.goalHeading - currentHeading);
	if (Math.abs(diff) < 0.025)
	{
		this.emit('log', 'goal heading reached, diff=' +diff);
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

Drone.prototype.handleNav = function(navdata)
{
	if (!navdata.demo)
		return;

	this.heading = navdata.demo.rotation.clockwise;
	this.altitude = navdata.demo.altitudeMeters;

	this.seekAltitude(navdata);
	this.seekHeading(navdata);
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
}


Drone.prototype.grabPNGs = function(desired)
{
	var self = this;
	desired = desired || 50;
	this.pngStream = this.client.getPngStream();

	var counter = 0;
	self.emit('log', 'requesting ' + desired + ' pngs');

	function handlePNG(data)
	{
		var imgfile = 'images/image' + counter + '.png';

		fs.writeFile(imgfile, data, function(e)
		{
			if (e)
				self.emit('log', 'error writing png ' + imgfile);
		});

		if (++counter > desired)
			stopGrabbing();
	}

	function stopGrabbing()
	{
		self.emit('log', 'png grabbing complete');
		self.pngStream.removeListener('data', handlePNG);
		self.emit('pngs');
	}

	this.pngStream.on('data', handlePNG);
};


module.exports = Drone;
