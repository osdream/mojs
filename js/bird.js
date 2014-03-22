//browser detect
function prefix(style) {
    if (vender === '') return style;

    style = style.charAt(0).toUpperCase() + style.substr(1);
    return vender + style;
}

var dummyStyle = document.createElement('div').style;
var vender = (function() {
    var vendors = 't,webkitT,MozT,msT,OT'.split(','),
        t,
        i = 0,
        l = vendors.length;

    for (; i < l; i++) {
        t = vendors[i] + 'ransform';
        if (t in dummyStyle) {
            return vendors[i].substr(0, vendors[i].length - 1);
        }
    }

    return false;
})();
var transformAttr = prefix('transform');
var transformOriginAttr = prefix('transformOrigin');
var transitionAttr = prefix('transition');

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
    },
    getComputedStyle: function(dom, styleAttr) {
        return window.getComputedStyle(dom)[styleAttr];
    },
    createDom: function(nodeName, c) {
        var el = document.createElement(nodeName);
        el.className = c;
        return el;
    }
};

var container = util.getEl("container");
var hammertime = new Hammer(container, { drag_max_touches: 1 });
hammertime.on("touch", function(ev) {
    if(bg.isDie) {
        var touches = ev.gesture.touches;

        ev.gesture.preventDefault();

        for(var t = 0, len = touches.length; t < len; t++) {
            target = touches[t].target;
            if(bg.replay == target) {
                bg.replay.style.display = "none";
                birdCtrl.reset();
                bg.reset();
                return;
            }
        }
        return;
    }
    birdCtrl.jump(ev);
});


var birdCtrl = {
    init: function() {
        this.bird = util.getEl('bird');
        this.g = 9.8;
        this.left = 100;
        this.moveInterTime = 50;
        this.startV = -40;
        this.curBottom = this.getBottomVal();
        this.initBottom = this.curBottom;
        this.jump();
    },
    reset: function() {
        this.bird.innerHTML = "鸟";
        this.curBottom = this.initBottom;
        this.bird.style.bottom = this.curBottom + "px";
        this.bird.style.width = "30px";
        this.bird.style.height = "30px";
        this.jump();
    },
    jump: function(ev) {
        clearTimeout(this.downInter);
        this.curBottom = this.getBottomVal();
        this.jumpTime = new Date().getTime();
        this.curV = this.startV;
        this.down();
    },
    down: function() {
        var me = this;
        var calculInter = this.moveInterTime / 130;
        this.curV = this.curV + this.g * calculInter;
        var toBottom = this.curBottom - this.curV * calculInter;
        if(toBottom <= 0) {
            toBottom = 1;
            clearTimeout(this.downInter);
        }
        this.setBottomVal(toBottom);
        if(1 >= toBottom) {
            return;
        }
        this.downInter = setTimeout(function() {
            me.down();
        }, me.moveInterTime);
    },
    getBottomVal: function() {
        return parseInt(util.getComputedStyle(this.bird, "bottom"), 10);
    },
    setBottomVal: function(val) {
        this.curBottom = val;
        this.bird.style.bottom = val + "px";
    },
    die: function() {
        clearTimeout(this.downInter);
        this.bird.innerHTML = "死鸟";
        this.bird.style.width = "50px";
        this.bird.style.height = "50px";
        bg.replay.style.display = "block";
    }
}

var bg = {
    init: function() {
        this.bg = util.getEl("bg");
        this.scoreDom = util.getEl("score");
        this.replay = util.getEl("replay");
        this.curPos = this.getLeft();
        this.initPos = this.curPos;
        this.walls = [];
        this.gapsTop = [];
        this.initWallNum = 6;
        this.wallDis = 100;
        this.wallWidth = 30;
        this.moveDis = 2;
        this.moveInterTime = 22;
        this.buildTimes = 0;
        this.buildWalls();
        this.wallMove();
        this.isDie = false;
    },
    reset: function () {
        this.isDie = false;
        this.bg.style.left = this.initPos + "px";
        this.scoreDom.innerHTML = "score: 0";
        this.wallMove();
        this.buildTimes = 0;
    },
    buildWalls: function() {
        for(var i = 0, l = this.initWallNum; i < l; i++) {
           this.buildWall(i);
        }
    },
    buildWall: function(i) {
        var wall = util.createDom("div", "wall");
        var gap = util.createDom("div", "wall-gap");
        var gapTop = parseInt(100 * Math.random()) + 80;
        gap.style.top = gapTop + "px";
        wall.appendChild(gap);
        this.gapsTop.push(gapTop);
        this.walls.push(wall);
        this.bg.appendChild(wall);
    },
    wallMove: function() {
        var me = this;
        var curLeft = me.getLeft();
        me.isDie = me.chkCurWall(curLeft);
        if(me.isDie) {
            birdCtrl.die();
            this.stop();
            return;
        }
        if(0 == curLeft) {
            me.buildWalls();
        }
        if(- (me.wallDis + me.wallWidth) * me.initWallNum >= curLeft) {
            for (var i = me.initWallNum - 1; i >= 0; i--) {
                me.gapsTop.shift();
                me.bg.removeChild(me.walls.shift());
            };
            me.bg.style.left = curLeft + me.initWallNum * (me.wallDis + me.wallWidth) + "px";
            this.buildTimes = this.buildTimes + 1;
            me.buildWalls();
        }
        me.bg.style.left = me.getLeft() - me.moveDis + "px";
        me.moveTimer = setTimeout(function() {
            if(me.isDie) {
                return;
            }
            me.wallMove();
        }, me.moveInterTime);
    },
    getLeft: function(dom) {
        if(dom) {
            return parseInt(util.getComputedStyle(dom, "left"), 10);
        }
        return parseInt(util.getComputedStyle(this.bg, "left"), 10);
    },
    chkCurWall: function(curLeft) {
        if(curLeft > 130) {
            return false;
        }
        var moveWidth = Math.abs(130 - curLeft);

        var leftWalls = Math.floor(moveWidth / (this.wallDis + this.wallWidth));
        var curWallMov = moveWidth % (this.wallDis + this.wallWidth);


        if(this.curWall) {
            this.curWall.style.backgroundColor = "#555";
        }
        this.curWall = this.walls[leftWalls];

        var birdTop = 360 - 32 - birdCtrl.curBottom;
        var gapTop = this.gapsTop[leftWalls];

        if(curWallMov >= 60) {
            this.curWall.style.backgroundColor = "#555";
            return false;
        } else {
            this.curWall.style.backgroundColor = "#777";
        }

        if(birdTop < gapTop - 6 || birdTop > gapTop + 94) {
            return true;
        } else {
            this.scoreDom.innerHTML = "score: " + (leftWalls + this.buildTimes * this.initWallNum + 1);
            return false;
        }

    },
    stop: function() {
        clearTimeout(this.moveTimer);
    }
}

birdCtrl.init();
bg.init();
