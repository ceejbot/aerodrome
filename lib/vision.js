// Eventually will move the vision processing here.

var
	cv = require('opencv')
	;


//var pixels = require('./pixels.js')({ size: { width: 50, height: 50 } });
//var classifier = require('./classifier.js')({ debug: false});

/*
	Drone.prototype.streamPNGS = function()
	{
		var self = this;
		this.pngStream = this.client.getPngStream();
		this.cvImageStream = new cv.ImageStream();

		this.cvImageStream.on('data', function(matrix)
		{
			pixels.handle(matrix, function(err)
			{
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
*/
