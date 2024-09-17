(function($) {
    "use strict";
    $(window).on("load", function() {
        $("[data-loader=\"circle-side\"]").fadeOut();
        $("#preloader").delay(350).fadeOut("slow");
        $("body").delay(350).css({
            'overflow': "visible"
        });
    });
    $("form#wrapped").on("submit", function() {
        var $form = $("form#wrapped");
        $form.validate();
        if ($form.valid()) {
            $("#loader_form").fadeIn();
        }
    });
    var floatLabels = new FloatLabels("form", {
        style: 2
    });
    $(".container_smile").click(function() {
        $(this).find("input").toggleClass("rotate-x");
    });
})(window["jQuery"]);