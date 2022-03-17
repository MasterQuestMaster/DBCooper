const timer = class {
    constructor(millis, callback) {
        this.active = false;
        this.millis = millis;
        this.callback = callback;
    }

    start() {
        this.reset();
        this.active = true;
        var timer = this;
        this.task = setInterval(function(){
            if (timer.active) {
                timer.callback();
            }
        }, this.millis);
    }

    stop() {
        this.active = false;
        clearInterval(this.task);
    }

    reset() {
        this.stop();
    }

    restart() {
        this.stop();
        this.start();
    }
}

module.exports = {
    Timer: timer
}