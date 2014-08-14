/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/


/*
 * path:    mobile.js
 * desc:    善存双屏互动移动端实现代码
 * author:  DestinyXie(xiebin01@baidu.com)
 * version: $Revision$
 * date:    $Date: 2014/07/05 15:03:04$
 */

(function(win, doc) {
  /**
   * 浏览器侦测，用于生成css3相关样式的前缀
   */
  var dummyStyle = doc.createElement('div').style;
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

  /**
   * 加上前缀，生成浏览器对应的css3样式
   * @param {string} style 样式前缀
   */
  function prefix(style) {
    if (vender === '') return style;

    style = style.charAt(0).toUpperCase() + style.substr(1);
    return vender + style;
  }

  /**
   * 动画使用RequestAnimationFrame
   */
  var nextFrame = (function() {
    return win.requestAnimationFrame ||
      win[vender + 'RequestAnimationFrame'] ||
      function(callback) {
        return setTimeout(callback, 1000 / 60);
      };
  })();

  /**
   * css3相关样式的前缀名
   */
  var cssPrefix = vender ? '-' + vender.toLowerCase() + '-' : '';
  var transformAttr = prefix('transform');
  var transitionProperty = prefix('transitionProperty');
  var transitionDuration = prefix('transitionDuration');
  var transitionDelay = prefix('transitionDelay');
  var hasTransition = false;
  if (transitionProperty in dummyStyle) {
    hasTransition = true;
  }

  /**
   * 工具方法集
   */
  var utils = {};

  /**
   * cookie操作
   * @param {string} name cookie名
   * @param {string} value 要设置的cookie值
   * @param {number} expiredays 过期时间，单位：天
   * @return {string|boolean} 取得的cookie值 设置cookie时为false
   */
  utils.cookie = function(name, value, expiredays) {
    var dc = doc.cookie;
    var cs;
    var ce;
    if (null === value || "" === value) {
      var exDate = new Date();
      var cv = this.cookie(name);
      exDate.setTime(Date.now() - 1);
      if (cv) {
        doc.cookie = name + "=" + escape(cv) + ";expires=" + exDate.toGMTString();
      }
      return false;
    }
    if (arguments.length > 1) {
      var exDate = new Date();
      var days = expiredays || 3650;
      exDate.setTime(Date.now() + days * 24 * 60 * 60 * 1000);
      doc.cookie = name + "=" + escape(value) + ";expires=" + exDate.toGMTString();
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
  };

  /**
   * 计算直角边
   *
   * @param {number} long 长
   * @param {number} width 宽
   */
  utils.calculPy: function(long, width) {
    return Math.sqrt(Math.pow(long, 2) + Math.pow(width, 2));
  };

  /**
   * 判断对象是否存在
   * @param {string} varName 对象名
   * @param {string} context 对象所在命名空间
   * @param {Function} callback 对象存在时需要执行的函数
   */
  utils.waitVariableExists: function(varName, context, callback) {
    var timer = null;

    function check() {
      if (context[varName]) {
        timer && clearTimeout(timer);
        callback(context[varName]);
      } else {
        timer = setTimeout(check, 200);
      }
    }
    check();
  };


  /**
   * @type {Object} gameCenter相关变量的命名空间
   */
  var context = {};
  context.gameCenter = null;

  /**
   * 加载Connect模块用于生成websocket连接
   */
  require.config({
    paths: {
      'muses': 'http://ecma.bdimg.com/lego-mat/muses'
    }
  });
  require(['muses/connect'], function(Connect) {
    /**
     * 游戏中心相关操作
     */
    var gameCenter = new GameCenter({
      MusesConnect: Connect,
      host: 'http://114.215.181.63:8860'
    });
    context.gameCenter = gameCenter;

    /**
     * 监听进入比赛
     */
    gameCenter.addListener(
      GameCenter.Events.ROOM_ENTERED,
      function(conn) {
        var isMaster = !gameCenter.getRoomData().result.full;
        isMaster && ANIM.genStarBlink('blink', 0, 300, 225);
        //生成比赛状态管理对象
        pageCtl.comp = new Competition({
          conn: conn,
          isMaster: isMaster
        });
      }
    );

    /**
     * 获得对手数据
     */
    gameCenter.addListener(
      GameCenter.Events.PLAYER_MESSAGE_RECEIVED,
      function(data) {
        pageCtl.comp && pageCtl.comp.receiveData(data);
      }
    );
    var oppoExist = false;

    /**
     * 监听对手进入比赛
     */
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

        if (oppoPlayer.isAI) {
          CMS.send('play_with_ai');
        } else {
          CMS.send('play_with_player');
        }
      }
    );
  });

  /**
   * 页面操作对象
   */
  var pageCtl = {
    /**
     * 最长等待对手时间，超过使用AI
     * @type {number}
     */
    maxWait: 10000,

    /**
     * 比赛状态管理对象
     */
    comp: null,

    /**
     * 预加载的图片地址
     * @type {Array}
     */
    preImages: ['http://bs.baidu.com/adtest/centrum140528bg.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit1.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit2.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit3.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit4.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/fruit5.png',
      'http://bs.baidu.com/adtest/hks140617dish.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/btn_ok.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/btn_rule.png', 'http://bs.baidu.com/public01/2014-06/hackthon/images/rule_bg.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/m_bg.jpg', 'http://bs.baidu.com/public01/2014-06/hackthon/images/match_board.png',
      'http://bs.baidu.com/public01/2014-06/hackthon/images/grid_bg.png',
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

    /**
     * 页面初始化
     */
    init: function() {
      // 存储用到的dom对象
      this.body = $('body');
      this.ctlDom = $('#controller');
      this.frame1 = $('#frame1');
      this.frame2 = $('#frame2');
      this.oppoNameDom = $('.oppoName');
      this.nameDom = $('#name');
      this.startBtn = $('#startGame');
      //预加载图片
      $.imgpreload(this.preImages, {
        all: function() {
          pageCtl.imageLoaded = true;
          pageCtl.start();

        }
      });
      this.detectViewport();
      $('.showHelp').click(function() {
        pageCtl.showHelp();
      });

      $('#replay').click(function(e) {
        CMS.send('game_replay');

        win.location.reload();
        e.preventDefault();
        return false;
      });

      /**
       * 注册页面卸载时执行函数
       */
      win.onunload = function() {
        pageCtl.comp && pageCtl.comp.leave();
      };
    },

    /**
     * 显示帮助信息
     */
    showHelp: function() {
      if ($('#gameHelp').length <= 0) {
        this.ctlDom.append('<div id="gameHelp">比赛规则<span class="knowHelp">我知道了</span></div>');
        $('.knowHelp').click(function() {
          if ($('#gameHelp').length > 0) {
            $('#gameHelp').remove();
          }
        });
      }
    },

    /**
     * 检测页面尺寸
     */
    detectViewport: function() {
      var vHeight = Math.max(this.body.height(), this.body.width());
      var vWidth = Math.min(this.body.height(), this.body.width());
      if (vHeight <= 380) {
        this.body.addClass('lowHeight');
      }
      this.vHeight = vHeight;
      this.vWidth = vWidth;
    },

    /**
     * 页面初始化完成
     */
    start: function() {
      if (!pageCtl.imageLoaded) {
        setTimeout(function() {
          pageCtl.start();
        }, 1000);
        return;
      }
      this.body.removeClass('loading');
      var cookieName = utils.cookie('player');
      if (cookieName) {
        this.nameDom.val(cookieName);
      } else {
        this.showHelp();
      }
      this.body.addClass('enteringName');
      this.frame1.show();
      this.nameDom.focus(function() {
        pageCtl.body.addClass('nameFocused');
      }).blur(function() {
        pageCtl.body.removeClass('nameFocused');
      }).keypress(function(evt) {
        if (13 === evt.keyCode) {
          pageCtl.body.removeClass('nameFocused');
          pageCtl.fireStart();
        } else {
          pageCtl.nameDom.parent().find('label').removeClass('labelErr');
        }
      });
      this.startBtn.click(function() {
        pageCtl.fireStart();
      });
    },

    /**
     * 开始游戏
     */
    fireStart: function() {
      //conn.send('msg', 'start');
      this.userName = this.nameDom.val();
      if ('' == this.userName) {
        this.nameDom.focus();
        this.nameDom.parent().find('label').addClass('labelErr');
        return;
      }
      CMS.send('game_start');
      CMS.send('game_start_with', this.userName);

      utils.cookie('player', this.userName);
      this.nameDom.blur();
      this.closeFrame1();
      $('.myName').html(this.userName);
      // 在用户输入名称之后启动GameCenter
      var me = this;
      utils.waitVariableExists('gameCenter', context, function() {
        context.gameCenter.start(
          GameCenter.ClientMode.PLAYER, {
            userName: me.userName
          }
        );
        me.findingOppo();
      });
    },

    /**
     * 页面处于搜寻对手状态下
     */
    findingOppo: function() {
      this.frame2.show();
      fruitsCtl.scoreSpan.text('搜寻对手中');
      this.isFinding = true;
      this.findingAnimation();
    },

    /**
     * 搜寻对手动效果，未找到对手时开启AI
     */
    findingAnimation: function() {
      var dotNum = 3;
      var me = this;
      me.startFindingTime = new Date().getTime();

      function _animate() {
        if (!me.isFinding) {
          return;
        }
        dotNum = (dotNum + 1) % 4;
        var dotStr = '';
        for (var i = dotNum; i > 0; i--) {
          dotStr += '.';
        }
        fruitsCtl.scoreSpan.text(dotStr + '搜寻对手中' + dotStr);
        if (new Date().getTime() - me.startFindingTime > me.maxWait) {
          // 创建AI
          utils.waitVariableExists('comp', me, function() {
            var playerRecord = utils.cookie('player_record');
            if (playerRecord) {
              playerRecord = JSON.parse(playerRecord);
            }
            var ai = new GameCenter.AI(
              playerRecord, {
                isMaster: !me.comp.isMaster,
                competition: Competition
              }
            );
            ai.start();
            // AI启动之后，不再对除了AI以外的玩家做应答
            context.gameCenter.keepSilent();
          });
        } else {
          setTimeout(_animate, 800);
        }
      }
      _animate();
    },

    /**
     * 得到一个比赛对手，比赛开始
     * @param {string} oppoName 对手的名字
     */
    getOppo: function(oppoName) {
      this.isFinding = false;
      fruitsCtl.scoreSpan.text('');
      this.oppoNameDom.text(oppoName);
      this.comp && this.comp.getOppo();
      this.frame2.removeClass('waitingOppo');
    },

    /**
     * 比赛对手离开
     */
    oppoLeave: function(compFinished) {
      if (!compFinished) {
        this.oppoNameDom.text('已经离开');
        fruitsCtl.oppoTime.text('').parent().removeClass('hasTime');
      }
    },

    /**
     * 比赛输了
     */
    fail: function() {
      $('#frameSucceed').addClass('showFail').show();
    },

    /**
     * 比赛赢了
     */
    succeed: function(score) {
      $('#frameSucceed').addClass('show').show();
      var ratio = this.vWidth / 320;
      $('#frameSucceed .retry').css({
        'top': ratio * 300,
        'margin-left': -80 * ratio,
        'width': ratio * 160,
        'height': ratio * 50
      });
      $('#frameSucceed .share').css({
        'top': ratio * 360,
        'margin-left': -80 * ratio,
        'width': ratio * 160,
        'height': ratio * 50
      });
      ANIM.gen3Stars($('#frameSucceedStars'), score);
    },

    /**
     * 移除第一帧页面
     */
    closeFrame1: function() {
      this.nameDom.remove();
      this.startBtn.remove();
      this.frame1.remove();
      this.nameDom = null;
      this.startBtn = null;
      this.frame1 = null;
      this.body.removeClass('enteringName');
    },

    /**
     * 移除第二帧页面
     */
    closeFrame2: function() {
      this.frame2.remove();
      this.frame2 = null;
    }
  };
  pageCtl.init();


  /**
   * 水果操作对象
   */
  var fruitsCtl = {
    /**
     * 游戏是否开始
     * @type {boolean}
     */
    startGame: false,

    /**
     * 游戏开始倒计时时间
     * @type {number}
     */
    readTime: 3000,

    /**
     * 水果原始位置
     * @type {Array}
     */
    originPos: [
      [0, 0],
      [64, 0],
      [128, 0],
      [192, 0],
      [256, 0]
    ],

    /**
     * 水果移动目的位置
     * @type {Array}
     */
    targetPos: [
      [40, 30],
      [80, 100],
      [120, 20],
      [160, 100],
      [200, 30]
    ],

    /**
     * 显示对手的水果尺寸相对于自己的水果的显示比例
     * @type {Array}
     */
    oppoRatio: [1 / 2, 1 / 2],

    /**
     * 对手水果左偏移大小
     * @type {number}
     */
    oppoOffsetLeft: 0,

    /**
     * 水果间隔
     * @type {number}
     */
    fruitGap: 0,

    /**
     * 水果宽度
     * @type {number}
     */
    fruitWidth: 64,

    /**
     * 对手水果宽度
     * @type {number}
     */
    oppoFruitWidth: 35,

    /**
     * 对手水果容器高度
     * @type {number}
     */
    dishHeight: 80,

    /**
     * 水果控制初始化
     */
    init: function() {
      win.scrollTo(0, 1);
      // 存储一些dom元素
      this.fruitWrap = $('#fruitWrap');
      this.startBtn = $('#frame2 .start');
      this.scoreSpan = $('#scoreLine span');
      this.waitTime = $('#waitTime');
      this.myTime = $('#fruitWrap .useSeconds');
      this.oppoFruitWrap = $('#oppoFruitWrap');
      this.oppoTime = $('#oppoFruitWrap .useSeconds');
      this.oppoReady = $('#oppoFruitWrap .oppoReady');

      this.fruitDoms = this.fruitWrap.find('.fruits');
      this.oppoFruitDoms = this.oppoFruitWrap.find('.oppoFruits');
      this.fruits = [1, 2, 3, 4, 5];
      var me = this;
      this.startBtn.click(function() {
        if (true === me.startGame) {
          return;
        }
        me.reset(true);
        me.startBtn.addClass('disable');
        pageCtl.comp && pageCtl.comp.setStatus('ready');
      });
      this.refreshScore();
      this.initPos();
    },

    /**
     * 初始化各个水果在手机中的位置
     */
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
      this.oppoOffsetTop = 35;
      if (hasTransition) {
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

    /**
     * 游戏倒计时
     * @param {number} 开始游戏时间的毫秒数
     */
    checkWaitTime: function(startTime) {
      var me = this;
      var curTime = new Date().getTime();
      var goTime = curTime - startTime;
      me.waitTime.removeClass('start count1 count2 count3').addClass('count' + Math.round((me.readTime - goTime) / 1000));
      if (goTime >= me.readTime) {
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

    /**
     * 混淆水果的位置
     * @param {boolean} isStart 是否为重新开始游戏时混淆位置
     */
    refreshPos: function(isStart) {
      var me = this;
      if (!isStart) {
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

    /**
     * 设置水果的位置
     * @param {Element} el 水果的dom元素
     * @param {number} index 水果的索引
     * @param {boolean} isStart 是否为开始游戏
     * @param {boolean} isOppo 是否为设置对手水果位置
     * @param {boolean} isRemoteOppo 是否为由对手指令发起的设置对手水果位置
     */
    setFruitPos: function(el, index, isStart, isOppo, isRemoteOppo) {
      if (isStart) {
        if (isOppo && isRemoteOppo) {
          var pos = this.originPos[index];
        } else {
          var elPos = this.fruits.indexOf(index + 1);
          var pos = this.originPos[elPos];
          $(el).removeClass('droped');
        }
      } else {
        var pos = this.targetPos[this.toFruits[index] - 1];
      }
      if (isOppo) {
        pos = [pos[0] * this.oppoRatio[0] + this.oppoOffsetLeft, (isStart ? this.oppoOffsetTop : pos[1] * this.oppoRatio[1] + 60)];
      } else {
        pos = [pos[0], pos[1] + (isStart ? 0 : 10)];
        $(el).data('pos', pos);
      }
      this._setPos(el, pos);
    },

    /**
     * 设置dom元素的位置
     * @param {Element} el dom元素
     * @param {Array} pos dom元素要移动到的位置
     */
    _setPos: function(el, pos) {
      if (hasTransition) {
        el.style[transformAttr] = 'translate3d(' + pos[0] + 'px, ' + pos[1] + 'px, 0)';
      } else {
        $(el).animate({
          left: pos[0],
          top: pos[1]
        });
      }
    },

    /**
     * 判断水果的位置是否正确
     * @param {Element} ele dom元素
     * @param {number} index dom元素索引
     * @param {boolean} isOppo 是否是判断对手的
     */
    checkSeq: function(ele, index, isOppo) {
      if (!this.startGame) {
        return;
      }
      var curDom = $(ele);
      if (curDom.hasClass('fruitRight')) {
        return;
      }
      if (!isOppo && pageCtl.comp) {
        var cn = ele.className;
        var cls = /.*(fruit\d{2}).*/.exec(cn)[1];
        pageCtl.comp.sendData({
          status: 'playing',
          taskRes: [cls, index]
        });
      }
      var oriFruit = this.fruits[index];
      if (curDom.hasClass('fruit0' + oriFruit)) {
        curDom.addClass('fruitRight');
      } else {
        curDom.addClass('fruitErr');
        if (!isOppo) {
          this.checkFail(curDom);
          return;
        }
      }
      if (!isOppo) {
        this.dragRightNum++;
      }

      if (5 == this.dragRightNum && !isOppo) {
        this.checkOK();
      }
    },

    /**
     * 水果的位置移动错误
     */
    checkFail: function() {
      this.gameRefreshed = false;
      this.setSeconds();
    },

    /**
     * 水果的位置移动正确
     */
    checkOK: function() {
      this.gameRefreshed = false;
      this.setSeconds(true);
    },

    /**
     * 设置比分
     * @param {number} myScore 当前玩家的分数
     * @param {number} opScore 对手的分数
     */
    setScore: function(myScore, opScore) {
      this.scoreSpan.text(opScore + " : " + myScore);
    },

    /**
     * 重置比分
     */
    refreshScore: function() {
      this.scoreSpan.text('观察3秒钟，将水果拖至初始的位置');
    },

    /**
     * 设置比赛用时
     * @param {boolean} isFinish 是否比赛结束
     */
    setSeconds: function(isFinish) {
      var now = new Date().getTime();
      deltaTime = (now - this.gameStartTime) / 1000;
      this.curUseTime = deltaTime;
      if (pageCtl.comp) {
        pageCtl.comp.sendData({
          status: 'finish',
          rightNum: this.dragRightNum,
          useTime: deltaTime
        });
        pageCtl.comp.myStatus.status = 'finish';
        pageCtl.comp.checkStatus();
      }
      this.myTime.text(deltaTime + '秒').parent().addClass('hasTime');
    },

    /**
     * 设置在等待对手比赛
     */
    showWait: function() {
      if (this.startGame) {
        return;
      }
      this.oppoReady.text('Wait');
    },

    /**
     * 设置对手已经准备好比赛
     */
    setOppoReady: function() {
      if (this.startGame) {
        return;
      }
      this.oppoReady.text('Ready');
    },

    /**
     * 重置对手比赛状态
     */
    hideOppoReady: function() {
      this.oppoReady.text('').removeClass('finish');
    },

    /**
     * 对手比赛完毕
     * @param {number} time 比赛用时
     * @param {number} rightNum 正确的数目
     */
    setOppoFinish: function(time, rightNum) {
      this.oppoReady.text('Finish').addClass('finish');
      this.oppoTime.text(time + '秒').parent().addClass('hasTime');
      if (pageCtl.comp && 'playing' == pageCtl.comp.myStatus.status) {
        if (5 === rightNum) {
          var now = new Date().getTime();
          if (now - this.gameStartTime > rightNum) {
            this.gameRefreshed = false;
            this.setSeconds();
          }
        }
      }
    },

    /**
     * 对手比赛完毕
     * @param {number} time 比赛用时
     * @param {number} rightNum 正确的数目
     */
    reset: function() {
      this.startGame = false;
      this.gameRefreshed = false;
      pageCtl.frame2.addClass('fruitsMask');
      this.fruitDoms.removeClass('fruitRight').removeClass('fruitErr');
      this.oppoFruitDoms.removeClass('fruitRight').removeClass('fruitErr');
      this.startBtn.removeClass('disable');
    },

    /**
     * 开始猜题
     * @param {curFruits} curFruits 当前水果顺序
     * @param {tarFruits} tarFruits 水果重新排序的顺序
     */
    startTask: function(curFruits, tarFruits) {
      this.fruits = curFruits;
      this.toFruits = tarFruits;
      this.startGame = true;
      this.refreshPos(true);
      var startTime = new Date().getTime();
      this.waitTime.show().addClass('count' + Math.round(this.readTime / 1000));
      this.myTime.text('').parent().removeClass('hasTime');
      this.oppoTime.text('').parent().removeClass('hasTime');
      this.hideOppoReady();
      this.checkWaitTime(startTime);
      dragCtrl.restartGame();
    }
  };
  fruitsCtl.init();


  /**
   * 比赛类
   * @constructor
   * @param {Object} option 比赛选项
   * @param {boolean} option.isMaster 是否是主机
   * @param {conn} option.conn 游戏中心生成的连接对象
   */
  var Competition = function(option) {
    this.reset(true);
    this.isMaster = option['isMaster'];
    this.conn = option['conn'];
    this.init();
  };

  /**
   * 比赛初始化
   */
  Competition.prototype.init = function() {
    this.AIOppo = false;
    this.competeTimes = 3;
    this.curCompeteTime = 0;
    this.curCompeteWin = false;
    this.taskArr = [1, 2, 3, 4, 5];
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
    if (this.isMaster) { //主机发题
      this._createTasks();
    }
  };

  /**
   * 创建比赛题目集合，随机生成水果顺序
   * @private
   */
  Competition.prototype._createTasks = function() {
    var taskNum = this.competeTimes;
    for (var i = 0; i < taskNum * 2; i++) {
      this.taskHashs.push(this._createSeq(this.taskArr));
    }
  };

  /**
   * 创建比赛题目，随机生成水果顺序
   * @private
   * @param {Array} arr 水果顺序原始数组
   * @return {Array} 随机打乱后的数组
   */
  Competition.prototype._createSeq = function(arr) {
    var toArr = arr.slice();
    toArr.sort(function() {
      return 0.5 - Math.random();
    });
    return toArr;
  };

  /**
   * 分析对手的状态
   * @private
   * @param {Object} 对手的状态信息
   */
  Competition.prototype._handleOpStatus = function(data) {
    switch (this.opStatus.status) {
      case 'waiting':
        fruitsCtl.showWait();
        break;
      case 'ready':
        fruitsCtl.setOppoReady();
        break;
      case 'playing':
        var opRes = data.taskRes;
        if (opRes) {
          var fruitCls = opRes[0];
          var tarIdx = opRes[1];
          var el = $('#oppoFruitWrap .' + fruitCls);
          fruitsCtl.setFruitPos(el[0], tarIdx, true, true, true);
          fruitsCtl.checkSeq(el[0], tarIdx, true);
        }
        break;
      case 'finish':
        var opRightNum = data.rightNum;
        var opUseTime = data.useTime;
        this.opStatus['curRightNum'] = opRightNum;
        this.opStatus['curUseTime'] = opUseTime;
        fruitsCtl.setOppoFinish(opUseTime, opRightNum);
        break;
      case 'leave':
        pageCtl.oppoLeave(this.compFinished);
        break;
    }
  };

  /**
   * 分析比赛双方的状态，做相应的处理
   */
  Competition.prototype.checkStatus = function() {
    var ms = this.myStatus['status'];
    var os = this.opStatus['status'];
    switch (this.status) {
      case 'waiting':
        if ('ready' === ms && 'ready' === os) {
          this.status = 'playing';
          this.setStatus('playing');
          this.startTask();
        }
        break;
      case 'playing':
        if ('finish' === ms && 'finish' === os) {
          this.status = 'waiting';
          this.setStatus('waiting');
          this.calCulScore();
          this.finishTask();
        }
        break;
    }
  };

  /**
   * 一局比赛可以开始了
   */
  Competition.prototype.startTask = function() {
    var curFruits = this.taskHashs[this.curCompeteTime];
    var tarFruits = this.taskHashs[this.curCompeteTime + this.competeTimes];
    fruitsCtl.startTask(curFruits, tarFruits);
    this.curCompeteTime++;
  };

  /**
   * 一局比赛结束了
   */
  Competition.prototype.finishTask = function() {
    var me = this;
    if (this.curCompeteTime < this.competeTimes) {
      fruitsCtl.reset();
    } else {
      CMS.send('game_finish');
      setTimeout(function() {
        me.finishComp();
      }, 3000);
    }
  };

  /**
   * 整场比赛结束
   */
  Competition.prototype.finishComp = function() {
    if (this.myStatus.score > this.opStatus.score) {
      pageCtl.succeed(this.myStatus.score);
    } else if (this.myStatus.score < this.opStatus.score) {
      pageCtl.fail();
    } else {
      pageCtl.succeed(this.myStatus.score);
    }
    this.compFinished = true;
    this.reset();
  };

  /**
   * 计算比赛分数
   */
  Competition.prototype.calCulScore = function() {
    var mRightNum = fruitsCtl.dragRightNum;
    var mCurTime = fruitsCtl.curUseTime;

    // 更新玩家战绩
    var playerRecord = utils.cookie('player_record');
    if (playerRecord) {
      playerRecord = JSON.parse(playerRecord);
    }
    var brandNewRecord = GameCenter.mergePlayerRecord(playerRecord, mRightNum, mCurTime);
    utils.cookie('player_record', JSON.stringify(brandNewRecord));

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
      } else { //平局,应该不太可能吧
        this.myStatus['score']++;
        this.opStatus['score']++;
      }
    }
    fruitsCtl.setScore(this.myStatus['score'], this.opStatus['score'], this.curCompeteWin);
  };

  /**
   * 设置我的游戏状态
   * @param {string} status 我的游戏状态
   * @param {boolean} noCheck 是否仅发送我的状态 而不用分析比赛双方的状态
   */
  Competition.prototype.setStatus = function(status, noCheck) {
    this.myStatus.status = status;
    this.sendData({
      'status': status
    });
    !noCheck && this.checkStatus();
  };


  /**
   * 重置游戏
   */
  Competition.prototype.reset = function(isInit) {
    this.myStatus = null;
    this.opStatus = null;
    if (isInit) {
      this.compFinished = false
    }
  };

  /**
   * 对手连接成功
   */
  Competition.prototype.getOppo = function() {
    if (this.isMaster) { //主机发题
      this.sendData({
        status: 'waiting',
        tasks: this.taskHashs
      });
    }
  };

  /**
   * 对手离开
   */
  Competition.prototype.leave = function() {
    if (!this.compFinished) {
      this.setStatus('leave', true);
    }
  };

  /**
   * 向对手发送数据
   * @param {Object} data 发送的数据信息
   */
  Competition.prototype.sendData = function(data) {
    var dataObj = {
      type: 'message',
      data: data
    };
    this.conn.send(dataObj);
  };

  /**
   * 接受对手的数据
   * @param {Object} data 对手发送的数据信息
   */
  Competition.prototype.receiveData = function(data) {
    if (!this.isMaster && data.tasks) {
      this.taskHashs = data.tasks;
      this.sendData({
        status: 'waiting'
      });
    }
    this.opStatus.status = data.status;
    this._handleOpStatus(data);
    this.checkStatus();
  };


  /**
   * 滑块操作控制对象
   */
  var dragCtrl = {

    /**
     * 距离盘子多少像素被捕获
     * @type {number}
     */
    catchDis: 32,

    /**
     * 当前控制水果的索引
     * @type {?number}
     */
    dragDropIndex: null,

    /**
     * 控制水果的索引顺序记录
     * @type {Array}
     */
    dragDropIndexCache: [],

    /**
     * 初始化水果控制
     * @param {?Object} opt_options
     */
    init: function(opt_options) {
      this.hammerInited = false;
      this.lastLeft = null;
      this.lastTop = null;

      var options = opt_options || {};
      this.positionEmitInter = options['positionEmitInter'] || 200; //发送位移时间间隔
      //位移监听回调
      this.positionListener = options['positionListener'] || function() {
        var moLeft = this.moLeft;
        var moTop = this.moTop;
        if (!this.lastLeft) {
          this.lastLeft = 0;
        }
        if (!this.lastTop) {
          this.lastTop = 0;
        }
        var deltaLeft = Math.abs(moLeft - this.lastLeft);
        var deltaTop = Math.abs(moTop - this.lastTop);
        if (utils.calculPy(deltaLeft, deltaTop) <= 5) {
          return;
        }
        this.lastLeft = Math.round(moLeft);
        this.lastTop = Math.round(moTop);
        //conn.send('han', [moLeft, 0]);
      };
      this.initHammer();
      var self = this;
    },

    /**
     * 初始化水果对touch事件的响应
     */
    initHammer: function() {
      if (this.hammerInited) {
        return;
      }
      this.hammerInited = true;
      var container = fruitsCtl.fruitWrap[0];
      var hammertime = new Hammer(container, {
        drag_max_touches: 0
      });
      hammertime.on("touch", function(ev) {
        if (fruitsCtl.gameRefreshed && ev.target.className.indexOf("fruits") >= 0 && ev.target.className.indexOf("droped") < 0) {
          dragCtrl.holding = true;
          dragCtrl.catchEvt(ev, true);
        }
      });
      hammertime.on("drag", function(ev) {
        dragCtrl.catchEvt(ev);
      });
      hammertime.on("touchend dragend", function(ev) {
        if (dragCtrl.holding) {
          dragCtrl.resetPos();
        }
      });
    },

    /**
     * 重置水果位置
     */
    resetPos: function() {
      this.holding = false;
      clearTimeout(this.positionEmitter);
      this.dragingDom.style[transitionProperty] = cssPrefix + 'transform';
      if (null !== this.dragDropIndex && this.dragDropIndexCache.indexOf(this.dragDropIndex) < 0) {
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

    /**
     * 水果被拖动
     * @param {number} toLeft 手指x轴位置
     * @param {number} toTop 手指y轴位置
     */
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

    /**
     * 判断水果位是否已经到达背板被捕获的位置，并体系相应的应对
     * @param {number} tarLeft 水果x轴位置
     * @param {number} tarTop 水果y轴位置
     */
    checkDragPos: function(tarLeft, tarTop) {
      var catched = (tarTop > fruitsCtl.originPosTopline - 25 && tarTop < fruitsCtl.originPosTopline + 25);
      if (catched) {
        catched = false;
        for (var i = 0, len = fruitsCtl.originPos.length; i < len; i++) {
          var pos = fruitsCtl.originPos[i];
          var dis = utils.calculPy(tarLeft - pos[0], tarTop - pos[1]);
          if (dis < this.catchDis) {
            this.dragDropIndex = i;
            this.setDragPos(pos[0], pos[1]);
            catched = true;
            break;
          }
        }
      }
      if (!catched) {
        this.dragDropIndex = null;
        this.setDragPos(tarLeft, tarTop);
      }
    },

    /**
     * 设置水果的位置
     * @param {number} tarLeft 水果x轴位置
     * @param {number} tarTop 水果x轴位置
     * @param {boolean} isReset 是否为重置，即不是拖动引起的位置重置
     */
    setDragPos: function(tarLeft, tarTop, isReset) {
      var me = this;
      nextFrame(function() {
        if (me.dragingDom) {
          me.dragingDom.style[transformAttr] = 'translate3D(' + tarLeft + 'px, ' + tarTop + 'px, 0)';
        }
        if (isReset) {
          me.dragingDom = null;
        }
      });
      //fruitsCtl._setPos(this.dragingDom, [tarLeft, tarTop]);
    },

    /**
     * 捕获到touch事件，做相应处理
     * @param {Event} event 事件对象
     * @param {boolean} isTouch 是否是手指刚按下
     */
    catchEvt: function(event, isTouch) {
      if (!this.holding) {
        return;
      }
      var touches = event.gesture.touches;

      event.gesture.preventDefault();

      for (var t = 0, len = touches.length; t < len; t++) {
        var touchEvt = touches[t];
        var target = touchEvt.target;
        if (target.className.indexOf("fruits") < 0) {
          return;
        }
        var proxyX = touchEvt.pageX;
        var proxyY = touchEvt.pageY;
        if (isTouch) {
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

    /**
     * 处理拖动位置时钟，不用响应每次drag后水果位置的变化，
     * 而是在一个合理的时间间隔后做响应，以提升整体的性能。
     */
    tickTack: function() {
      var me = this;
      if (!me.holding) {
        return;
      }
      me.positionEmitter = setTimeout(function() {
        me.positionListener.call(me);
        me.tickTack.call(me);
      }, me.positionEmitInter);
    },

    /**
     * 重置游戏
     */
    restartGame: function() {
      this.dragDropIndexCache = [];
    }
  };
  dragCtrl.init();


  /**
   * 数据统计
   */
  var CMS = new ClickMonkeyService('bdd_sdc_one_hackathon');
  CMS.send('scan_count');
  win.CMS = CMS;

})(window, document);