var Knob = function(elemId, searchTerm)
{
	var elemId     = elemId,
		elem       = $("#" + elemId),
		searchTerm = searchTerm,
		rad2deg    = 180/Math.PI,
		deg 	   = 0,
		bars       = elem.find('.bars'),
		steps      = 20,
		height     = elem.height(),
		width      = elem.width();
	
	this.boost = 0;
	
	var colors = [
		'26e000','2fe300','37e700','45ea00','51ef00',
		'61f800','6bfb00','77ff02','80ff05','8cff09',
		'93ff0b','9eff09','a9ff07','c2ff03','d7ff07',
		'f2ff0a','fff30a','ffdc09','ffce0a','ffc30a',
		'ffb509','ffa808','ff9908','ff8607','ff7005',
		'ff5f04','ff4f03','f83a00','ee2b00','e52000'
	];
	
	for(var i = 0; i < steps; i++){
		
		deg = i*9;
		
		$('<div class="colorBar">').css({
			backgroundColor: 'white',
			transform:'rotate('+deg+'deg)',
			top: -Math.sin(deg/rad2deg)*80+30,
			left: Math.cos((180 - deg)/rad2deg)*80+100,
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
			var h = $(window).height() - 50;	
			$("#main").height(h);
			
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
