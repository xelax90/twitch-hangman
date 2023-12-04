function TwitchHangman(options)
{
    var that = this;
    var interval;
    var elm = document.createElement('div');
    jQuery.ajax({
        method: 'GET',
        url: '/api/status'
    }).then((data) => {
        if (data.word === null) {
            start();
        }
    });

    var start = function() {
        jQuery.ajax({
            method: 'GET',
            url: '/api/start'
        }).then((data) => {
            const event = new CustomEvent("start", {
                detail: {
                    word: data
                }
            });
            elm.dispatchEvent(event);
            if (! interval) {
                interval = setInterval(refresh, 100);
            }
        });
    };

    var refresh = function() {
        jQuery.ajax({
            method: 'GET',
            url: '/api/status'
        }).then((data) => {
            if (data.wonBy) {
                finish(data.wonBy, data.solution);
            } else {
                const event = new CustomEvent("refresh", {
                    detail: {
                        word: data.word
                    }
                });
                elm.dispatchEvent(event);
            }
        });
    };

    var finish = function(wonBy, solution) {
        clearInterval(interval);
        interval = null;
        setTimeout(start, 10000);
        const event = new CustomEvent("finish", {
            detail: {
                word: solution,
                winner: wonBy
            }
        });
        elm.dispatchEvent(event);
    }

    that.run = function() {
        interval = setInterval(refresh, 100);
    }

    that.addEventListener = function () {
        elm.addEventListener.apply(elm, arguments);
    };
}