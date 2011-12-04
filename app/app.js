var spm = sp.require("app/spotify-metadata"),
    m = sp.require('sp://import/scripts/api/models');

var songIds = {};

var Song = function(data) 
{
	var title = data.title,
		artist = data.artist_name,
		top   = 0,
		track = null,
		selected = false,
		id    = null,
		elem  = $("<div class='song'>" + title + "</div>"),
		speed = 1;
	
	var onSearchReturn = function(err, tracks) {
		if (err) {
			throw "Blow";
		} 
		if (tracks && tracks.length > 0) {
            track = tracks[0];
            id  = track.uri.split(":")[2];
            $(elem).attr("id", id)
		} else {
			// TODO: handle.
			console.log('no tracks.');
		}
	}
	spm.searchForTrack(artist, 
					   title,
					   onSearchReturn);
		
	var exports = {
	    track: function() {
	        return track;
	    },
	    title: function() {
	        return title;
	    },
	    artist: function() {
	        return artist;
	    },
	    selected: function(val) {
	       if (val) {
	           selected = val;
	       } else {
	           return selected;
	       }
	    },
	    id: function(){
	        return id;
	    },
	    draw: function() {
	        $("#anim").prepend(elem);
	        console.log("HEY, draw that.")
	    },
		hasSpotifyTrack: function() {
		    return track !== null;
		}
	};
	
	elem.draggable({
		helper: 'clone',
		containment: '#main'
	});
    
    return exports;

};

var Playlist = function(elemId) {
    var elem = $("#" + elemId),
        songs = [],
        spPlaylist = null;

    var onDrop = function(event, ui) {
        var draggable = ui.draggable,
            song = songIds[draggable.attr("id")];
        songs.push(song);
        elem.append($("<div class=''>" + song.title() + "</div>"));
        console.log(spPlaylist);
        if (spPlaylist === null) {
            spPlaylist = new m.Playlist('alex');            
        }
        console.log(song.track().uri);
        spPlaylist.add(m.Track.fromURI(song.track().uri));
        console.log("asfaasf");
    }

    elem.droppable({
	    drop: onDrop
	});  
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
		searchTerm: searchTerm,

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
				},
				trigger: function() {
				    // send out a new search.
				    MHD.app.search();
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
			results : 16
		}),
		baseQuery = 'http://developer.echonest.com/api/v4/song/search?' + params,
		titleElem = $("#title"); 
	
	return {
		
		buffer: [],
		playlist: null,
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
			
			this.playlist = new Playlist("playlist");
			
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
			    var boost = knobs[i].boost;
			    if (boost != 0) {
			        var searchTerm = knobs[i].searchTerm;
			        var q = searchTerm + "^" + boost
    				knobTerms.push(q);
				}
			}
			
			qs += knobTerms.join("&mood=");
	        
	        console.log("url: " + qs)
	
			// Buffer 100 results.
			$.getJSON(qs, $.proxy(function(data) {
			    
				if (data.response.status.message === 'Success') {
				    $("#anim").empty();
					var d = data.response.songs;
				    for (var i = 0; i < d.length; i++) {
				        var song = new Song(d[i]);
                        this.buffer.push(song);
				    }
				    var c = 0;
				    var safety = 0
				    while (true) {
				        var s = this.pick();
                        if (s !== null) {
                            s.draw();
                            c++;
                        } 
                        if (c === 10) {
                            break;
                        }
                        safety++;
                        if (safety > 1024) {
                            break;
                        }
				    }
				    
				} else {
				    throw "uhm.";
				}
			}, this));
		},
		
		start: function() 
		{
			running = true;
			var lastFrame = null,
				diff      = 0,
				that      = this,
				drawables = [],
				i = 0;
			console.log("Asfa");
			window.setInterval(function() {
			    console.log("af");
                
			}, 1000);
		},
		
		pick: function() 
		{
		    // pick the first one that has a spotify uri.
		    var i;
		    for (i = 0; i < this.buffer.length; i++) {
		        var s = this.buffer[i];
		        if (s.hasSpotifyTrack()) {
		            songIds[s.id()] = s;
		            this.buffer.splice(i, 1);
		            return s;
		        }
		    }
		    console.log('it never did return.')
		    return null;
		},
		
		stopAnimation: function() 
		{
			running = false;
		}
	
	};

};

exports.Knob = Knob;
exports.App  = App;
exports.Playlist = Playlist;