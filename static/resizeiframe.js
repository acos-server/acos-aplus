;(function(document, window, undefined) {
// This script resizes iframes when the window is resized so that the iframes
// make better use of the space available in the page.
// The iframes have style "width 100%" so that the width scales automatically and
// only the height needs to be set separately.

var initAcosAplusResizeIframe = function($, window, document) {

  var pluginName = 'acosAplusResizeIframe';
  var iframes = {}; // map HTML id attribute values to the class instances
  var counter = 0;

  function AcosAplusResizeIframe(element) {
    this.element = $(element); // iframe DOM element
    this.frameWindow = element.contentWindow; // window of the embedded iframe
    this.init();
  }

  $.extend(AcosAplusResizeIframe.prototype, {

    init: function() {
      var self = this;
      // check that the id attribute is set
      if (!this.element.attr('id')) {
        this.element.attr('id', pluginName + counter++);
      }
      iframes[this.element.attr('id')] = this;
      
      // set a large initial height for the iframe, which may be decreased
      // when the frame has computed its content's real height
      this.element.attr('height', 0.9 * $(window).height());

      // send a message to embedded ACOS iframe: the response message should announce its desired height
      // the iframes have the style "width: 100%", thus the width is updated automatically
      this.postMessageToIframe();
      
      // if the iframe has not loaded yet, it does not receive any messages, so wait for it to load
      // load event does not work in all browsers
      // the in-frame script also sends an init message if this outer window can not detect when the iframe has loaded
      this.element.onload = function() {
        self.postMessageToIframe();
      };
    },

    postMessageToIframe: function() {
      var data = {
        iframeid: this.element.attr('id'),
        type: 'acos-resizeiframe',
      };
      this.frameWindow.postMessage(data, '*');
    },

    resizeIframe: function(newHeight) {
      // prevent the iframe from growing higher than the window viewport unless the window is very small
      var maxH = Math.max(0.9 * $(window).height(), 300);
      var minH = 200;
      newHeight = Math.max(newHeight, minH);
      newHeight = Math.min(newHeight, maxH);
      this.element.attr('height', newHeight);
    },
  });


  // event listener for messages from iframes that announce their content heights
  function resizeMessageHandler(ev) {
    // ev.origin is not checked here since we do not want to hardcode the domain name
    // of the ACOS server here (it varies across installations). Additionally, there
    // should be no significant security risk in resizing the iframe.
    if (ev.data.type === 'acos-resizeiframe-init') {
      // find out which iframe sent the message (it has finished loading its content)
      // and ask its height for resizing
      for (var id in iframes) {
        if (!iframes.hasOwnProperty(id))
          continue;
        if (iframes[id].frameWindow === ev.source) {
          iframes[id].postMessageToIframe();
          break;
        }
      }
      
    } else if (ev.data.type === 'acos-resizeiframe-size') {
      if (ev.data.height && ev.data.iframeid) {
        var instance = iframes[ev.data.iframeid];
        if (!instance)
          return;
        var h = parseInt(ev.data.height);
        if (!isNaN(h)) {
          instance.resizeIframe(h);
        }
      }
    }
  }
  window.addEventListener("message", resizeMessageHandler, false);

  // initialize
  $('.acos-iframe').each(function() {
    if (!$.data(this, "plugin_" + pluginName)) {
      $.data(this, "plugin_" + pluginName, new AcosAplusResizeIframe(this));
    };
  });

  // when the window (of the outermost document) is resized, ask the iframes to announce their new heights
  $(window).on('resize', function() {
    for (var id in iframes) {
      if (iframes.hasOwnProperty(id)) {
        iframes[id].postMessageToIframe();
      }
    }
  });
};


var pageLoadedHandler = function() {
  // the DOM is ready so we may load jQuery in a safe way
  if (typeof require === 'function') {
    // in a require.js environment, import jQuery
    require(["jquery"], function(jQuery) {
      initAcosAplusResizeIframe(jQuery, window, document);
    });
  } else {
    // in A+ (jQuery defined in the global namespace)
    initAcosAplusResizeIframe(jQuery, window, document);
  }
};

/* Event listeners for DOMContentLoaded must be added before the event triggers,
otherwise they do nothing. On A+ content chapters, embedded exercises are loaded
with AJAX and the DOMContentLoaded event has probably already triggered. However,
on normal exercise pages, the page should not be loaded yet when this script activates. */
if (document.readyState == 'loading') {
  // still loading, add an event listener
  document.addEventListener('DOMContentLoaded', pageLoadedHandler, false);
} else {
  // DOM already loaded, continue immediately
  pageLoadedHandler();
}
})(document, window);
