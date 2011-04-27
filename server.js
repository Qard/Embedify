#!/usr/local/bin/node
// Load required modules.
var express = require('express');
var flash = require('./flash').flash;
var _ = require('underscore');

// Create express server.
var app = express.createServer();

// Configure express to serve static files.
app.configure(function(){
	app.use(express.static(__dirname+'/static'));
	app.use(express.bodyParser());
});

// Create a generic upload request handler.
var converter = function(req, res) {
	res.header("Access-Control-Allow-Origin", "*");
	var isJson = (req.params.format);
	var result = req.body.text;
	
	// Cycle through our filter list.
	for (var i in filters){
		result = filters[i](result);
	}
	
	res.send(isJson ? JSON.stringify({text: result}) : result);
};

app.put('/convert.:format?', converter);
app.post('/convert.:format?', converter);

// Start listening.
app.listen(8124);












// Simple video service filter list. Intended to be added to.
var vid_filters = {
	youtube: {
		reg: /(^| )http(s)?:\/\/(www\.)?youtube\.com\/watch\?([\S]*)?v=([\S]+)($|(?![ ]))?/mig
		, url: 'http://www.youtube.com/v/{id}&amp;hl=en_US&amp;fs=1'
		, id: 'v'
	}
	, vimeo: {
		reg: /(^| )http(s)?:\/\/(www\.)?vimeo\.com\/[\S]+($|(?![ ]))?/mig
		, url: 'http://vimeo.com/moogaloop.swf?clip_id={id}&amp;server=vimeo.com&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;color=&amp;fullscreen=1'
	}
	, google: {
		reg: /(^| )http(s)?:\/\/video\.google\.com\/videoplay\?([\S]*)?docid=([\S]+)($|(?![ ]))?/mig
		, url: 'http://video.google.com/googleplayer.swf?docid={id}&hl=en&fs=true'
		, id: 'docid'
	}
	, facebook: {
		reg: /(^| )http(s)?:\/\/(www\.)?facebook\.com(\/)?\?([\S]*)?v=([\S]+)($|(?![ ]))?/mig
		, url: 'http://www.facebook.com/v/{id}'
		, id: 'v'
	}
	, myspace: {
		reg: /(^| )http(s)?:\/\/vids\.myspace\.com(\/)?(index\.cfm)?\?([\S]*)?videoid=([\S]+)($|(?![ ]))?/mig
		, url: 'http://mediaservices.myspace.com/services/media/embed.aspx/m={id},t=1,mt=video'
		, id: 'videoid'
	}
	, megavideo: {
		reg: /(^| )http(s)?:\/\/(www\.)?megavideo\.com(\/)?\?([\S]*)?v=([\S]+)($|(?![ ]))?/mig
		, url: 'http://www.megavideo.com/v/{id}'
		, id: 'v'
	}
	, dailymotion: {
		reg: /(^| )http(s)?:\/\/(www\.)?dailymotion\.com\/video\/[\S]+($|(?![ ]))?/mig
		, url: 'http://www.dailymotion.com/swf/{id}'
	}
};

// Generic video filter.
var video_filter = function(msg, regex, url, key){
	// Find all instances that match the supplied regex.
	var matches = msg.match(regex);
					
	// Iterate our matches.
	for (var i in matches) {
		(function(){
			var match = matches[i].replace(/^\s+|\s+$/g,"");
			
			// If a keyname has been supplied, we should use that.
			if (key) {
				// Grab id.
				var regexS = "[\\?&(?:&amp;)]"+key+"=([^&#]*)";
				var regex = new RegExp(regexS);
				var parts = regex.exec(match);
			
			// Otherwise, just use everything after the last /
			// Mainly used for Vimeo support.
			} else {
				var parts = match.split('/');
			}
			
			// Make sure we've actually found our id.
			if (parts && parts.length) {
				// Collect id, and replace the {id} token in supplied url.
				var id = parts[parts.length-1];
				var new_url = url.replace('{id}', id);
				
				// Replace message content.
				msg = msg.replace(match, flash({
					src: new_url
					, width: 600
					, height: 350
					, allowscriptaccess: 'always'
					, wmode: 'opaque'
					, allowfullscreen: true
				}));
			}
		})();
	}
	
	// Return our filtered results.
	return msg;
};
		
