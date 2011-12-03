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
			console.log(this);
			return searchTerm;	
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
		baseQS 	  = "http://developer.echonest.com/api/v4/artist/search?api_key=N6E4NIOVYMTHNDM8J&format=json&results=100",
		titleElem = $("#title"); 
	
	return {
		
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
		
		search: function() 
		{
			var i   	  = 0,
				qs  	  = baseQS + "&mood=",
				knobTerms = []; 
			
			for (i = 0; i < knobs.length; i++) {
				knobTerms.push(knobs[i].getQS());
			}
			
			qs += knobTerms.join(",");
			
			$.getJSON(qs).success(function(data) {
				console.log(data);
			});
			
		}
	
	};

};

exports.Knob = Knob;
exports.App  = App;
