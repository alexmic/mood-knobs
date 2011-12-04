var spm = sp.require("app/spotify-metadata"),
    enm = sp.require("app/echonest-metadata"),
    m   = sp.require('sp://import/scripts/api/models');

// Global song registry.
var songIds = {};

// ==================== Song ==================== //

var Song = function(data)
{
    var title    = data.title,
        artist   = data.artist_name,
        artistId = data.artist_id, 
        top      = 0,
        track    = null,
        id       = null,
        elem     = $("<div class='song' style='display:none'>" +
                      "<div class='img'></div>" +
                      "<div class='dets'>" + 
                        "<div class='artist'>" +
                            artist +
                        "</div>" +
                        "<div class='title'>" +
                            title +
                        "</div>" +
                        "<span><img src='../res/imgs/Play-Small.png' to play/></span>" + 
                      "</div>");
                    
    var onSearchReturn = function(err, tracks) {
        if (err) {
            throw "Blow";
        }
        if (tracks && tracks.length > 0) {
            track = tracks[0];
            id  = track.uri.split(":")[2];
            $(elem).attr("id", id)
            enm.searchForImage(artistId, function(err, img) {
                if (err === null && img !== null) {
                    elem.find('.img').css({
                        backgroundImage: "url(" + img + ")"
                    });
                }
            });
            elem.click((function(t) {
                return function() {
                    m.player.play(t);
                }
            })(track));
        } else {
            // TODO: handle.
            console.log('no tracks.');
        }
    }
    
    spm.searchForTrack(artist,
                       title,
                       onSearchReturn);
    
    elem = elem.draggable({
        containment: '#main',
        revert: true
    });
    

    return {
        track: function() {
            return track;
        },
        title: function() {
            return title;
        },
        artist: function() {
            return artist;
        },
        id: function() {
            return id;
        },
        draw: function(fade) {
            $("#anim").prepend(elem);
            if (fade) {
                elem.fadeIn();
            } else {
                elem.show();
            }
        }
    };
};

// ==================== Playlist ==================== //

var Playlist = function(elem) 
{
    var elem  = elem,
        songs = [],
        spPlaylist = null;

    var onDrop = function(event, ui) {
        var l = $("#anim .song").length;
        var draggable = ui.draggable,
            song = songIds[draggable.attr("id")],
            newe = $("<div class='s'>" +
                        "<div>" +
                            song.artist() +
                            " - " + 
                            song.title() +
                        "</div>" +
                        "<span><img height='15' width='15' src='../res/imgs/Play-Small.png'/></span>" + 
                        "</div>");
        songs.push(song);
        elem.find("#songs").append(newe);
        
        draggable.draggable('option', 'revert', false);
        draggable.remove();
        
        MHD.app.renderMore(l - $("#anim .song").length);
        
        var name = elem.find("#name div").html();
        if (spPlaylist === null) {
            spPlaylist = new m.Playlist(name);
        }
        if (spPlaylist.name !== name) {
            spPlaylist.name = name;
        }
        var track = m.Track.fromURI(song.track().uri);
        spPlaylist.add(track);
        
        newe.click((function(t) {
            return function() {
                console.log("zf");
                m.player.play(t);
            }
        })(track));
    };

    elem.find("#songs").droppable({
        drop: onDrop
    });
    
    return {
        
        songs: function() {
            return songs;
        },
        spPlaylist: function() {
            return spPlaylist;
        }
    }
};

