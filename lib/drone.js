var
    _       = require('lodash'),
    cv      = require('opencv'),
    ardrone = require('ar-drone'),
    events  = require('events'),
    fs      = require('fs'),
    util    = require('util')
    ;

var pixels = require('./pixels.js')({ size: { width: 50, height: 50 } });
var classifier = require('./classifier.js')({ debug: false});

function Drone()
{
    events.EventEmitter.call(this);
    this.client = ardrone.createClient();
    this.goalAltitude = undefined;
    this.goalHeading = undefined;
    this.heading = undefined;
    this.client.config('general:navdata_demo', 'FALSE');
    this.client.on('navdata', this.handleNav.bind(this));
}
util.inherits(Drone, events.EventEmitter);

Drone.prototype.selectCamera = function(position)
{
    if (position === 'bottom')
        this.client.config('video:video_channel', 3);
    else
        this.client.config('video:video_channel', 0);

    console.log('camera', position, 'selected');
};

Drone.prototype.takeoff = function(cb)
{
    var self = this;

    self.client.takeoff(function() {
        self.client.after(500, cb);
    });
};

Drone.prototype.move = function(time, speed, cb)
{
    var self = this;

    var backward = false;
    if (speed < 0) {
        backward = true;
        speed = -speed;
    }

    if (backward)
        self.client.back(speed);
    else
        self.client.front(speed);

    self.client.after(time, function() {
        self.client.stop();
        self.client.after(100, cb);
    });
};

Drone.prototype.seekAltitude = function(navdata) {
    if (_.isUndefined(this.goalAltitude))
        return;

        var currAlt = navdata.demo.altitudeMeters;
        var diff = (this.goalAltitude - currAlt);

        if (Math.abs(diff) < 0.025) {
            console.log('goal altitude reached');
            this.client.up(0);
            this.client.down(0);
            this.goalAltitude = undefined;
            this.emit('altitude', currAlt);
        }
        else if (diff > 0)
            this.client.up(0.5);
        else
            this.client.down(0.5);
};

Drone.prototype.seekHeading = function(navdata) {
    if (_.isUndefined(this.goalHeading))
        return;
    var currentHeading = navdata.demo.rotation.clockwise;

    diff = (this.goalHeading - currentHeading);
    if (Math.abs(diff) < 0.025)
    {
        console.log('goal heading reached, diff=' +diff);
        this.client.clockwise(0);
        this.goalHeading = undefined;
        this.emit('heading');
    } else if (diff < 0) {
        this.client.counterClockwise(0.3);
    } else {
        this.client.clockwise(0.3);
    }
};

Drone.prototype.handleNav = function(navdata)
{
    if (!navdata.demo) {
        console.log('navdata.demo not available!');
        return;
    }

    this.heading = navdata.demo.rotation.clockwise;
    this.seekAltitude(navdata);
    this.seekHeading(navdata);
};

Drone.prototype.moveToAltitude = function(height)
{
    this.goalAltitude = height;
};


Drone.prototype.streamPNGS = function()
{
    var self = this;
    this.pngStream = this.client.getPngStream();
    this.cvImageStream = new cv.ImageStream();

    this.cvImageStream.on('data', function(matrix) {
        pixels.handle(matrix, function(err) {
            if (err)
                return;
            var fitness = classifier.fitness(pixels);
            // fitness is a number evaluating the goodness of our heading
            self.emit('fitness', fitness);
        });
    });

    this.pngStream.pipe(this.cvImageStream);
};

Drone.prototype.stopStreamingPNGs = function()
{
    this.pngStream.unpipe(this.cvImageStream);
};

Drone.prototype.grabPNGs = function(desired)
{
    var self = this;
    desired = desired || 50;
    this.pngStream = this.client.getPngStream();

    var counter = 0;
    console.log('requesting ' + desired + ' pngs');

    var handlePNG = function handlePNG(data)
    {
        var imgfile = 'images/image' + counter + '.png';

        fs.writeFile(imgfile, data, function(e) {
            if (e) {
                console.log('alas video fail');
                return;
            }
            cv.readImage('images/image.png', function(err, im) {
                var w = im.width();
                var h = im.height();
                var center = im.get(Math.floor(im.width() / 2), Math.floor(im.height() / 2));
                console.log('w:', w, 'h:', h, 'center:', center);
            });
        });

        if (++counter > desired)
            stopGrabbing();
    };

    function stopGrabbing()
    {
        console.log('stopping png grabs');
        self.pngStream.removeListener('data', handlePNG);
        drone.emit('pngs');
    }

    this.pngStream.on('data', handlePNG);
};

Drone.prototype.turnToHeading = function(heading) {
    if (heading > 180 || heading < -180) {
        console.log("Heading should be in [-180...180]");
    }
    this.goalHeading = heading;
};
module.exports = Drone;
