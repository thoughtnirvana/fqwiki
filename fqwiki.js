$(function() {
    // Shared timer.
    var timer = null;
    // Decide zoom in the image slide show.
    var zoomed = 0;
    // Current result set.
    var results = null;
    // Abstract for the query. Abstracted from wikipedia.
    var abstract = null;
    // Flag for results loaded.
    var loaded = null;

    // Searches wikipedia for the given keyword.
    function search() {
        var wikiQuery = '<script src="http://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(jQuery('#search').val()) +
                             '&callback=lookup"></script>';
        jQuery(document.body).append(wikiQuery);
    }

    // Parse wikipedia results.
    function lookup(result) {
        var topics = result[1];
        jQuery('#results').html('');
        // Append upto 5 topics to results.
        var topicLen = (topics.length > 5 ? 5 : topics.length);
        for(i = 0; i < topicLen; ++i) {
            jQuery('#results').append('<div>' + topics[i] + '</div>');
            jQuery('#results div:last').click(function() {
            	var value = jQuery(this).html();
                jQuery('#search').val(value);
                qwiki(encodeURIComponent(value)); 
            });
        }
    }


    // Queries google for related images.
    function getImages(query) {
        var search_control = new google.search.SearchControl();
        search_control.addSearcher(new google.search.ImageSearch());
        search_control.draw(document.getElementById("search_control"));
        search_control.execute(query);
        search_control.setSearchCompleteCallback(this, imagesDone);
    }

    // Consumes images returned from google image search.
    function imagesDone(sc, searcher) {
        slide = '<div class="images_slide">';
        if (searcher.results && searcher.results.length > 0) {
            results = searcher.results;
            try {
                for (var i = 0; i < 4; ++i) {
                    var result = searcher.results[i];
                    slide += '<div class="img">';	
                    slide += '<div class="caption">' + result['title'] + '</div>';
                    slide += '<img src="' + result['tbUrl'] + '" />'
                    slide += '</div>'
                }
            } catch (e) {}
        }
        document.getElementById('images').innerHTML += slide + '</div>';
        jQuery('.images_slide:first').remove();
        jQuery('.images_slide:first').animate({left: '-800px'});
        jQuery('.images_slide:last').animate({left: '0px'});
        zoomed = 0;
        zoom();
    }

    // Animates images in the slides show.
    window.zoom = function () {
        if (zoomed == 4) {
            zoomed += 1;
            setTimeout('zoom()', 1000);
            return;
        }
        if (zoomed == 5) {
            jQuery('.fullimg:first').remove();
            jQuery('.fullimg:first').remove();
            jQuery('.fullimg:first').remove();
            return;
        }
        var fullImg = '<img class="fullimg" src="' + results[zoomed]['unescapedUrl'] + '" style="position: absolute; top: 0px; left: 0px; opacity: 0.0;" width="800px"/>';
        jQuery('.images_slide:last').append(fullImg);
        jQuery('.fullimg:last').animate({opacity: 1.0, width: 850, top: (Math.random() - 0.5)*20 - 25, left: (Math.random() - 0.5)*20 - 25}, 2000)
        zoomed += 1
        setTimeout('zoom()', 2000);
    }


    window.consume = function () {
    	// Process the abstract 100 characters at a time.
        chunk = abstract.substring(0,100);
        if (chunk == null) return;
        if (abstract.length > 100) {
            abstract = chunk.substring(chunk.lastIndexOf(" ")) +
                            abstract.substring(100);
            chunk = chunk.substring(0, chunk.lastIndexOf(" "));
        } else {
            abstract = '';
        }
        // Read the abstract.
        var tts_call = 'http://translate.google.com/translate_tts?tl=en&q=' +
                            encodeURIComponent(chunk);
        jQuery('#voice').attr('src', tts_call);
        // Get images for the abstract.
        getImages(chunk);
        // Display the abstract being read.
        jQuery('.sentence:first').remove();
        jQuery('.sentence:first').animate({marginTop: '-30px'});
        jQuery('#abstract').append('<div class="sentence">' + chunk + '</div>');
    }

    // Save the abstract and set up the first results
    function result(r) {
        loaded = true;
        abstract = r['results']['bindings'][0]['abstract']['value'];
        abstract = abstract.substring(0, abstract.lastIndexOf("."));
        consume();
    }

    // Grab the abstract from the wikipedia search results.
    window.wikiAbstract = function (r) {
        loaded = true;
        var rev = 0;
        for(key in r.query.pages)
        rev = key
        abstract = r.query.pages[rev].revisions[0]['*'];
        // Remove special tags from wikipedia results and grab the abstract.
        abstract = (abstract.replace(/{{[^]*?({{[^{}]*?}}[^]*?)*}}/g,'').
                        replace(/{{[^]*?}}/g,'').
                        replace(/\[\[[^:\]]*:[^\]]*?\]\]/g,'').
                        replace(/\([^]*?\)/g,'').
                        replace(/<ref[^]*?\/ref>/g,'').
                        replace(/<ref[^>]*\/>/g,'').
                        replace(/\[\[[^\]]*?\|/g,'[[').
                        replace(/'''?/g,'').
                        replace(/\n/g,'').
                        replace(/\*/g,'').
                        replace(/<!--.*-->/g,''));
        // Sanitizing out what would be search terms
        abstract = abstract.replace(/(\[\[|\]\])/g,'')
        consume();
    }

    function qwiki(q) {
        jQuery('#results').html('');
        clearTimeout(timer);
        var wikiQuery =
        '<script src="http://en.wikipedia.org/w/api.php?format=json&action=query' +
        '&prop=revisions&titles=' +
        encodeURIComponent(q) +
        '&rvprop=content&rvsection=0&callback=wikiAbstract"><\/script>'
        jQuery(document.body).append(wikiQuery);
    }

    // Set event handler for input box.
    jQuery('#search').keyup(function(e) {
        if (e.keyCode === 13) search(); 
    });
    // Initiate search when `search box` is clicked.
    jQuery('#search-box button').click(function(e) {
        search(); 
    });
    // When the iframe loads, start reading back voice.
    jQuery('#voice').load(function() {
        if (loaded) {
            timer = setTimeout('consume()', 9000);
        }

    });
    // Set the initial qwiki.
    jQuery('#search').val("Snake oil");
    qwiki("Snake oil");

});
