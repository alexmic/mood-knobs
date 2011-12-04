exports.searchForImage = function(artistId, callback) 
{
	console.log("asfa");
	var qs = $.param({
		api_key : "N6E4NIOVYMTHNDM8J",
		results : 1,
		format  : 'json',
		id      : artistId
	});
	$.getJSON("http://developer.echonest.com/api/v4/artist/images?" + qs)
		.success(function(data) {
			if (data.response && data.response.images){
				if (data.response.images.length > 0) {
					if (callback) {
						callback(null, data.response.images[0].url);
					}
				} else {
					if (callback) {
						callback(null, null);
					}
				}
			}
		})
		.error(function(err) {
			if (callback) {
				callback(err);
			}
		});
};