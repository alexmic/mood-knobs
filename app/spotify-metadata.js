var _ = sp.require('libs/js/underscore')._;
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

// One or more Musicbrainz IDs to Spotify Artist objects
exports.artistFromMbid = function (mbids, callback) {
  var many = mbids instanceof Array && mbids.length > 0;
  var q = $.param({
    method: 'artist.getPlaylinks',
    api_key: 'b25b959554ed76058ac220b7b2e0a026',
    mbid: mbids instanceof Array ? mbids : [mbids],
    format: 'json'
  });

  $.getJSON('http://ws.audioscrobbler.com/2.0/?' + q)
    .success(function (data) {
      if (!callback) {
        return;
      }

      if (data.error) {
        callback(data);
        return;
      }

      if (!data.spotify || !data.spotify.artist) {
        callback(null, null);
        return;
      }

      if (many) {
        callback(
          null,
          _.map(data.spotify.artist, function (a) { return m.Artist.fromURI(a.externalids.spotify).data; }));
      } else {
        callback(
          null,
          m.Artist.fromURI(data.spotify.artist.externalids.spotify).data);
      }
    })
    .error(function (err) {
      if (callback) {
        callback(err);
      }
    });
}
