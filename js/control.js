(function (window, document) {
    var matches = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)/);
    var token = matches && matches.length >= 2 ? matches[1] : null;
    function _log(s){
      if(token)
          return;
      $('body').prepend(s);
      $('body').prepend("<br>");
    }

    require.config({
        paths: {
            'muses': 'http://ecma.bdimg.com/lego-mat/muses'
        }
    });
    function makeQR(token) {
        require(['muses/tool'], function(tool) {
            var QRCode = tool.QRCode;
            $("body").append($('<div id="qr"></div>'));
            var qrcode = new QRCode('qr', {
                text: "http://dev046.baidu.com:8092/test.html?muses_scepter=" + token,
                //text: "http://192.168.10.102:8001/test.html?muses_scepter=" + token,
                width: 160,
                height: 160,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.L
            });
        });
    }

    // 加载Connect模块
    require(['muses/connect'], function(Connect) {
        // 创建一个连接实例
        window.connect = new Connect();

        if (token) {
            _log("from token:" + token + "<br>");
            connectToken(token, true);
        } else {
            makeConnect();
        }
        function makeConnect() {
            connect.createToken()
                .then(function(token) {
                    makeQR(token);
                    connectToken(token, false);
                })
        }
        function connectToken(token, oriToken) {
          connect.connectWith(token)
              .then(function() {
                  _log('[INFO] 连接成功 token: ' + token);
              })
              .then(function() {
                  // 发送第一条消息
                  connect.send('Game Start!')
                      .fail(function(err) {
                          _log('[ERROR] 游戏启动失败' + (err ? ', ' + err : ''));
                      });

                  // 接收来自房间的消息
                  connect.onMessage = function(actions) {
                      if(!oriToken) {
                        if('reset' == actions) {
                            dragCtrl.resetPos();
                        }
                        if(actions instanceof Array) {
                            dragCtrl.setDragPos(actions[0], actions[1]);
                        }
                        if('fire' == actions) {
                            gunCtrl.fire();
                        }
                        if("number" == typeof actions) {
                            gunCtrl.curAngle = actions;
                            gunCtrl.doRotate();
                        }
                      }
                  };
              })
              .fail(function(err) {
                  _log('[ERROR] 连接游戏失败' + (err ? '，' + err : ''));
              });
        }
    });

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
        }
    };

    var container = util.getEl("container");
    var hammertime = new Hammer(container, { drag_max_touches: 0 });
    hammertime.on("touch", function(ev) {
        dragCtrl.catchEvt(ev, true);
        var target = ev.target || window.event.srcElement;

        if(target.className.indexOf("fire") < 0) {
            return;
        }
        gunCtrl.fire();
        connect.send('fire');
        console.log('biang biang biang!');
    });
    hammertime.on("drag", function(ev) {
        dragCtrl.catchEvt(ev);
    });
    hammertime.on("touchend dragend", function(ev) {
         var touches = ev.gesture.touches;

         ev.gesture.preventDefault();

         for(var t = 0, len = touches.length; t < len; t++) {
             target = touches[t].target;
             if(target.className.indexOf("drag") < 0) {
                 return;
             }
            dragCtrl.resetPos();
            connect.send('reset');
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
            this.positionListener = options['positionListener'] || function() {
                var moLeft = this.moLeft;
                var moTop = this.moTop;
                if(moLeft >= 0) {
                    var multi = Math.floor((moLeft + 4) / 8);
                    gunCtrl.rotateLeft(multi);
                    console.log(multi);
                } else {
                    var multi = Math.floor((Math.abs(moLeft) + 5) / 10);
                    gunCtrl.rotateRight(multi);
                    console.log('-' + multi);
                }
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

            this.moLeft = moLeft;
            this.moTop = moTop;
            this.setDragPos(tarLeft, tarTop);
            connect.send([tarLeft, tarTop]);
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
                var proxyX = touchEvt.pageX;
                var proxyY = touchEvt.pageY;
                if(isTouch) {
                    this.initTouchX = proxyX;
                    this.initTouchY = proxyY;
                    this.holding = true;
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

    var gunCtrl = {
        init: function(options) {
            this.gun = util.getEl('gun');
            this.initBullet();
            options = options || {};
            this.curAngle = options['initAngle'] || 0;
            this.minAngle = options['minAngle'] || -60;
            this.maxAngle = options['maxAngle'] || 60;
            this.stepAngle = options['stepAngle'] || 3;
        },
        rotateLeft: function(multi) {
            var toAngle = this.curAngle - this.stepAngle * multi;
            this.curAngle = (toAngle < this.minAngle) ? this.minAngle : toAngle;
            connect.send(this.curAngle);
            this.doRotate();
        },
        rotateRight: function(multi) {
            var toAngle = this.curAngle + this.stepAngle * multi;
            this.curAngle = (toAngle > this.maxAngle) ? this.maxAngle : toAngle;
            connect.send(this.curAngle);
            this.doRotate();
        },
        doRotate: function() {
            this.gun['style'][transformAttr] = "rotate(" + this.curAngle + "deg)";
        },
        initBullet: function() {
            this.bullet = document.createElement('div');
            this.bullet.className = 'gun-bullet';
            this.gun.appendChild(this.bullet);
        },
        fire: function() {
            var me = this;
            me.resetBullet();
            setTimeout(function() {
                me.bullet['style'][transitionAttr] = "bottom 1.5s";
                me.bullet['style']['bottom'] = "500px";
            }, 0);
            me.fireInter = setTimeout(function() {
                me.resetBullet();
            }, 1500);
        },
        resetBullet: function() {
            clearTimeout(this.fireInter);
            this.bullet['style'][transitionAttr] = "bottom 0s";
            this.bullet['style']['bottom'] = "18px";
        }
    };

    dragCtrl.init();
    gunCtrl.init();
})(window, document);
