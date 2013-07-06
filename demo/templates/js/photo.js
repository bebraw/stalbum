$(function() {
    $('.photo').yabox({
        cbs: {
            show: $().yabox.animated.show(),
            hide: $().yabox.animated.hide()
        }
    });
});
