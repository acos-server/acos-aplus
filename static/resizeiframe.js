document.addEventListener("DOMContentLoaded", function() {
  var acosAplusResizeIframe = function($, window, document, undefined) {
    var exerciseWrapper = $('#exercise-page-content'); // A+ adds this around exercise content
    var newWidth = Math.max(exerciseWrapper.width(), 500); // full width of the exercise area in the A+ page
    var newHeight = Math.max($(window).height() * 0.8, 500); // 80% of viewport height
    $('.acos-iframe').width(newWidth).height(newHeight);
  };
  
  var init = function($, window, document) {
    acosAplusResizeIframe($, window, document);
    $(window).on('resize', function() {
      acosAplusResizeIframe($, window, document);
    });
  };

  if (typeof require === 'function') {
    // in a require.js environment, import jQuery
    require(["jquery"], function(jQuery) {
      init(jQuery, window, document);
    });
  } else {
    // in A+ (jQuery defined in the global namespace)
    init(jQuery, window, document);
  }
});
