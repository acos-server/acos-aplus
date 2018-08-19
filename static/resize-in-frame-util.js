;(function(window, document) {
// this script should be included in a document that is embedded into another page in an iframe
// this script replies to messages from the parent window with the height of this document

var getHeight = function() {
  if (!document.body) return 0;
  var style = window.getComputedStyle(document.body);
  var marginTop = parseInt(style.getPropertyValue('margin-top'), 10);
  var marginBottom = parseInt(style.getPropertyValue('margin-bottom'), 10);
  var height = document.body.offsetHeight;
  marginTop = isNaN(marginTop) ? 0 : marginTop;
  marginBottom = isNaN(marginBottom) ? 0 : marginBottom;
  var windowHeight = height + marginTop + marginBottom;
  // the body height can not take fixed position elements into account
  
  // add some extra height so that there is room for changes in the DOM
  return windowHeight + 160;
};

window.addEventListener("message", function(ev) {
  if (ev.data.type === 'acos-resizeiframe') {
    var responseData = {
      height: getHeight(),
      iframeid: ev.data.iframeid,
      type: 'acos-resizeiframe-size',
    };
    if (responseData.height) {
      ev.source.postMessage(responseData, ev.origin);
    }
  }
}, false);

// send an init message when the document has loaded in case the parent window cannot detect that otherwise
document.addEventListener("DOMContentLoaded", function(event) {
  var data = {
    type: 'acos-resizeiframe-init',
  };
  window.parent.postMessage(data, '*');
});

})(window, document);
