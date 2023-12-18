var http = require('http');
var https = require('https');
var util = require('util');
var querystring = require('querystring');
var url = require('url');
var htmlencode = require('htmlencode').htmlEncode;

var ACOSAPlus = function() {};

ACOSAPlus.addToHead = function(params, req, contentPackage) {
  if (req.query.content === 'ready') {
    params.headContent += '<script src="/static/aplus/jquery.min.js" type="text/javascript"></script>\n';
    params.headContent += '<script src="/static/aplus/events.js" type="text/javascript"></script>\n';
    if (!req.query.noResizeIframe) {
      params.headContent += '<script src="/static/aplus/resize-in-frame-util.js" type="text/javascript"></script>\n';
    }
  }

  // A+ can fetch this metadata automatically when adding exercises
  if (contentPackage.meta.contents[req.params.name] && contentPackage.meta.contents[req.params.name].title && contentPackage.meta.contents[req.params.name].description) {
    params.headContent += '<meta content="' + contentPackage.meta.contents[req.params.name].title + '" name="DC.Title">';
    params.headContent += '<meta content="' + contentPackage.meta.contents[req.params.name].description + '" name="DC.Description">';
  }

  return true;
};

ACOSAPlus.addToBody = function(params, req) {

  if (req.query.content !== 'ready') {
    var hostUrl = req.protocol + '://' + req.get('host');
    var fullUrl = hostUrl + req.originalUrl + '&content=ready';
    var width = +req.query.width || 600;
    var height = +req.query.height || 500;
    if (req.query.noResizeIframe) {
      params.bodyContent += '<iframe class="acos-iframe" src="' + fullUrl + '" width="' + width + '" height="' + height + '" style="box-shadow: none; border: none;"></iframe>\n';
    } else {
      params.bodyContent += '<iframe class="acos-iframe" src="' + fullUrl + '" style="box-shadow: none; border: none; width: 100%;"></iframe>\n';
      params.bodyContent += '<script src="' + hostUrl + '/static/aplus/resizeiframe.js" type="text/javascript"></script>\n';
    }
  } else {
    // This will be inside the previously created iframe
    params.bodyContent += '<input type="hidden" name="submission_url" value="' + htmlencode(req.query.submission_url) + '">\n';
    
    // include the user ID (uid) parameter so that it may be used in the ACOS logs
    var uid = req.query.uid;
    if (uid) {
      params.bodyContent += '<input type="hidden" name="uid" value="' + htmlencode(uid) + '">\n';
    }
    var lti_launch_id = req.query.lti_launch_id;
    if (lti_launch_id) {
      params.bodyContent += '<input type="hidden" name="lti_launch_id" value="' + htmlencode(lti_launch_id) + '">\n';
    }
    var lti_session_id = req.query.lti_session_id;
    if (lti_session_id) {
      params.bodyContent += '<input type="hidden" name="lti_session_id" value="' + htmlencode(lti_session_id) + '">\n';
    }
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

ACOSAPlus.handleEvent = function(event, payload, req, res, protocolData, responseObj, cb) {
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
    if (endpoint.protocol.indexOf('https') >= 0) {
      protocol = https;
      options.port = endpoint.port || 443;
    }

    var request = protocol.request(options, function(result) {
      if (result.statusCode == 200) {
        res.json({ 'status': 'OK', 'protocol': responseObj.protocol, 'content': responseObj.content });
      } else {
        res.json({ 'status': 'ERROR', 'protocol': responseObj.protocol, 'content': responseObj.content,
                   'error': 'A+/LMS responded ' + result.statusCode });
      }
      cb(event, payload, req, res, protocolData, responseObj);
    }).on('error', function(e) {
      res.json({ 'status': 'ERROR', 'protocol': responseObj.protocol, 'content': responseObj.content,
                 'error': e.toString() });
      cb(event, payload, req, res, protocolData, responseObj);
    });

    request.write(postData);
    request.end();

  } else {
    res.json({ 'status': 'OK', 'protocol': responseObj.protocol, 'content': responseObj.content });
    cb(event, payload, req, res, protocolData, responseObj);
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
  'version': '0.2.0',
  'url': ''
};

module.exports = ACOSAPlus;
