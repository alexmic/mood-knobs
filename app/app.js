var Knob = function(elemId, searchTerm)
{
	var elemId     = elemId,
		elem       = $("#" + elemId),
		searchTerm = searchTerm,
		rad2deg    = 180/Math.PI,
		deg 	   = 0,
		bars       = elem.find('.bars'),
		steps      = 10,
		height     = elem.height(),
		width      = elem.width(),
		radius	   = elem.find(".control").width() / 1.2;
	
	console.log(height);
	console.log(width);
	
	this.boost = 0;
	
	for(var i = 1; i < steps; i++){
		
		deg = i*18;
		
		$('<div class="colorBar">').css({
			transform:'rotate('+deg+'deg)',
			top: -Math.sin(deg/rad2deg)*radius+65,
			left: Math.cos((180 - deg)/rad2deg)*radius+60.5,
		}).appendTo(bars);
	}
	
	var colorBars = bars.find('.colorBar');
	var numBars = 0, lastNum = -1;
	
	$(elem.find(".control")).knobKnob({
		snap : 10,
		value: 0,
		turn : function(ratio){
		}
	});
	
};


var App = function() 
{
	var knobs = [];
	
	return {
		
		init: function() 
		{
			function _resize() {
				var h = $(window).height() - $('#title').height();	
				$("#main").height(h);
				console.log(h);
			}
			_resize();
			$(window).resize(_resize);

			
			// Make knobs.
			var proxied = $.proxy(function(i, e) {
				console.log(this);
				var id   = $(e).attr("id"),
					term = id.split("-")[1];
				knobs.push(new Knob(id, term));
			}, this);

			$(".synthi-knob").each(proxied);
		},
		
		knobs: function() 
		{
			return knobs;
		}
	
	};

};
