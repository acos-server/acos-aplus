(function($) {
  'use strict';

  var ACOS = function() {};

  ACOS.sendEvent = function(event, payload) {

    var protocolData = { "submissionURL": $('input[name="submission_url"]').attr('value') };

    var target = window.location.pathname;
    if (target[target.length - 1] == '/') {
      target = target.substring(0, target.length - 1);
    }

    //TODO: error handling

    var data = {
      "event": event,
      "payload": JSON.stringify(payload),
      "protocolData": JSON.stringify(protocolData)
    };

    if (event === 'log' && window.AcosLogging && AcosLogging.logkey && AcosLogging.loggingSession) {
      data.logkey = AcosLogging.logkey;
      data.loggingSession = AcosLogging.loggingSession;
    }

    if (event === 'log' && window.AcosLogging && AcosLogging.noLogging) {
      return;
    } else {
      $.post(target + "/event", {
        "event": event,
        "payload": JSON.stringify(payload),
        "protocolData": JSON.stringify(protocolData)
      }).done(function(response) {
        if (event == 'grade') {
          // Update the points view
          window.parent.postMessage({ type: 'a-plus-refresh-stats' }, "*");
        }
      }).fail(function(jqXHR, text) {
        console.log(jqXHR, text);
      });
    }

  };

  // Make the namespace globally available
  window.ACOS = ACOS;

}(jQuery));
