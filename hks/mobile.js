(function (window, document) {
var context = {};

//var notFromShare = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)$/);
//if(!notFromShare) {
//    $('body').removeClass('loading').addClass('fromShare');
//    return;
//}

function _log(s, dom) {
    console && console.log(s);
    return;
}
function _err(s, dom) {
    alert(s);
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
var nextFrame = (function() {
    return window.requestAnimationFrame ||
        window[vender + 'RequestAnimationFrame'] ||
        function(callback) {
            return setTimeout(callback, 1000 / 60);
    };
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
    },
    waitVariableExists: function(varName, context, callback) {
        var timer = null;
        function check() {
            if (context[varName]) {
                timer && clearTimeout(timer);
                callback(context[varName]);
            }
            else {
                timer = setTimeout(check, 200);
            }
        }
        check();
    }
}

context.gameCenter = null;
context.connect = null;
require.config({
    paths: {
        'muses': 'http://ecma.bdimg.com/lego-mat/muses'
    }
});
// 加载Connect模块
require(['muses/connect'], function(Connect) {
    var gameCenter = new GameCenter({
        MusesConnect: Connect
    });
    context.gameCenter = gameCenter;

    gameCenter.addListener(
        GameCenter.Events.ROOM_ENTERED,
        function(conn) {
            context.connect = conn;
            pageCtl.comp = new competition({
                conn: conn,
                isMaster: !gameCenter.getRoomData().result.full
            });
        }
    );
    gameCenter.addListener(
        GameCenter.Events.PLAYER_MESSAGE_RECEIVED,
        function(data) {
            pageCtl.comp && pageCtl.comp.get(data);
        }
    );
    var oppoExist = false;
    gameCenter.addListener(
        GameCenter.Events.OPPONENT_ENTER_ROOM,
        function(conn, oppoPlayer) {
            // 如果有多个玩家，抛弃后面的玩家...
            if (oppoExist) {
                return;
            }
            // 通知页面对手信息
            pageCtl.getOppo(oppoPlayer.userName);
            oppoExist = true;
        }
    );
});

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
    comp: null,
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
            setTimeout(function() {
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
        // 在用户输入名称之后启动GameCenter
        var me = this;
        utils.waitVariableExists('gameCenter', context, function() {
            context.gameCenter.start(
                GameCenter.ClientMode.PLAYER,
                {
                    userName: me.userName
                }
            );
        });
        this.findingOppo();
    },
    findingOppo: function() {
        this.frameSearch.show();
        this.oppoNameDom.text('搜寻对手中');
        this.isFinding = true;
        this.findingAnimation();
        //test
        // setTimeout(function() {
        //     pageCtl.getOppo();
        // }, 1000);
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
        this.comp && this.comp.getOppo();
        var me = this;
        setTimeout(function() {
            me.frameSearch.hide();
            me.frame2.show();
        }, 1000);
    },
    fail: function() {
        $('#frameFail').show();
    },
    getOppoData: function(data) {
        fruitsCtl.setOppoInfo(data);

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
    startBtn: $('#frame2 .start'),
    waitTime: $('#waitTime'),
    myTime: $('#fruitWrap .useSeconds'),
    readTime: 3000,
    originPos: [[0, 0], [60, 0], [120, 0], [180, 0], [240, 0]],
    targetPos: [[40, 30], [80, 80], [120, 20], [160, 90], [200, 30]],
    oppoFruitWrap: $('#oppoFruitWrap'),
    oppoTime: $('#oppoFruitWrap .useSeconds'),
    oppoRatio: [2/3, 2/3],
    oppoOffsetLeft: 0,
    oppoReady: $('#oppoFruitWrap .oppoReady'),
    fruitGap: 10,
    fruitWidth: 50,
    oppoFruitWidth: 35,
    dishHeight: 80,
    init: function() {
        window.scrollTo(0, 1);
        this.bgPrefix = 'http://ecma.bdimg.com/adtest/hks140615fruit0';
        this.fruitDoms = this.fruitWrap.find('.fruits');
        this.oppoFruitDoms = this.oppoFruitWrap.find('.oppoFruits');
        this.fruits = [1,2,3,4,5];
        var me = this;
        this.startBtn.click(function() {
            if(true === me.startGame) {
                return;
            }
            me.reset(true);
            me.startBtn.addClass('disable');
            pageCtl.comp && pageCtl.comp.setStatus('ready');
        });
        this.initPos();
    },
    initPos: function() {
        var fH = pageCtl.vHeight * 3 / 5;
        var oH = pageCtl.vHeight * 2 / 5;
        this.fruitWrap.height(fH);
        this.oppoFruitWrap.height(oH);
        var restWidth = pageCtl.vWidth - 300;
        var offsetLeft = (restWidth > 0 ? restWidth / 2 + 5 : 0);
        var offsetTop = fH - this.dishHeight - this.fruitWidth;
        var oppoRestWidth = pageCtl.vWidth - 205;
        var oppoOffsetLeft = (oppoRestWidth > 0 ? oppoRestWidth / 2 + 3 : 0);
        this.oppoOffsetLeft = oppoOffsetLeft - restWidth * this.oppoRatio[0] / 2;
        this.oppoOffsetTop = oH - 100;
        if(hasTransition) {
            [].forEach.call($('.fruits, .oppoFruits'), function(el, index) {
                el.style[transitionProperty] = cssPrefix + 'transform';
                el.style[transitionDuration] = '300ms';
            });
        }
        var me = this;
        [].forEach.call(this.originPos, function(arr, index) {
            me.originPos[index] = [arr[0] + offsetLeft, arr[1] + offsetTop];
        });
        [].forEach.call(this.targetPos, function(arr, index) {
            me.targetPos[index] = [arr[0] + offsetLeft, arr[1]];
        });
        this.originPosTopline = this.originPos[0][1];

        this.fruitWrap.find('.fruitDish').css('left', offsetLeft - this.fruitGap / 2);
        this.oppoFruitWrap.find('.oppoDish').css('left', oppoOffsetLeft - this.fruitGap * this.oppoRatio[0] / 2);
        this.refreshPos(true);
    },
    checkWaitTime: function(startTime) {
        var me = this;
        var curTime = new Date().getTime();
        var goTime = curTime - startTime;
        me.waitTime.text(Math.round((me.readTime - goTime)/1000));
        if(goTime >= me.readTime) {
            me.waitTime.text('start').fadeOut(200);
            //me.toFruits = me.createSeq(me.fruits);
            //me.toFruits = me.fruits.slice();//FIXME
            me.refreshPos();
            return;
        }
        setTimeout(function() {
            me.checkWaitTime(startTime);
        }, 1000);
    },
    refreshPos: function(isStart) {
        var me = this;
        if(!isStart) {
            me.gameRefreshed = true;
            me.gameStartTime = new Date().getTime();
        }
        [].forEach.call(this.fruitDoms, function(el, index) {
            me.setFruitPos(el, index, isStart);
        });
        [].forEach.call(this.oppoFruitDoms, function(el, index) {
            me.setFruitPos(el, index, isStart, true);
        });
        this.dragRightNum = 0;
    },
    setFruitPos: function(el, index, isStart, isOppo) {
        if(isStart) {
            var elPos = this.fruits.indexOf(index + 1);
            var pos = this.originPos[elPos];
        } else {
            var pos = this.targetPos[this.toFruits[index] - 1];
        }
        if(isOppo) {
            pos = [pos[0] * this.oppoRatio[0] + this.oppoOffsetLeft, pos[1] * this.oppoRatio[1] + (isStart ? -this.oppoOffsetTop : 60)];
        } else {
            pos = [pos[0], pos[1] + (isStart ? 0 : 10)];
            $(el).data('pos', pos);
            $(el).removeClass('droped');
        }
        this._setPos(el, pos);
    },
    _setPos: function(el, pos) {
        if(hasTransition) {
            el.style[transformAttr] = 'translate3d(' + pos[0] + 'px, ' + pos[1] + 'px, 0)';
        } else {
            $(el).animate({left: pos[0], top: pos[1]});
        }
    },
    checkSeq: function(ele, index, isOppo) {
        if(!this.startGame) {
            return;
        }
        var curDom = $(ele);
        if(curDom.hasClass('fruitRight')) {
            return;
        }
        var oriFruit = this.fruits[index];
        if(curDom.hasClass('fruit0' + oriFruit)) {
            curDom.addClass('fruitRight');
        } else {
            curDom.addClass('fruitErr');
            if(!isOppo) {
                this.checkFail(curDom);
                return;
            }
        }
        if(!isOppo) {
            this.dragRightNum++;
        }
        if(5 == this.dragRightNum && !isOppo) {
            this.checkOK();
        }
    },
    checkFail: function(ele) {
        this.setSeconds();
        this.startGame = false;
        this.gameRefreshed = false;
        this.startBtn.removeClass('disable');
        //this.startBtn.text('重新开始');
    },
    checkOK: function() {
        this.setSeconds();
        this.startGame = false;
        this.gameRefreshed = false;
        this.startBtn.removeClass('disable');
        //this.startBtn.text('重新开始');
        this.reset();
    },
    setSeconds: function() {
        //test
        //pageCtl.getOppoData({fruits: [[3,1],[2,2],[0,4],[1,3],[4,0]], time: 23.445});
        pageCtl.getOppoData({fruits: [[3,1],[2,2],[0,4]], time: 13.142});
        var now = new Date().getTime();
        deltaTime = (now - this.gameStartTime) / 1000;
        this.myTime.text(deltaTime + '秒');
    },
    setOppoInfo: function(data) {
        var fruitsArr = data['fruits'];
        var useTime = data['time'];
        var me = this;
        fruitsArr.forEach(function(arr, index) {
            var el = me.oppoFruitDoms[arr[0]];
            me.checkSeq(el, arr[1], true);
            me.setFruitPos(el, arr[1], true, true);
        });
        this.oppoTime.text(useTime);
    },
    reset: function(isStart) {
        this.fruitDoms.removeClass('fruitRight').removeClass('fruitErr');
        if(isStart) {
            //this.fruits = this.createSeq(this.fruits);
            //this.fruits = this.fruits.slice();//FIXME
            //this.toFruits = this.fruits.slice();
            this.refreshPos(true);
        }
    },
    startTask: function(curFruits, tarFruits) {
        this.fruits = curFruits;
        this.toFruits = tarFruits;
        this.startGame = true;
        var startTime = new Date().getTime();
        this.myTime.text('');
        this.waitTime.show().text(Math.round(this.readTime/1000));
        this.checkWaitTime(startTime);
    }
};
fruitsCtl.init();

//比赛
var competition = function(option) {
    this.ready = false;
    this.reset();
    this.isMaster = option['isMaster'];
    this.conn = option['conn'];
    this.init();
};
competition.prototype.init = function() {
    this.competeTimes = 3;
    this.curCompeteTime = 0;
    this.taskArr = [1,2,3,4,5];
    this.taskHashs = [];
    this.status = 'waiting';
    this.myStatus = {
        status: 'waiting',
        score: 0
    };
    this.opStatus = {
        status: 'waiting',
        score: 0
    };
    if(this.isMaster) {//主机发题
        this.createTasks();
    }
};
competition.prototype.createTasks = function() {
    var taskNum = this.competeTimes;
    for(var i = 0; i < taskNum * 2; i++) {
        this.taskHashs.push(this.createSeq(this.taskArr));
    }
};
competition.prototype.createSeq = function(arr) {
    var toArr = arr.slice();
    toArr.sort(function() {
        return 0.5 - Math.random();
    });
    return toArr;
};
competition.prototype.handleMyStatus = function() {

};
competition.prototype.handleOpStatus = function() {

};
competition.prototype.checkStatus = function() {
    var ms = this.myStatus['status'];
    var os = this.opStatus['status'];
    switch(this.status) {
        case 'waiting':
            if('ready' == ms && 'ready' == os) {
                this.status = 'playing';
                this.startComp();
            }
            break;
    }
};
competition.prototype.startComp = function() {
    var curFruits = this.taskHashs[this.curCompeteTime];
    var tarFruits = this.taskHashs[this.curCompeteTime + this.competeTimes];
    fruitsCtl.startTask(curFruits, tarFruits);
};
competition.prototype.setStatus = function(status) {
    this.myStatus.status = status;
    this.checkStatus();
    this.send({'status': status});
};
competition.prototype.reset = function() {
    this.myStatus = null;
    this.opStatus = null;
};
//对手连接成功
competition.prototype.getOppo = function(data) {
    if(this.isMaster) {//主机发题
        this.send({
            status: 'waiting',
            tasks: this.taskHashs
        });
    }
};
competition.prototype.send = function(data) {
    var dataObj = {
        type: 'message',
        data: data
    };
    this.conn.send(dataObj);
};
competition.prototype.get = function(data) {
    if(!this.isMaster && data.tasks) {
        this.taskHashs = data.tasks;
        console.log(this.taskHashs);
    }
    this.opStatus.status = data.status;
    this.checkStatus();
}

//滑块控制
var dragCtrl = {
    catchDis: 25,//距离盘子多少被捕获
    dragDropIndex: null,
    init: function(options) {
        this.hammerInited = false;
        this.lastLeft = null;
        this.lastTop = null;

        options = options || {};
        this.positionEmitInter = options['positionEmitInter'] || 200; //发送位移时间间隔
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
            if(fruitsCtl.gameRefreshed && ev.target.className.indexOf("fruits") >= 0 && ev.target.className.indexOf("droped") < 0) {
                dragCtrl.holding = true;
                dragCtrl.catchEvt(ev, true);
            }
        });
        hammertime.on("drag", function(ev) {
            dragCtrl.catchEvt(ev);
        });
        hammertime.on("touchend dragend", function(ev) {
            if(dragCtrl.holding) {
                dragCtrl.resetPos();
            }
        });
    },
    resetPos: function() {
        this.holding = false;
        clearTimeout(this.positionEmitter);
        this.dragingDom.style[transitionProperty] = cssPrefix + 'transform';
        if(null !== this.dragDropIndex) {
            this.setDragPos(fruitsCtl.originPos[0], fruitsCtl.originPos[1], true);
            fruitsCtl.checkSeq(this.dragingDom, this.dragDropIndex);
            $(this.dragingDom).addClass('droped');
        } else {
            this.setDragPos(this.dragInitPos[0], this.dragInitPos[1], true);
        }
        $(this.dragingDom).removeClass('holding');
        this.initTouchX = 0;
        this.initTouchY = 0;
        this.dragDropIndex = null;
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
        this.checkDragPos(tarLeft, tarTop);
    },
    //check if the fruit is near the dish
    checkDragPos: function(tarLeft, tarTop) {
        var catched = (tarTop > fruitsCtl.originPosTopline - 25 && tarTop < fruitsCtl.originPosTopline + 25);
        if(catched) {
            catched = false;
            for(var i = 0, len = fruitsCtl.originPos.length; i < len; i++) {
                var pos = fruitsCtl.originPos[i];
                var dis = utils.calculPy(tarLeft - pos[0], tarTop - pos[1]);
                if(dis < this.catchDis) {
                    this.dragDropIndex = i;
                    this.setDragPos(pos[0], pos[1]);
                    catched = true;
                    break;
                }
            }
        }
        if(!catched) {
            this.dragDropIndex = null;
            this.setDragPos(tarLeft, tarTop);
        }
    },
    setDragPos: function(tarLeft, tarTop, isReset) {
        var me = this;
        nextFrame(function() {
            if(me.dragingDom) {
                me.dragingDom.style[transformAttr] = 'translate3D(' + tarLeft + 'px, ' + tarTop + 'px, 0)';
            }
            if(isReset) {
                me.dragingDom = null;
            }
        });
        //fruitsCtl._setPos(this.dragingDom, [tarLeft, tarTop]);
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
                $(target).addClass('holding');
                this.holding = true;
                this.dragingDom = target;
                target.style[transitionProperty] = 'none';
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
