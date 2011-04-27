var _ = require('underscore');
var query = require('querystring');

// Let's make some handy functions to minimize code repetition.
function attr(a,b){return ' '+a+'="'+b+'"';}
function param(a,b){return '<param name="'+a+'" value="'+b+'" />';}

var flash = function (opt) {
	
	// Merge settings objects.
	var s = _.extend({
			'id': ''
			, 'class': ''
			, 'width': ''
			, 'height': ''
			, 'src': ''
			, 'classid': 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'
			, 'pluginspace': 'http://get.adobe.com/flashplayer'
			, 'type': 'application/x-shockwave-flash'
			, 'availattrs': [
				'id'
				, 'class'
				, 'width'
				, 'height'
				, 'src'
				, 'type'
			]
			, 'availparams': [
				'src'
				, 'bgcolor'
				, 'quality'
				, 'allowscriptaccess'
				, 'allowfullscreen'
				, 'flashvars'
				, 'wmode'
			]
			, 'version': '9.0.24'
		}, opt);
	
	// Collect list of attributes and parameters to use.
	var a = s.availattrs;
	var p = s.availparams;
	
	// Get required version array.
	var rv = s.version.split('.');
	
	// Open output string.
	var object = '<object';
	
	// Set codebase, if not supplied in the settings.
	if (!s.codebase) {
		s.codebase = 'http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=' + rv.join(',');
	}
	
	// Convert flashvars to query string.
	if (s.flashvars) {
		s.flashvars = unescape(query.stringify(s.flashvars));
	}
	
	// Add attributes to output buffer.
	for (k in a) {
		var n = (k == a.indexOf('src')) ? 'data' : a[k];
		object += s[a[k]] ? attr(n, s[a[k]]) : '';
	};
	object += '>';
	
	var params = '';
	
	// Add parameters to output buffer.
	for (k in p) {
		var n = (k == p.indexOf('src')) ? 'movie' : p[k];
		params += s[p[k]] ? param(n, s[p[k]]) : '';
	};
	
	// Build Satay'd flash object code.
	var o = '<!--[if IE]>'
		+object
		+attr('classid', s['classid'])
		+attr('codebase', s['codebase'])+'>'
			+params
		+'</object><![endif]--><!--[if !IE]><!-->';
	o += object+attr('pluginspage', s['pluginspage'])+'>'+params+'</object><!--<![endif]-->';
			
	return o;
};

module.exports.flash = flash;