var Knob = function(elemId, searchTerm)
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
		colors     = [
			'26e000','51ef00','B8FF05','FFEA05','FFC60A',
			'ff8607','ff7005', 'ff5f04','ff4f03','f83a00','ee2b00'
		];
		this.boost = 0;
	
	return {
	
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
			$("#" + elemId + " div.bars div.control").knobKnob({
				snap : 10,
				value: 0,
				turn : function(ratio) {
					var step = Math.round((ratio * steps) / 0.5);
					colorBars.each(function(i, e) {
						if (i >= step) {
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
					term = id.split("-")[1];
				knobs.push(new Knob(id, term));
				console.log("h");
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
		}
	
	};

};