var Knob = function(elemId, searchTerm, initialValue)
{
    var elemId     = elemId,
        elem       = $("#" + elemId),
        searchTerm = searchTerm,
        rad2deg    = 180/Math.PI,
        deg        = 0,
        barsElem   = null,
        steps      = 10,
        boost      = 0,
        height     = elem.height(),
        width      = elem.width(),
        radius     = null,
        boost      = 0,
        initial    = initialValue || 0,
        colors     = [
            '26e000','51ef00','B8FF05','FFEA05','FFC60A',
            'ff8607','ff7005', 'ff5f04','ff4f03','f83a00','ee2b00'
        ];
        
        

    return {
        boost: function(b) {
            if (b) {
                boost = b;
            } else {
                return boost;
            }
        },
        searchTerm: function(st) {
            if (st) {
                searchTerm = st;
            } else {
                return searchTerm;
            }
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
                    top: -Math.sin(deg/rad2deg)*radius+height * 0.46,
                    left: Math.cos((180 - deg)/rad2deg)*radius+width * 0.4,
                }).attr("active-color", "#" + colors[i]).appendTo(barsElem);
            }

            var colorBars = barsElem.find('.colorBar');

            // Draw knob.
            $("#" + elemId + " div.bars div.control").knobKnob({
                snap : 10,
                value: initial,
                turn : function(ratio) {
                    var dialStep = Math.min(9, Math.round((ratio * steps) / 0.5));
                    boost = Math.min(2, Math.round((10 * (ratio * 2) / 0.5)) / 10);
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
    var knobs      = [],
        mainElem   = $("#main"),
        animElem   = $("#anim"),
        playElem   = $("#playlist"),
        synthiElem = $("#synthi"),  
        running    = false,
        apiKey     = "N6E4NIOVYMTHNDM8J",
        params     = $.param({
            api_key : apiKey,
            format  : 'json',
            results : 100,
            sort    : 'song_hotttnesss-asc'
        }),
        numSongs = 0,
        baseQuery = 'http://developer.echonest.com/api/v4/song/search?' + params,
        titleElem = $("#title");
        
    function shuffle(list) 
    {
        var i, j, t;
        for (i = 1; i < list.length; i++) {
            j = Math.floor(Math.random()*(1+i));
            if (j !== i) {
                t = list[i];                   
                list[i] = list[j];
                list[j] = t;
            }
        }
    };
    
    var hiSongs = function(force, fade) 
    {
        var c = 0,
            n = force || numSongs,
            safety = 0;
        while (true) {
            var s = MHD.app.pick();
            if (s !== null) {
                s.draw(fade);
                c++;
            }
            if (c === n) {
                break;
            }
            safety++;
            if (safety > 1024) {
                break;
            }
        }
    };

    return {

        buffer: [],
        playlist: null,
        knobs: knobs,
        init: function()
        {
            var h = $(document).height() - titleElem.height() - 20,
                w = $(document).width();
            
            mainElem.height(h);
            mainElem.width(w);
            
            synthiElem.height(h);
            synthiElem.width(w/3);
            
            animElem.height(h);
            animElem.width(w/3);
            
            playElem.height(h-2);
            playElem.width(w/3);
            
            numSongs = Math.round(h / 45);

            // Redraw on resize.
            $(document).resize(_.debounce(function() {
                var h = $(window).height() - titleElem.height();
                mainElem.height(h);
                _.each(knobs, function(knob) { knob.draw(); });
            }));

            // Make and store knobs.
            var proxied = $.proxy(function(i, e) {
                $(e).width(synthiElem.width() * 0.5)
                    .height(synthiElem.height() * 0.25);
                var id   = $(e).attr("id"),
                    term = id.split("-")[1],
                    rnd  = Math.random(),
                    init = 0;
                if (rnd > 0.7) {
                    init = 45;
                }
                knobs.push(new Knob(id, term, init));
            }, this);

            $(".synthi-knob").each(proxied);

            this.playlist = new Playlist(playElem);
            
            return this;
        },
        renderMore: function(n) 
        {
            hiSongs(n, true);
        },
        draw: function()
        {
            var i = 0, l = knobs.length;
            for (i = 0; i < l; i++) {
                knobs[i].draw();
            }
            return this;
        },

        search: function(startAnim)
        {
            var i     = 0,
                qs    = baseQuery + "&",
                moods = [];
                
            for (i = 0; i < knobs.length; i++) {
                var boost      = knobs[i].boost(),
                    searchTerm = knobs[i].searchTerm();
                if (boost > 0) {
                    moods.push([searchTerm, boost]);
                }
            }

            enm.searchSongsByMoods(moods, $.proxy(function(err, songs) {
                if (err !== null) {
                    throw 'error';
                }
                if (songs === null) {
                    return;
                }
                
                $("#playlist #name div").html(this.derivePlaylistName());
                $("#anim").children().fadeOut();
                
                this.buffer = [];
                var seen = {};
                for (var i = 0; i < songs.length; i++) {
                    var song = new Song(songs[i]);
                    var dedup = (song.title().replace(/\s/g, "") 
                                 + song.artist().replace(" ", ""))
                                 .toLowerCase();
                    if (!seen[dedup]) {
                        this.buffer.push(song);
                        seen[dedup] = true;
                    }
                }
                
                shuffle(this.buffer);
                window.setTimeout($.proxy(hiSongs, this), 1000);
                
            }, this));
        },
        
        pick: function()
        {
            // pick the first one that has a spotify uri.
            var i;
            for (i = 0; i < this.buffer.length; i++) {
                var s = this.buffer[i];
                if (s.track() !== null) {
                    songIds[s.id()] = s;
                    this.buffer.splice(i, 1);
                    return s;
                }
            }
            return null;
        },
        
        derivePlaylistName: function() 
        {
            var name = [];
            for (var i in knobs) {
                if (knobs.hasOwnProperty(i)) {
                    var knob = knobs[i];
                    console.log(knob.boost());
                    if (knob.boost() > 0) {
                        var extra = "";
                        if (knob.boost() > 1.6) {
                            extra = "too much";
                        } else if (knob.boost() >= 1) {
                            extra = "some";
                        } else {
                            extra = "a little";
                        }
                        name.push(extra + " " + knob.searchTerm());
                    }
                }
            }
            return (name.length > 0)? name.join(" and ") : "no name";
        }
    };

};

exports.Knob = Knob;
exports.App  = App;
exports.Playlist = Playlist;
exports.Song = Song;