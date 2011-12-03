var sp = getSpotifyApi(1);
var m = sp.require('sp://import/scripts/api/models');

exports.searchForTrack = function (artist, track, callback) {
  var q = $.param({q: ['artist:' + artist, 'track:' + track].join(' ')});
  $.getJSON('http://ws.spotify.com/search/1/track.json?' + q)
      .success(function (data) {
        var tracks = [];

        data.tracks.forEach(function (track) {
          var territories = track.album.availability.territories;

          if (territories == 'worldwide' ||
              territories.split(' ').indexOf(sp.core.country) >= 0) {
            tracks.push(m.Track.fromURI(track.href).data);
          }
        });

        if (callback) callback(null, tracks);
      })
      .error(function (err) { if (callback) callback(err) });
}
