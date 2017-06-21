(function($) {
  'use strict';

  var ACOS = function() {};

  ACOS.sendEvent = function(event, payload, cb) {

    var protocolData = { 'submissionURL': $('input[name="submission_url"]').attr('value') };

    var target = window.location.pathname;
    if (target[target.length - 1] == '/') {
      target = target.substring(0, target.length - 1);
    }

    //TODO: error handling

    var data = {
      'event': event,
      'payload': JSON.stringify(payload),
      'protocolData': JSON.stringify(protocolData)
    };

    if (event === 'log' && window.AcosLogging && AcosLogging.logkey && AcosLogging.loggingSession) {
      data.logkey = AcosLogging.logkey;
      data.loggingSession = AcosLogging.loggingSession;
    }

    if (event === 'log' && window.AcosLogging && AcosLogging.noLogging) {
      return;
    } else {
      $.post(target + "/event", data).done(function(response) {
        if (event === 'grade') {
          // Update the points view
          window.parent.postMessage({ type: 'a-plus-refresh-stats' }, "*");
        }
        if (cb) {
          var error = null;
          if (response.status !== 'OK') {
            error = {
              'status': response.status,
              'error': response.error, // error message (string)
            };
          }
          cb(response.content, error);
        }
      }).fail(function(jqXHR, text, errorThrown) {
        console.log(jqXHR, text);
        if (cb) {
          var error = {
            'status': 'ERROR',
            'error': errorThrown.toString(),
          };
          cb(null, error);
        }
      });
    }

  };

  // Make the namespace globally available
  window.ACOS = ACOS;

}(jQuery));
