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
};
window.onunload = function() {
    pageCtl.comp && pageCtl.comp.leave();
};

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
        MusesConnect: Connect,
        host: 'http://gamecenter_0-0-0-2.jpaas-idea.baidu.com'
    });
    context.gameCenter = gameCenter;

    gameCenter.addListener(
        GameCenter.Events.ROOM_ENTERED,
        function(conn) {
            context.connect = conn;
            var isMaster = !gameCenter.getRoomData().result.full;
            isMaster && ANIM.genStarBlink('blink', 0, 300, 225);
            pageCtl.comp = new competition({
                conn: conn,
                isMaster: isMaster
            });
        }
    );
    gameCenter.addListener(
        GameCenter.Events.PLAYER_MESSAGE_RECEIVED,
        function(data) {
            pageCtl.comp && pageCtl.comp.receiveData(data);
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
    body: $('body'),
    ctlDom: $('#controller'),
    frame1: $('#frame1'),
    frame2: $('#frame2'),
    oppoNameDom: $('.oppoName'),
    nameDom: $('#name'),
    startBtn: $('#startGame'),
    preImages: ['http://ecma.bdimg.com/adtest/centrum140528bg.png',  'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit1.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit2.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit3.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit4.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit5.png',
      'http://ecma.bdimg.com/adtest/hks140617dish.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/btn_ok.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/btn_rule.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/rule_bg.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/m_bg.jpg', 'http://bs.baidu.com/public01/2014-06/hackthon/images/match_board.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/grid_bg.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/match_board.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/grid_right.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/grid_wrong.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/btn_ready.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/ending_bg.png',
      'http://bs.baidu.com/public01/2014-06/star1.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/prize_03.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/star1.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/star1_bg.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/star1_w.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/star2.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/star2_bg.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/star2_w.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/star3_bg.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/star3_w.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/blink.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/star3.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/1.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/2.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/3.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/start.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/txt_lose.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/txt_win.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit_shadow.png'
      //'http://bs.baidu.com/public01/2014-06/hackthon/images/sunlignt.png'
    ],
    comp: null,
    init: function() {
        //预加载图片
        $.imgpreload(this.preImages, {
            all: function() {
                pageCtl.imageLoaded = true;
                pageCtl.start();

            }
        });
        this.detectViewport();
        this.body.on('click', '.knowHelp', function() {
            $('#gameHelp').remove();
        }).on('click', '.showHelp', function() {
            pageCtl.showHelp();
        });
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
            pageCtl.body.addClass('nameFocused');
        }).blur(function() {
            pageCtl.body.removeClass('nameFocused');
        }).keypress(function(evt) {
            if(13 === evt.keyCode) {
                pageCtl.body.removeClass('nameFocused');
                pageCtl.fireStart();
            } else {
                pageCtl.nameDom.parent().find('label').removeClass('labelErr');
            }
        });
        this.startBtn.click(function() {
            pageCtl.fireStart();
        });
        //test
        //pageCtl.succeed(0);
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
        this.frame2.show();
        fruitsCtl.scoreSpan.text('搜寻对手中');
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
            if(!me.isFinding) {
                return;
            }
            dotNum = (dotNum + 1) % 4;
            var dotStr = '';
            for(var i = dotNum; i > 0; i--) {
                dotStr += '.';
            }
            fruitsCtl.scoreSpan.text(dotStr + '搜寻对手中' + dotStr);
            setTimeout(_animate, 800);
        }
        _animate();
    },
    getOppo: function(oppoName) {
        this.isFinding = false;
        fruitsCtl.scoreSpan.text('');
        this.oppoNameDom.text(oppoName || '测试对手');
        this.comp && this.comp.getOppo();
        this.frame2.removeClass('waitingOppo');
    },
    oppoLeave: function(compFinished) {
        if(!compFinished) {
            this.oppoNameDom.text('已经离开');
            fruitsCtl.oppoTime.text('').parent().removeClass('hasTime');
        }
    },
    fail: function() {
        $('#frameSucceed').addClass('showFail').show();
    },
    succeed: function(score) {
        $('#frameSucceed').addClass('show').show();
        ANIM.gen3Stars($('#frameSucceed'), score);
    },
    closeFrame1: function() {
        this.nameDom.remove();
        this.startBtn.remove();
        this.frame1.remove();
        this.nameDom = null;
        this.startBtn = null;
        this.frame1 = null;
        this.body.removeClass('enteringName');
    },
    closeFrame2: function() {
        this.frame2.remove();
    }
};
pageCtl.init();


