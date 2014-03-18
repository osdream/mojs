//utils
var util = {
    getEl: function(id) {
        return document.getElementById(id);
    },
    getElPos: function(el) {
        return [parseInt(el.offsetLeft, 10), parseInt(el.offsetTop, 10)];
    },
    /*计算直角边*/
    calculPy: function(l, w) {
        return Math.sqrt(Math.pow(l, 2) + Math.pow(w, 2));
    },
    /*计算两点间距离*/
    calculDis: function(pos1x, pos1y, pos2x, pos2y) {
        return this.calculPy(pos1x - pos2x, pos1y - pos2y);
    }
};

var container = util.getEl("container");
var hammertime = new Hammer(container, { drag_max_touches: 0 });
hammertime.on("touch", function(ev) {
    dragCtrl.catchEvt(ev, true);
});
hammertime.on("drag", function(ev) {
    dragCtrl.catchEvt(ev);
});
hammertime.on("touchend dragend", function(ev) {
    // var touches = ev.gesture.touches;

    // ev.gesture.preventDefault();

    // for(var t = 0, len = touches.length; t < len; t++) {
    //     target = touches[t].target;
    //     if(target.className.indexOf("drag") < 0) {
    //         return;
    //     }
        dragCtrl.resetPos();
    // }
});

hammertime.on("touch", function(ev) {
    var touches = ev.gesture.touches;

    ev.gesture.preventDefault();

    for(var t = 0, len = touches.length; t < len; t++) {
        target = touches[t].target;
        if(target.className.indexOf("fire") < 0) {
            return;
        }
        console.log('biang biang biang!');
    }
});

var dragCtrl = {
    init: function(options) {
        this.container = container;
        this.dragScope = util.getEl("drag-scope");
        this.dragEl = util.getEl("drag");
        this.fireEl = util.getEl("fire");
        this.scopePos = util.getElPos(this.dragScope);
        this.dragInitPos = util.getElPos(this.dragEl);

        options = options || {};
        this.positionEmitInter = options['positionEmitInter'] || 100; //发送位移时间间隔
        this.positionListener = options['positionListener'] || function(moLeft, moTop) {
            console.log(moLeft, moTop);
        };//位移监听回调
    },
    resetPos: function() {
        this.holding = false;
        clearTimeout(this.positionEmitter);
        this.setDragPos(this.dragInitPos[0], this.dragInitPos[1]);
        this.initTouchOffsetX = 0;
        this.initTouchOffsetY = 0;
    },
    move: function(toLeft, toTop) {
        var moLeft = toLeft - this.initTouchX;
        var moTop = toTop - this.initTouchY;

        var initLeft = this.dragInitPos[0];
        var initTop = this.dragInitPos[1];

        var dis = util.calculPy(moLeft, moTop);

        if(dis > 30) {
            moLeft = moLeft * 30 / dis;
            moTop = moTop * 30 / dis;
        }

        tarLeft = initLeft + moLeft;
        tarTop = initTop + moTop;

        this.positionListener(moLeft, moTop);
        this.setDragPos(tarLeft, tarTop);
    },
    setDragPos: function(tarLeft, tarTop) {
        this.dragEl.style.left = tarLeft + "px";
        this.dragEl.style.top = tarTop + "px";
    },
    catchEvt: function(ev, isTouch) {
        var touches = ev.gesture.touches;

        ev.gesture.preventDefault();

        for(var t = 0, len = touches.length; t < len; t++) {
            var touchEvt = touches[t];
            var target = touchEvt.target;
            if(target.className.indexOf("drag") < 0) {
                return;
            }
            console.log(touchEvt);
            var proxyX = touchEvt.pageX;
            var proxyY = touchEvt.pageY;
            if(isTouch) {
                this.initTouchX = proxyX;
                this.initTouchY = proxyY;
            }
            dragCtrl.move(proxyX, proxyY);
        }
    }
};

var gunCtrl = {

};

dragCtrl.init();