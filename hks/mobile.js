(function (window, document) {

//var notFromShare = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)$/);
//if(!notFromShare) {
//    $('body').removeClass('loading').addClass('fromShare');
//    return;
//}

function _log(s, dom) {
    console && console.log(s);
    return;
}

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
var cssPrefix = vender ? '-' + vender.toLowerCase() + '-' : '';
var transformAttr = prefix('transform');
var transitionProperty = prefix('transitionProperty');
var transitionDuration = prefix('transitionDuration');
var transitionDelay = prefix('transitionDelay');
var hasTransition = false;
if(transitionProperty in dummyStyle) {
    hasTransition = true;
}

//工具
var utils = {
    cookie: function(name, value, expiredays) {
        var dc = document.cookie;
        var cs;
        var ce;
        if (null === value || "" === value) {
            var exDate = new Date();
            var cv = this.cookie(name);
            exDate.setTime(Date.now() - 1);
            if (cv) {
                document.cookie = name + "=" + escape(cv) + ";expires=" + exDate.toGMTString();
            }
            return false;
        }
        if (arguments.length > 1) {
            var exDate = new Date();
            var days = expiredays || 3650;
            exDate.setTime(Date.now() + days * 24 * 60 * 60 * 1000);
            document.cookie = name + "=" + escape(value) + ";expires=" + exDate.toGMTString();
        } else {
            if (dc.length > 0) {
                cs = dc.indexOf(name + "=");
                if (-1 != cs) {
                    cs += name.length + 1;
                    ce = dc.indexOf(";", cs);
                    if (-1 == ce) {
                        ce = dc.length;
                    }
                    return unescape(dc.substring(cs, ce));
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }
    },
    /*计算直角边*/
    calculPy: function(l, w) {
        return Math.sqrt(Math.pow(l, 2) + Math.pow(w, 2));
    }
}
//firefox的角度偏转是反的
var isFirefox = /firefox/i.test(navigator.userAgent);
//页面控制
var pageCtl = {
    curScore: 0,
    body: $('body'),
    ctlDom: $('#controller'),
    frame1: $('#frame1'),
    frameSearch: $('#frameSearch'),
    frame2: $('#frame2'),
    oppoNameDom: $('.oppoName'),
    nameDom: $('#name'),
    startBtn: $('#startGame'),
    preImages: ['http://ecma.bdimg.com/adtest/centrum140528bg.png', 'http://ecma.bdimg.com/adtest/centrum140528topc.png',
      'http://ecma.bdimg.com/adtest/centrum140528topm.png', 'http://ecma.bdimg.com/adtest/centrum140528bottomm.png',
      'http://ecma.bdimg.com/adtest/centrum140528bottomc.png', 'http://ecma.bdimg.com/adtest/hks140615fruit01.png',
      'http://ecma.bdimg.com/adtest/hks140615fruit02.png', 'http://ecma.bdimg.com/adtest/hks140615fruit03.png',
      'http://ecma.bdimg.com/adtest/hks140615fruit04.png', 'http://ecma.bdimg.com/adtest/hks140615fruit05.png',
      'http://ecma.bdimg.com/adtest/hks140617dish.png'],
    init: function() {
        //预加载图片
        $.imgpreload(this.preImages, {
            all: function() {
                pageCtl.imageLoaded = true;
                //if(conn.connid > 0) {
                    pageCtl.start();
                //}
            }
        });
        this.detectViewport();
        this.body.on('click', '.knowHelp', function() {
            $('#gameHelp').remove();
        }).on('click', '.showHelp', function() {
            pageCtl.showHelp();
        });
        //conn.prepare();
    },
    showHelp: function() {
        this.ctlDom.append('<div id="gameHelp">比赛规则<span class="knowHelp">我知道了</span></div>');
    },
    detectViewport: function() {
        var vHeight = Math.max(this.body.height(), this.body.width());
        var vWidth = Math.min(this.body.height(), this.body.width());
        this.vHeight = vHeight;
        this.vWidth = vWidth;
    },
    start: function() {
        if(!pageCtl.imageLoaded) {
            settimeout(function() {
                pageCtl.start();
            }, 1000);
            return;
        }
        this.body.removeClass('loading');
        var cookieName = utils.cookie('player');
        if(cookieName) {
            this.nameDom.val(cookieName);
        }
        this.body.addClass('enteringName');
        this.frame1.show();
        this.nameDom.focus(function() {
            pageCtl.nameDom.parent().addClass('nameFocused');
        }).blur(function() {
            pageCtl.nameDom.parent().removeClass('nameFocused');
        }).keypress(function(evt) {
            if(13 === evt.keyCode) {
                pageCtl.nameDom.parent().removeClass('nameFocused');
                pageCtl.fireStart();
            } else {
                pageCtl.nameDom.parent().find('label').removeClass('labelErr');
            }
        });
        this.startBtn.click(function() {
            pageCtl.fireStart();
        });
    },
    fireStart: function() {
        //conn.send('msg', 'start');
        this.userName = this.nameDom.val();
        if('' == this.userName) {
            this.nameDom.focus();
            this.nameDom.parent().find('label').addClass('labelErr');
            return;
        }
        utils.cookie('player', this.userName);
        this.nameDom.blur();
        this.closeFrame1();
        $('.myName').html(this.userName);
        this.findingOppo();
    },
    findingOppo: function() {
        this.frameSearch.show();
        this.oppoNameDom.text('搜寻对手中');
        this.isFinding = true;
        this.findingAnimation();
        //test
        setTimeout(function() {
            pageCtl.getOppo();
        }, 1000);
    },
    findingAnimation: function() {
        var dotNum = 3;
        var me = this;
        function _animate() {
            if(!me.isFinding || !me.oppoNameDom[0]) {
                return;
            }
            dotNum = (dotNum + 1) % 4;
            var dotStr = '';
            for(var i = dotNum; i > 0; i--) {
                dotStr += '-';
            }
            me.oppoNameDom.text(dotStr + '搜寻对手中' + dotStr);
            setTimeout(_animate, 800);
        }
        _animate();
    },
    getOppo: function(oppoName) {
        this.isFinding = false;
        this.oppoNameDom.text(oppoName || '测试对手');
        var me = this;
        setTimeout(function() {
            me.frameSearch.hide();
            me.frame2.show();
        }, 1000);
    },
    fail: function() {
        $('#frameFail').show();
    },
    setScore: function(score) {
        var score = parseInt(score);
        this.curScore = score;
        var ten = parseInt(score / 10);
        var one = score - ten * 10;
        this.score1.css('background-position-y', '-' + (ten * 26) + 'px');
        this.score2.css('background-position-y', '-' + (one * 26) + 'px');
    },
    closeFrame1: function() {
        this.ctlDom.find('.bg-top').css('background-image', 'url(http://ecma.bdimg.com/adtest/centrum140528topm.png)');
        this.ctlDom.find('.bg-bottom').css('background-image', 'url(http://ecma.bdimg.com/adtest/centrum140528bottomm.png)');
        this.nameDom.remove();
        this.startBtn.remove();
        this.frame1.remove();
        this.nameDom = null;
        this.startBtn = null;
        this.frame1 = null;
        this.body.removeClass('enteringName');
    },
    finish: function() {
        var score = this.curScore;
        this.closeFrame1();
        this.frame2.hide();
        this.frame3.show();
        if(score < 10) {
            score = '0' + score;
        }
        this.frame3Num.text(score);
        if(score <= 6) {
            this.scoreType.css('background-image', 'url(http://ecma.bdimg.com/adtest/centrum140528endtype1.png)');
        } else if (score <= 10) {
            this.scoreType.css('background-image', 'url(http://ecma.bdimg.com/adtest/centrum140528endtype2.png)');
        } else {
            this.scoreType.css('background-image', 'url(http://ecma.bdimg.com/adtest/centrum140528endtype3.png)');
        }
    }
};
pageCtl.init();

var fruitsCtl = {
    startGame: false,
    fruitWrap: $('#fruitWrap'),
    oppoFruitWrap: $('#oppoFruitWrap'),
    startBtn: $('#frame2 .start'),
    waitTime: $('#waitTime'),
    readTime: 1000,
    originPos: [[0, 0], [60, 0], [120, 0], [180, 0], [240, 0]],
    targetPos: [[40, 30], [80, 100], [120, 20], [160, 110], [200, 30]],
    offset: [0, 0],
    oppoOffset: [0, 0],
    oppoRatio: [2/3, 2/3],
    fruitGap: 10,
    fruitWidth: 50,
    oppoFruitWidth: 35,
    dishHeight: 80,
    init: function() {
        this.bgPrefix = 'http://ecma.bdimg.com/adtest/hks140615fruit0';
        this.fruitDoms = this.fruitWrap.find('.fruits');
        this.oppoFruitDoms = this.oppoFruitWrap.find('.oppoFruits');
        this.fruits = [1,2,3,4,5];
        var me = this;
        this.startBtn.click(function() {
            if(true === me.startGame) {
                return;
            }
            window.scrollTo(0, 1);
            me.reset(true);
            me.startGame = true;
            me.lastCheckNum = 0;
            me.startBtn.addClass('disable');
            var startTime = new Date().getTime();
            me.waitTime.text(Math.round(me.readTime/1000));
            me.checkWaitTime(startTime);
        });
        this.fruitWrap.on('click', '.fruits', function() {
            if(true !== me.gameRefreshed) {
                return;
            }
            me.checkSeq($(this));
        });
        this.initPos();
    },
    initPos: function() {
        var halfH =  pageCtl.vHeight / 2;
        this.fruitWrap.height(halfH);
        this.oppoFruitWrap.height(halfH);
        var restWidth = pageCtl.vWidth - this.fruitWidth * 5 - this.fruitGap * 4;
        var offLeft = (restWidth > 0 ? restWidth / 2 : 0);
        this.offset = [offLeft, halfH - this.dishHeight - this.fruitWidth];
        var oppoRestWidth = pageCtl.vWidth - this.oppoFruitWidth * 5 - this.fruitGap * 4 * this.oppoRatio[0];
        var oppoOffLeft = (oppoRestWidth > 0 ? oppoRestWidth / 2 : 0);
        this.oppoOffset = [oppoOffLeft, halfH - this.dishHeight - this.oppoFruitWidth];
        if(hasTransition) {
            [].forEach.call($('.fruits, .oppoFruits'), function(el, index) {
                el.style[transitionProperty] = cssPrefix + 'transform';
                el.style[transitionDuration] = '300ms';
            });
        }
        this.fruitWrap.find('.fruitDish').css('left', offLeft - this.fruitGap / 2);
        this.oppoFruitWrap.find('.oppoDish').css('left', oppoOffLeft - this.fruitGap * this.oppoRatio[0] / 2);
        this.refreshPos(true);
    },
    checkWaitTime: function(startTime) {
        var me = this;
        var curTime = new Date().getTime();
        var goTime = curTime - startTime;
        me.waitTime.text(Math.round((me.readTime - goTime)/1000));
        if(goTime >= me.readTime) {
            me.waitTime.text('start');
            me.toFruits = me.createSeq(me.fruits);
            me.refreshPos();
            return;
        }
        setTimeout(function() {
            me.checkWaitTime(startTime);
        }, 1000);
    },
    createSeq: function(arr) {
        var toArr = arr.slice();
        toArr.sort(function() {
            return 0.5 - Math.random();
        });
        return toArr;
    },
    refreshPos: function(isStart) {
        var me = this;
        if(!isStart) {
            me.gameRefreshed = true;
        }
        [].forEach.call(this.fruitDoms, function(el, index) {
            me.setFruitPos(el, index, isStart);
        });
        [].forEach.call(this.oppoFruitDoms, function(el, index) {
            me.setFruitPos(el, index, isStart, true);
        });
    },
    setFruitPos: function(el, index, isStart, isOppo) {
        if(isStart) {
            var elPos = this.fruits.indexOf(index + 1);
            var pos = this.originPos[elPos];
        } else {
            var pos = this.targetPos[this.toFruits[index] - 1];
        }
        if(isOppo) {
            pos = [pos[0] * this.oppoRatio[0] + this.oppoOffset[0], pos[1] * this.oppoRatio[1] + (isStart ? this.oppoOffset[1] : 20)];
        } else {
            pos = [pos[0] + this.offset[0], pos[1] + (isStart ? this.offset[1] : 10)];
        }
        this._setPos(el, pos);
        $(el).data('pos', pos);
    },
    _setPos: function(el, pos) {
        if(hasTransition) {
            el.style[transformAttr] = 'translate(' + pos[0] + 'px, ' + pos[1] + 'px)';
        } else {
            $(el).animate({left: pos[0], top: pos[1]});
        }
    },
    checkSeq: function(ele) {
        if(!this.startGame) {
            return;
        }
        var curDom = $(ele);
        if(curDom.hasClass('clicked')) {
            return;
        }
        this.lastCheckNum++;
        var oriFruit = this.fruits[this.lastCheckNum - 1];
        if(curDom.hasClass('fruit0' + oriFruit)) {
            curDom.addClass('clicked');
        } else {
            this.checkFail(curDom);
            return;
        }
        if(5 == this.lastCheckNum) {
            this.checkOK();
        }
    },
    checkFail: function(ele) {
        this.startGame = false;
        this.startBtn.removeClass('disable');
        this.startBtn.text('重新开始');
        ele.addClass('fruitErr');
    },
    checkOK: function() {
        this.startGame = false;
        this.startBtn.removeClass('disable');
        alert('COOL');
        this.startBtn.text('重新开始');
        this.reset();
    },
    reset: function(isStart) {
        this.fruitDoms.removeClass('clicked').removeClass('fruitErr');
        this.gameRefreshed = false;
        if(isStart) {
            this.fruits = this.createSeq(this.fruits);
            this.toFruits = this.fruits.slice();
            this.refreshPos(true);
        }
    }
}
fruitsCtl.init();

//WebSocket连接处理
var connectHandler = function() {
    this.connCache = {};
    this.connId = 0;
    this.lastLateConnId = -1;
    //this.latencyTime = null;
};
connectHandler.prototype.prepare = function() {
    require.config({
        paths: {
            'muses': 'http://ecma.bdimg.com/lego-mat/muses'
        }
    });
    // 加载Connect模块
    require(['muses/connect'], function(Connect) {
        var matches = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)/);
        var token = matches && matches.length >= 2 ? matches[1] : null;
        var connect = new Connect();
        conn.init(connect);
        connect.connectWith(token)
            .then(function() {
                _log('[INFO] 连接成功，token: ' + token);
                conn.send('msg', 'open');
                pageCtl.start();
                connect.onMessage = function(actions) {
                    conn.get(actions);
                }
            })
            .fail(function(err) {
                conn.fail();
                _log('[FAIL] 连接游戏失败，' + (err ? err : ''));
            });
        connect.onTokenExpired = function() {
            conn.fail();
        }
    });
};
connectHandler.prototype.init = function(connect) {
    this.connect = connect;
};
connectHandler.prototype.fail = function(connect) {
    this.connect.destroy();
    pageCtl.fail();
};
connectHandler.prototype.send = function(type, data) {
    var sendTime = new Date().getTime();
    this.connCache[this.connId] = sendTime;
    //var latencyTime = this.latencyTime || null;
    //this.connect.send([this.connId, sendTime, type, data, latencyTime]);
    this.connect.send([this.connId, sendTime, type, data]);
    this.connId++;
};
connectHandler.prototype.get= function(data) {
    var type = "msg";
    if(data instanceof Array) {
        type = data[0];
        data = data[1];
    }
    if('msg' == type) {
        _log(data);
    }
    if('end' == type) {
        this.destroy();
    }
    if('late' == type) {
        return;//no latencyTime check
        var curTime = new Date().getTime();
        if(this.lastLateConnId < data && this.connCache[data]) {
            this.lastLateConnId = data;
            this.latencyTime = Math.round((curTime - this.connCache[data])/2);
            _log('Net latencyTime: ' + this.latencyTime);
            this.connCache[data] = null;
            delete this.connCache[data];
        }
    }
    if('score' == type) {
        pageCtl.setScore(data);
    }
};
connectHandler.prototype.destroy = function() {
    pageCtl.finish();
    this.connect.destroy();
    orientation.stop();
};

function Orientation() {
    this.hasDeviceOrientation = 'ondeviceorientation' in window;

    this.threshold = 0.5;
    this.timeInterval = 300;

    this.lastTime = new Date();
    this.lastOrientationTime = new Date();

    this.lastZ = null;
};

Orientation.prototype.reset = function() {
    this.lastTime = new Date();

    this.lastZ = null;
};

/**
 * 开始手机翻转互动
 * @return {boolean} true: 支持并使用手机翻转, false: 不支持手机翻转
 */
Orientation.prototype.start = function() {
    if(!this.hasDeviceOrientation) {
        _log('[INFO] 你的手机不支持通过手机翻转与电脑的互动，将使用控制杆操作。');
        dragCtrl.setType('handler');
        return false;
    }
    this.reset();
    window.addEventListener('deviceorientation', this, false);
    return true;
};

Orientation.prototype.stop = function () {
    if (this.hasDeviceOrientation) { window.removeEventListener('deviceorientation', this, false); }
    this.reset();
};

Orientation.prototype.deviceorientation = function(e) {
    var currentTime = new Date();
    timeDifference = currentTime.getTime() - this.lastOrientationTime.getTime();
    if(timeDifference > this.timeInterval) {
        this.lastOrientationTime = new Date();
        var a = isFirefox ? Math.round(-e.alpha) : Math.round(e.alpha);
        var b = isFirefox ? Math.round(-e.beta)  : Math.round(e.beta);
        var g = isFirefox ? Math.round(-e.gamma) : Math.round(e.gamma);
        var deltaZ = 0;
        if (this.lastZ === null) {
            this.lastZ = g;
            return;
        }

        deltaZ = Math.abs(this.lastZ - g);
        //+(conn.connId > 1) for send latencyTime to PC ASAP
        //if(deltaZ < 5 && conn.connId > 1) {
        if(deltaZ < 5) {
            return;
        }
        this.lastZ = g;
        conn.send('ori', [a, b, g]);
    }
};

Orientation.prototype.handleEvent = function(e) {
    if ('function' === typeof (this[e.type])) {
        return this[e.type](e);
    }
};

//var conn = new connectHandler();
//var orientation = new Orientation();

//滑块控制
var dragCtrl = {
    init: function(options) {
        this.hammerInited = false;
        this.dragDom = $('#drag')[0];
        this.lastLeft = null;
        this.lastTop = null;

        options = options || {};
        this.positionEmitInter = options['positionEmitInter'] || 100; //发送位移时间间隔
        //位移监听回调
        this.positionListener = options['positionListener'] || function() {
            var moLeft = this.moLeft;
            var moTop = this.moTop;
            if(!this.lastLeft) {
                this.lastLeft = 0;
            }
            if(!this.lastTop) {
                this.lastTop = 0;
            }
            var deltaLeft = Math.abs(moLeft - this.lastLeft);
            var deltaTop = Math.abs(moTop - this.lastTop);
            //+(conn.connId > 1) for send latencyTime to PC ASAP
            //if(deltaLeft <= 5 && conn.connId > 1) {
            if(utils.calculPy(deltaLeft, deltaTop) <= 5) {
                return;
            }
            this.lastLeft =Math.round(moLeft);
            this.lastTop =Math.round(moTop);
            //conn.send('han', [moLeft, 0]);
        };
        this.initHammer();
        var self = this;
    },
    initHammer: function() {
        if(this.hammerInited) {
            return;
        }
        this.hammerInited = true;
        var container = fruitsCtl.fruitWrap[0];
        var hammertime = new Hammer(container, { drag_max_touches: 0 });
        hammertime.on("touch", function(ev) {
            if(ev.target.className.indexOf("fruits") >= 0) {
                dragCtrl.holding = true;
                dragCtrl.catchEvt(ev, true);
            }
        });
        hammertime.on("drag", function(ev) {
            dragCtrl.catchEvt(ev);
        });
        hammertime.on("touchend dragend", function(ev) {
            dragCtrl.resetPos();
        });
    },
    resetPos: function() {
        this.holding = false;
        clearTimeout(this.positionEmitter);
        this.setDragPos(this.dragInitPos[0], this.dragInitPos[1]);
        this.initTouchX = 0;
        this.initTouchY = 0;
        this.dragingDom = null;
    },
    move: function(toLeft, toTop) {
        var moLeft = toLeft - this.initTouchX;
        var moTop = toTop - this.initTouchY;

        var initLeft = this.dragInitPos[0];
        var initTop = this.dragInitPos[1];

        tarLeft = initLeft + moLeft;
        tarTop = initTop + moTop;

        this.moLeft = moLeft;
        this.moTop = moTop;
        this.setDragPos(tarLeft, tarTop);
    },
    setDragPos: function(tarLeft, tarTop) {
        _log([tarLeft, tarTop, 0]);
        fruitsCtl._setPos(this.dragingDom, [tarLeft, tarTop]);
    },
    catchEvt: function(ev, isTouch) {
        if(!this.holding) {
            return;
        }
        var touches = ev.gesture.touches;

        ev.gesture.preventDefault();

        for(var t = 0, len = touches.length; t < len; t++) {
            var touchEvt = touches[t];
            var target = touchEvt.target;
            if(target.className.indexOf("fruits") < 0) {
                return;
            }
            var proxyX = touchEvt.pageX;
            var proxyY = touchEvt.pageY;
            if(isTouch) {
                this.initTouchX = proxyX;
                this.initTouchY = proxyY;
                this.dragInitPos = $(target).data('pos');
                _log(this.dragInitPos);
                this.holding = true;
                this.dragingDom = target;
                this.tickTack();
            }
            dragCtrl.move(proxyX, proxyY);
        }
    },
    tickTack: function() {
        var me = this;
        if(!me.holding) {
            return;
        }
        me.positionEmitter = setTimeout(function() {
            me.positionListener.call(me);
            me.tickTack.call(me);
        }, me.positionEmitInter);
    }
};
dragCtrl.init();
})(window, document);