var filters = [
	// Handle script removal.
	function(str){
		return str.toString().replace(/<\s*script[^>]*>[\s\S]*?<\/script>/mig,'');
	}
	// Handle inline-script removal.
	, function(str){
		str = str.toString().replace(/<\s*[^>]*href="javascript:[^>]*"[^>]*>[\s\S]*?<\/[^>]*>/mig, '');
		// List of event types.
		var onevents = [
			// Mouse events
			'onclick', 'ondblclick', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup'
			// Keyboard events
			, 'onkeydown', 'onkeypress', 'onkeyup'
			// Image events
			, 'onabort'
			// Form events
			, 'onblur', 'onchange', 'onfocus', 'onreset', 'onselect', 'onsubmit'
			// Body events
			, 'onload', 'onunload'
		];
		// Watch for all event types.
		for (var i in onevents){
			var reg = new RegExp('<\s*[^>]*'+onevents[i]+'="(javascript)?[^>]*"[^>]*>[\\s\\S]*?<\/[^>]*>', 'gim');
			str = str.replace(reg, '');
		}
		return str;
	}
	// Handle object/embed removal.
	, function(str){
		return str.toString().replace(/<\s*object[^>]*>[\s\S]*?<\/object>/mig,'').replace(/<\s*embed[^>]*>[\s\S]*?\/>/mig,'');
	}
	// Escape HTML
	/*, function(str){
		return str.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}*/
	// Handle magiccards.info replacements.
	, function(str){
		str = str.replace(
			/(^| )https?:\/\/(www\.)?magiccards.info\/([\S]+)?\/([\S]+)?\/([\S]+)?\.html($|(?![ ]))?/mig
			, '<a href="http://magiccards.info/$3/$4/$5.html"><img src="http://magiccards.info/scans/$4/$3/$5.jpg" /></a>'
		);
		return str;
	}
	// Handle image replacements.
	, function(str){
		str = str.replace(/( |^)((ht|f)tps?:\/\/[\S]+\.(jpg|gif|png))($|(?![ ]))?/mig, '<a href="$2"><img src="$2" /></a>');
		return str;
	}
	// Handle HTML5-Supported video replacements.
	, function(str){
		str = str.replace(
			/(^| )((ht|f)tps?:\/\/[\S]+?\.(mp4|ogg|webm)([\?&#]+[\S]?)?)($|(?![ ]))?/mig
			, [
				'<video width="600" height="350" controls preload="none">'
				, '<source src="$2" type="video/$4" />'
				, '</video>'
			].join('')
		);
		return str;
	}
	// Handle google maps replacements.
	, function(str){
		// TODO: Clean this up...It's pretty ugly.
		var matches = str.match(/(^| )http(s)?:\/\/maps.google.com\/maps\?([\S]*)?(geocode|q)=(([^ ]+))?($|(?![ ]))?/g);
		for (var i in matches) {
			txt = $.trim(matches[i]);
			if (txt) {
				var reg_geocode = new RegExp("[\\?&(?:&amp;)]geocode=([^&#]*)");
				var reg_q = new RegExp("[\\?&(?:&amp;)]q=([^&#]*)");
				var parts_geocode = reg_geocode.exec(txt);
				var parts_q = reg_q.exec(txt);
				
				if (parts_geocode || parts_q) {
					str = str.replace(txt, '<iframe style="height:400px;border:none;width:600px;" src="http://maps.google.com/maps?q='+(parts_geocode[1] ? parts_geocode[1] : parts_q[1])+'&z=15&output=embed"></iframe>');
				}
			}
		}
		return str;
	}
	// Handle video service replacements.
	, function(str){
		// Loop through video filter list.
		for (var i in vid_filters) {
			var filter = vid_filters[i];
			str = video_filter(
				str
				, filter.reg
				, filter.url
				, filter.id || null
			);
		}
		return str;
	}
	// Handle PDF/PPT Viewer replacements.
	, function(str){
		str = str.replace(
			/(^| )(http(s)?:\/\/[\S]+?\.(?:pdf|ppt)([\?&#]+[\S]?)?)($|(?![ ]))?/mig
			, [
				'<div class="inline-document"><iframe '
				, 'src="http://docs.google.com/gview?url=$2&embedded=true" '
				, 'style="width:600px; height:500px;" '
				, 'frameborder="0"'
				, '></iframe><br /><a href="$2">Download Document</a></div>'
			].join('')
		);
		return str;
	}
	// Handle plain URL replacements.
	, function(str){
		str = str.replace(/( |^)((?:ht|f)tps?:\/\/[\S]+)($|(?![ ]))?/mig, '$1<a href="$2">$2</a>$3');
		return str;
	}
	// Add target="_blank" to all a elements.
	, function(str){
		str = str.replace(/<\s*(a)([^>]*)>/mig, '<$1 $2 target="_blank">');
		return str;
	}
];