var fruitsCtl = {
    startGame: false,
    fruitWrap: $('#fruitWrap'),
    startBtn: $('#frame2 .start'),
    scoreSpan: $('#scoreLine span'),
    waitTime: $('#waitTime'),
    myTime: $('#fruitWrap .useSeconds'),
    readTime: 3000,
    originPos: [[0, 0], [64, 0], [128, 0], [192, 0], [256, 0]],
    targetPos: [[40, 30], [80, 100], [120, 20], [160, 100], [200, 30]],
    oppoFruitWrap: $('#oppoFruitWrap'),
    oppoTime: $('#oppoFruitWrap .useSeconds'),
    oppoRatio: [1/2, 1/2],
    oppoOffsetLeft: 0,
    oppoReady: $('#oppoFruitWrap .oppoReady'),
    fruitGap: 0,
    fruitWidth: 64,
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
        this.refreshScore();
        this.initPos();
    },
    initPos: function() {
        var fH = pageCtl.vHeight * 3 / 5;
        var oH = pageCtl.vHeight * 2 / 5;
        this.fruitWrap.height(fH);
        this.oppoFruitWrap.height(oH);
        var restWidth = pageCtl.vWidth - 320;
        var offsetLeft = (restWidth > 0 ? restWidth / 2 : 0);
        var offsetTop = fH - this.fruitWidth - 30;
        var oppoRestWidth = pageCtl.vWidth - 160;
        var oppoOffsetLeft = (oppoRestWidth > 0 ? oppoRestWidth / 2 : 0);
        this.oppoOffsetLeft = oppoOffsetLeft - restWidth * this.oppoRatio[0] / 2;
        this.oppoOffsetTop = oH - 128;
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
        me.waitTime.removeClass('start count1 count2 count3').addClass('count' + Math.round((me.readTime - goTime)/1000));
        if(goTime >= me.readTime) {
            me.waitTime.addClass('start').fadeOut(1000);
            pageCtl.frame2.removeClass('fruitsMask');
            setTimeout(function() {
                me.refreshPos();
            }, 5000);
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
        this.curUseTime = 100000000;
    },
    setFruitPos: function(el, index, isStart, isOppo, isRemoteOppo) {
        if(isStart) {
            if(isOppo && isRemoteOppo) {
                var pos = this.originPos[index];
            } else {
                var elPos = this.fruits.indexOf(index + 1);
                var pos = this.originPos[elPos];
                $(el).removeClass('droped');
            }
        } else {
            var pos = this.targetPos[this.toFruits[index] - 1];
        }
        if(isOppo) {
            pos = [pos[0] * this.oppoRatio[0] + this.oppoOffsetLeft, pos[1] * this.oppoRatio[1] + (isStart ? -this.oppoOffsetTop : 60)];
        } else {
            pos = [pos[0], pos[1] + (isStart ? 0 : 10)];
            $(el).data('pos', pos);
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
        if(!isOppo && pageCtl.comp) {
            var cn = ele.className;
            var cls = /.*(fruit\d{2}).*/.exec(cn)[1];
            pageCtl.comp.sendData({
                status: 'playing',
                taskRes: [cls, index]
            });
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
        this.gameRefreshed = false;
        this.setSeconds();
    },
    checkOK: function() {
        this.gameRefreshed = false;
        this.setSeconds(true);
    },
    setScore: function(myScore, opScore, isWin) {
        this.scoreSpan.text(opScore + " : " + myScore);
    },
    refreshScore: function() {
        this.scoreSpan.text('观察3秒钟，将水果拖至初始的位置');
    },
    setSeconds: function(isFinish) {
        var now = new Date().getTime();
        deltaTime = (now - this.gameStartTime) / 1000;
        this.curUseTime = deltaTime;
        if(pageCtl.comp) {
            pageCtl.comp.myStatus.status = 'finish';
            pageCtl.comp.sendData({
                status: 'finish',
                rightNum: this.dragRightNum,
                useTime: deltaTime
            });
            pageCtl.comp.checkStatus();
        }
        this.myTime.text(deltaTime + '秒').parent().addClass('hasTime');
    },
    showWait: function() {
        if(this.startGame) {
            return;
        }
        this.oppoReady.text('Wait');
    },
    setOppoReady: function() {
        if(this.startGame) {
            return;
        }
        this.oppoReady.text('Ready');
    },
    hideOppoReady: function() {
        this.oppoReady.text('').removeClass('finish');
    },
    setOppoFinish: function(time) {
        this.oppoReady.text('Finish').addClass('finish');
        this.oppoTime.text(time + '秒').parent().addClass('hasTime');
    },
    reset: function() {
        this.startGame = false;
        this.gameRefreshed = false;
        pageCtl.frame2.addClass('fruitsMask');
        this.fruitDoms.removeClass('fruitRight').removeClass('fruitErr');
        this.oppoFruitDoms.removeClass('fruitRight').removeClass('fruitErr');
        this.startBtn.removeClass('disable');
    },
    startTask: function(curFruits, tarFruits) {
        this.fruits = curFruits;
        this.toFruits = tarFruits;
        this.startGame = true;
        this.refreshPos(true);
        var startTime = new Date().getTime();
        this.waitTime.show().addClass('count' + Math.round(this.readTime/1000));
        this.myTime.text('').parent().removeClass('hasTime');
        this.oppoTime.text('').parent().removeClass('hasTime');
        this.hideOppoReady();
        this.checkWaitTime(startTime);
        dragCtrl.restartGame();
    }
};
fruitsCtl.init();

//比赛
var competition = function(option) {
    this.compFinished = false;
    this.reset();
    this.isMaster = option['isMaster'];
    this.conn = option['conn'];
    this.init();
};
competition.prototype.init = function() {
    this.competeTimes = 3;
    this.curCompeteTime = 0;
    this.curCompeteWin = false;
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
competition.prototype.handleOpStatus = function(data) {
    switch(this.opStatus.status) {
        case 'waiting':
            fruitsCtl.showWait();
            break;
        case 'ready':
            fruitsCtl.setOppoReady();
            break;
        case 'playing':
            var opRes = data.taskRes;
            if(opRes) {
                var fruitCls = opRes[0];
                var tarIdx = opRes[1];
                var el = $('#oppoFruitWrap .' + fruitCls);
                fruitsCtl.setFruitPos(el[0], tarIdx, true, true, true);
                fruitsCtl.checkSeq(el[0], tarIdx, true);
            }
            break;
        case 'finish':
            var opRightNum = data.rightNum;
            var opUseTime =  data.useTime;
            this.opStatus['curRightNum'] = opRightNum;
            this.opStatus['curUseTime'] = opUseTime;
            fruitsCtl.setOppoFinish(opUseTime);
            break;
        case 'leave':
            pageCtl.oppoLeave(this.compFinished);
            break;
    }
};
competition.prototype.checkStatus = function() {
    var ms = this.myStatus['status'];
    var os = this.opStatus['status'];
    switch(this.status) {
        case 'waiting':
            if('ready' == ms && 'ready' == os) {
                this.status = 'playing';
                this.setStatus('playing');
                this.startTask();
            }
            break;
        case 'playing':
            if('finish' == ms && 'finish' == os) {
                this.status = 'waiting';
                this.setStatus('waiting');
                this.calCulScore();
                this.finishTask();
            }
            break;
    }
};
competition.prototype.startTask = function() {
    var curFruits = this.taskHashs[this.curCompeteTime];
    var tarFruits = this.taskHashs[this.curCompeteTime + this.competeTimes];
    fruitsCtl.startTask(curFruits, tarFruits);
    this.curCompeteTime++;
};
competition.prototype.finishTask = function() {
    var me = this;
    if(this.curCompeteTime < this.competeTimes) {
        fruitsCtl.reset();
    } else {
        setTimeout(function() {
            me.finishComp();
        }, 3000);
    }
};
competition.prototype.finishComp = function() {
    if(this.myStatus.score > this.opStatus.score) {
        pageCtl.succeed(this.myStatus.score);
    } else if(this.myStatus.score < this.opStatus.score) {
        pageCtl.fail();
    } else {
        pageCtl.succeed(this.myStatus.score);
    }
    this.compFinished = true;
    this.reset();
};
competition.prototype.calCulScore = function() {
    var mRightNum = fruitsCtl.dragRightNum;
    var mCurTime = fruitsCtl.curUseTime;
    var oRightNum = this.opStatus['curRightNum'];
    var oUseTime = this.opStatus['curUseTime'];
    this.curCompeteWin = false;
    if (mRightNum > oRightNum) {
        this.myStatus['score']++;
        this.curCompeteWin = true;
    } else if (mRightNum < oRightNum) {
        this.opStatus['score']++;
    } else {
        if (mCurTime < oUseTime) {
            this.myStatus['score']++;
            this.curCompeteWin = true;
        } else if (mCurTime > oUseTime) {
            this.opStatus['score']++;
        } else {//平局,应该不太可能吧
            this.myStatus['score']++;
            this.opStatus['score']++;
        }
    }
    fruitsCtl.setScore(this.myStatus['score'], this.opStatus['score'], this.curCompeteWin);
};
competition.prototype.setStatus = function(status, noCheck) {
    this.myStatus.status = status;
    this.sendData({'status': status});
    !noCheck && this.checkStatus();
};
//TODO
competition.prototype.reset = function(isInit) {
    this.myStatus = null;
    this.opStatus = null;
    isInit && (this.compFinished = false);
};
//对手连接成功
competition.prototype.getOppo = function(data) {
    if(this.isMaster) {//主机发题
        this.sendData({
            status: 'waiting',
            tasks: this.taskHashs
        });
    }
};
competition.prototype.leave= function() {
    if(!this.compFinished) {
        this.setStatus('leave', true);
    }
};
competition.prototype.sendData = function(data) {
    var dataObj = {
        type: 'message',
        data: data
    };
    this.conn.send(dataObj);
};
competition.prototype.receiveData = function(data) {
    if(!this.isMaster && data.tasks) {
        this.taskHashs = data.tasks;
        _log(this.taskHashs);
        this.sendData({
            status: 'waiting'
        });
    }
    this.opStatus.status = data.status;
    this.handleOpStatus(data);
    this.checkStatus();
}

//滑块控制
var dragCtrl = {
    catchDis: 50,//距离盘子多少被捕获
    dragDropIndex: null,
    dragDropIndexCache : [],
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
        if(null !== this.dragDropIndex && this.dragDropIndexCache.indexOf(this.dragDropIndex) < 0) {
            this.setDragPos(fruitsCtl.originPos[0], fruitsCtl.originPos[1], true);
            fruitsCtl.checkSeq(this.dragingDom, this.dragDropIndex);
            $(this.dragingDom).addClass('droped');
            this.dragDropIndexCache.push(this.dragDropIndex);
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
    },
    restartGame: function() {
        this.dragDropIndexCache = [];
    }
};
dragCtrl.init();

})(window, document);

