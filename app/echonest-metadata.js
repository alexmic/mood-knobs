exports.searchForImage = function(artistId, callback) 
{
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

exports.searchSongsByMoods = function(moods, callback) 
{
	var qs = $.param({
        api_key : "N6E4NIOVYMTHNDM8J",
        results : 100,
        sort    : 'song_hotttnesss-desc',
        format  : 'json'
    });
    for (var m in moods) {
    	if (moods.hasOwnProperty(m)) {
    		var mood = moods[m];
    		qs += "&mood=" + mood[0] + "^" + mood[1];
    	}
    }
    $.getJSON("http://developer.echonest.com/api/v4/song/search?" + qs)
        .success(function(data) {
            if (data.response && data.response.songs){
                if (data.response.songs.length > 0) {
                    if (callback) {
                        callback(null, data.response.songs);
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
