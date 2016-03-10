var http = require('http');
var https = require('https');
var util = require('util');
var querystring = require('querystring');
var url = require('url');

var ACOSAPlus = function() {};

ACOSAPlus.addToHead = function(params, req, contentPackage) {
  if (req.query.content === 'ready') {
    params.headContent += '<script src="/static/aplus/jquery.min.js" type="text/javascript"></script>\n';
    params.headContent += '<script src="/static/aplus/events.js" type="text/javascript"></script>\n';
  }

  // A+ can fetch this metadata automatically when adding exercises
  params.headContent += '<meta content="' + contentPackage.meta.contents[req.params.name].title + '" name="DC.Title">';
  params.headContent += '<meta content="' + contentPackage.meta.contents[req.params.name].description + '" name="DC.Description">';

  return true;
};

ACOSAPlus.addToBody = function(params, req) {

  if (req.query.content !== 'ready') {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl + '&content=ready';
    var width = req.query.width || 770;
    var height = req.query.height || 500;
    params.bodyContent += '<iframe id="iframe" src="' + fullUrl + '" width="' + width + '" height="' + height + '" style="box-shadow: none; border: none;"></iframe>\n';
  } else {
    // This will be inside the previously created iframe
    params.bodyContent += '<input type="hidden" name="submission_url" value="' + req.query.submission_url + '">\n';
  }

  return true;

};

ACOSAPlus.initialize = function(req, params, handlers, cb) {

  // Initialize the protocol
  var result = ACOSAPlus.addToHead(params, req, handlers.contentPackages[req.params.contentPackage]);
  result = result && ACOSAPlus.addToBody(params, req);

  if (!params.error && req.query.content === 'ready') {
    // Initialize the content type (and content package)
    handlers.contentTypes[req.params.contentType].initialize(req, params, handlers, function() {
      cb();
    });
  } else {
    cb();
  }

};

ACOSAPlus.handleEvent = function(event, payload, req, res, protocolData) {
  if (event == 'grade') {

    var endpoint = url.parse(protocolData.submissionURL);
    var postData = querystring.stringify(payload);
    var options = {
      hostname: endpoint.hostname,
      port: endpoint.port || 80,
      path: endpoint.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    var protocol = http;
    if (endpoint.protocol == 'https') {
      protocol = https;
      options.port = endpoint.port || 443;
    }

    var request = protocol.request(options, function(result) {
      if (result.statusCode == 200) {
        res.json({ 'status': 'OK' });
      } else {
        res.json({ 'status': 'ERROR' });
      }
    }).on('error', function(e) {
      res.json({ 'status': 'ERROR' });
    });

    request.write(postData);
    request.end();

  } else {
    res.json({ 'status': 'OK' });
  }

};

ACOSAPlus.register = function(handlers, app) {
  handlers.protocols.aplus = ACOSAPlus;
};

ACOSAPlus.namespace = 'aplus';
ACOSAPlus.packageType = 'protocol';

ACOSAPlus.meta = {
  'name': 'aplus',
  'shortDescription': 'Protocol to load content by using the A+ HTTP GET/POST protocol.',
  'description': '',
  'author': 'Teemu Sirkiä, Lassi Haaranen',
  'license': 'MIT',
  'version': '0.0.1',
  'url': ''
};

module.exports = ACOSAPlus;
