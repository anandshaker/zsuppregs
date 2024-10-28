sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("zsuppregs.controller.App", {
      onInit: function () {
        // for screen resolution.
        var zoom = ((window.outerWidth - 10) / window.innerWidth) * 100;
        if (zoom > 85) {
          document.body.style.zoom = "80%";
        }

      }
    });
  }
);
