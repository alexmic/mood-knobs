var spm = sp.require("app/spotify-metadata");

var Song = function(data) 
{
	var title = data.title,
		artist = data.artist_name,
		top  = 0,
		spUrl = null,
		elem = $("<div class='song'>" + title + "</div>")
				.css({
					top: top,
					position: 'absolute'
				}),
		speed = 1;
	
	// Find spotify url.
	var onDrag = function() {
		console.log("start drag");
		var onSearchReturn = function(err, tracks) {
			if (err) {
				throw "Blow";
			} 
			if (tracks) {
				console.log(tracks);
			}
		}
		spm.searchForTrack(artist, 
						   title,
						   onSearchReturn);
	
	};
	
	
	$("#anim").append(elem);
	
	elem.draggable({
		helper: 'clone',
		containment: '#main',
		start: onDrag
	});
	
	return {
		
		update: function() 
		{
				top += speed;
				elem.css('top', top);
		},
		
		inBounds: function()
		{
			return true;
		}
	}

};

var Knob = function(elemId, searchTerm, initialValue)
{
	var elemId     = elemId,
		elem       = $("#" + elemId),
		searchTerm = searchTerm,
		rad2deg    = 180/Math.PI,
		deg 	   = 0,
		barsElem   = null,
		steps      = 10,
		height     = elem.height(),
		width      = elem.width(),
		radius	   = null,
		initial    = initialValue || 0,
		colors     = [
			'26e000','51ef00','B8FF05','FFEA05','FFC60A',
			'ff8607','ff7005', 'ff5f04','ff4f03','f83a00','ee2b00'
		];
	
	return {
		
		boost: 0,
		
		getQS: function() 
		{
			return searchTerm + "^" + this.boost;	
		},
		
		draw: function() 
		{
			elem.empty();
			
			elem.html(
				"<div class='bars'>" +
					"<div class='text'>" +
					searchTerm +
					"</div>" +
					"<div class='control'>" +
					"</div>" +
				"</div>");
			
			barsElem = elem.find(".bars");
			radius   = elem.find(".control").width() / 1.2;
			
			// Draw dials (bars).
			for(var i = 1; i < steps; i++) {
				deg = i*18;
				$('<div class="colorBar">').css({
					transform:'rotate('+deg+'deg)',
					top: -Math.sin(deg/rad2deg)*radius+height/1.5,
					left: Math.cos((180 - deg)/rad2deg)*radius+width/2.15,
				}).attr("active-color", "#" + colors[i]).appendTo(barsElem);
			}
			
			var colorBars = barsElem.find('.colorBar');
			
			// Draw knob.
			var that = this;
			$("#" + elemId + " div.bars div.control").knobKnob({
				snap : 10,
				value: initial,
				turn : function(ratio) {
					var dialStep = Math.min(9, Math.round((ratio * steps) / 0.5));
					that.boost   = Math.min(2, Math.round((10 * (ratio * 2) / 0.5)) / 10);
					colorBars.each(function(i, e) {
						if (i >= dialStep) {
							$(e).css("backgroundColor", "black");
						} else {
							$(e).css("backgroundColor", $(e).attr("active-color"));
						}
					});
				}
			});
		}
	};
	
};


var App = function() 
{
	var knobs     = [],
		mainElem  = $("#main"),
		running   = false,
		apiKey    = "N6E4NIOVYMTHNDM8J",
		params    = $.param({
			api_key : apiKey,
			format  : 'json',
			results : 100
		}),
		baseQuery = 'http://developer.echonest.com/api/v4/song/search?' + params,
		titleElem = $("#title"); 
	
	return {
		
		buffer: [],
		init: function() 
		{
			var h = $(document).height() - titleElem.height();	
			mainElem.height(h);
						
			// Redraw on resize.
			$(document).resize(_.debounce(function() {
				var h = $(window).height() - titleElem.height();	
				mainElem.height(h);
				_.each(knobs, function(knob) { knob.draw(); });
			}));
			
			// Make and store knobs.
			var proxied = $.proxy(function(i, e) {
				var id   = $(e).attr("id"),
					term = id.split("-")[1],
					rnd  = Math.random(),
					init = 0;
				if (rnd > 0.7) {
					init = 90;
				}
				knobs.push(new Knob(id, term, init));
			}, this);

			$(".synthi-knob").each(proxied);
			return this;
		},
		
		draw: function() 
		{
			var i = 0, l = knobs.length;
			for (i = 0; i < l; i++) {
				knobs[i].draw();
			}	
			return this;
		},
		
		knobs: function() 
		{
			return knobs;
		},
		
		search: function(startAnim) 
		{
			var i = 0,
				qs = baseQuery + "&",
				knobTerms = []; 
			
			for (i = 0; i < knobs.length; i++) {
				knobTerms.push(knobs[i].getQS());
			}
			
			qs += knobTerms.join("&mood=");
	
			// Buffer 100 results.
			$.getJSON(qs, $.proxy(function(data) {
				if (data.response.status.message === 'Success') {
					this.buffer = data.response.songs;
				}
				if (startAnim) {
					this.animate();
				}
			}, this));
		},
		
		animate: function() 
		{
			running = true;
			var lastFrame = null,
				diff      = 0,
				that      = this,
				drawables = [],
				i = 0;
			(function animLoop(time) {
				if (running) {
					webkitRequestAnimationFrame(animLoop, $("#anim"));
					var now = new Date();
					if (lastFrame !== null) {
						diff += now - lastFrame;
						if (diff > 2000) {
							var song = that.pick();
							drawables.push(song);
							diff = 0;
						}
						for (i = 0; i < drawables.length; i++) {
							var d = drawables[i];
							if (!d) {
								return;
							}
							d.update();
							if (!d.inBounds()) {
								delete drawables[i];
							}
						}
					}
					lastFrame = now;
				}
    		})();		
		},
		
		pick: function() 
		{
			return new Song(this.buffer.pop());
		},
		
		stopAnimation: function() 
		{
			running = false;
		}
	
	};

};

exports.Knob = Knob;
exports.App  = App;
