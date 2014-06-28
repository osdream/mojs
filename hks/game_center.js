/***************************************************************************
 *
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 * $Id$
 *
 **************************************************************************/


/*
 * path:    game_center.js
 * desc:
 * author:  songao(songao@baidu.com)
 * version: $Revision$
 * date:    $Date: 2014/06/19 15:03:04$
 */

/**
 * 游戏服务器连接类
 * @param {Object} options 选项
 *
 * @constructor
 */
function GameCenter(options) {
    /**
     * @type {Object}
     */
    this.options = options;

    /**
     * @type {Function}
     */
    this.MusesConnect = options['MusesConnect'];

    /**
     * @type {string}
     */
    this.host = options['host'] || 'http://osdream.com:8860';

    /**
     * @type {?string}
     */
    this.hostToken = null;

    /**
     * @type {boolean}
     */
    this.started = false;

    /**
     * @type {Object.<string, Function>}
     */
    this.listeners = {};

    /**
     * @type {?Object}
     */
    this.roomData = null;
}

/**
 * 客户端模式
 *
 * @enum {string}
 */
GameCenter.ClientMode = {
    HOST: 'HOST', // 主人，即PC的角色
    PLAYER: 'PLAYER' // 玩家
};

/**
 * 事件类型
 *
 * @enum {string}
 */
GameCenter.Events = {
    HOST_TOKEN_CREATED: 'HOST_TOKEN_CREATED', // PC上的需要关注的事件：新的本地房间token已创建，需要去更新二维码
    HOST_TOKEN_EXPIRED: 'HOST_TOKEN_EXPIRED', // GameCenter 内部事件，不用管
    ROOM_ENTERED: 'ROOM_ENTERED', // 手机事件：自己进入房间了
    OPPONENT_ENTER_ROOM: 'OPPONENT_ENTER_ROOM', // 手机事件：对方进入房间了
    PLAYER_MESSAGE_RECEIVED: 'PLAYER_MESSAGE_RECEIVED' // 收到对方玩家消息
};

/**
 * 生成访问GameCenter服务器的完整地址
 *
 * @param {string} path
 * @return {string}
 */
GameCenter.prototype.getUrl = function(path) {
    return this.host + path + '?callback=?';
};

/**
 * 获取房间信息
 */
GameCenter.prototype.getRoomData = function() {
    return this.roomData;
};

/**
 * 创建本地房间
 *
 * @param {Function} callback
 */
GameCenter.prototype.createLocalRoom = function(callback) {
    var me = this;
    var url = this.getUrl('/room/create');
    $.getJSON(url)
        .done(function(data) {
            if (data['success']) {
                me.roomData = data;
                callback(null, data['result']['token']);
            }
            else {
                callback(new Error('创建本地房间失败'));
            }
        })
        .fail(function() {
            callback(new Error('服务器错误'));
        });
};

/**
 * 启动
 *
 * @param {GameCenter.ClientMode} mode 连入的类型：PC(HOST)还是手机(PLAYER)
 * @param {Object=} data 额外信息，可选
 */
GameCenter.prototype.start = function(mode, data) {
    if (this.started) {
        return;
    }
    this.mode = mode || GameCenter.ClientMode.PLAYER;
    this.started = true;

    if (this.mode == GameCenter.ClientMode.PLAYER) {
        this.playerStart(data);
    }
    else {
        this.hostStart();
    }
};

/**
 * HOST(PC)的启动逻辑
 */
GameCenter.prototype.hostStart = function() {
    var me = this;
    this.createLocalRoom(function(err, token) {
        if (!err) {
            me.connectAsHost(token);
            // EVENT: 本地房间创建成功事件
            me.trigger(GameCenter.Events.HOST_TOKEN_CREATED, token);
        }
        else {
            me.trigger(
                GameCenter.Events.ERROR,
                err
            );
        }
    });
};

/**
 * HOST重启
 */
GameCenter.prototype.hostRestart = function() {
    this.hostStart();
};

/**
 * 获取HOST当前token
 */
GameCenter.prototype.getHostToken = function() {
    return this.hostToken;
};

/**
 * 以HOST身份与muses系统建立互动连接
 *
 * @param {string} token
 */
GameCenter.prototype.connectAsHost = function(token) {
    var me = this;
    me.hostToken = token;
    function connectInternal() {
        var connect = /** @type {Connect} */new me.MusesConnect();
        me.connect = connect;

        connect
            .connectWith(token)
            .then(function() {
                // 接收更新token的事件
                connect.onMessage = function(msg) {
                    if (msg['type'] == 'event'
                        && msg['event'] == GameCenter.Events.HOST_TOKEN_EXPIRED
                    ) {
                        me.hostRestart();
                    }
                };
            })
            .fail(function(err) {
                me.trigger(
                    GameCenter.Events.ERROR,
                    err
                );
            });
    }

    if (this.connect) {
        this.connect
            .disconnect()
            .then(function() {
                connectInternal();
            });
    }
    else {
        connectInternal();
    }
};

/**
 * 玩家启动
 *
 * @param {Object} player 当前玩家信息
 */
GameCenter.prototype.playerStart = function(player) {
    this.player = player;
    var me = this;
    var matches = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)/);
    var token = matches && matches.length >= 2 ? matches[1] : null;
    if (token) {
        this.tryEnterRoom(token, function(err, token, isNeedInformHost) {
            if (!err) {
                me.connectAsPlayer(
                    token,
                    function (connect) {
                        if (isNeedInformHost) {
                            connect.send({
                                type: 'event',
                                event: GameCenter.Events.HOST_TOKEN_EXPIRED
                            });
                        }
                    }
                );
            }
            else {
                me.trigger(
                    GameCenter.Events.ERROR,
                    err
                );
            }
        });
    }
    else {
        this.searchRandomRoom(function(err, token) {
            if (!err) {
                me.connectAsPlayer(token);
            }
            else {
                me.trigger(
                    GameCenter.Events.ERROR,
                    err
                );
            }
        });
    }
};

/**
 * 尝试进入本地房间
 *
 * @param {string} token
 * @param {Function} callback
 */
GameCenter.prototype.tryEnterRoom = function(token, callback) {
    var me = this;
    var url = this.getUrl('/room/enter');
    $.getJSON(url, {token: token})
        .done(function(data) {
            if (data['success']) {
                me.roomData = data;
                var isNeedInformHost = data['result']['entered'] && data['result']['full'];
                callback(null, data['result']['token'], isNeedInformHost);
            }
            else {
                callback(new Error('创建随机房间失败'));
            }
        })
        .fail(function() {
            callback(new Error('服务器错误'));
        });
};

/**
 * 搜寻随机房间
 */
GameCenter.prototype.searchRandomRoom = function(callback) {
    var url = this.getUrl('/room/search');
    var me = this;
    $.getJSON(url)
        .done(function(data) {
            if (data['success']) {
                me.roomData = data;
                callback(null, data['result']['token']);
            }
            else {
                callback(new Error('获取随机房间失败'));
            }
        })
        .fail(function() {
            callback(new Error('服务器错误'));
        });
};

/**
 * 获取当前玩家使用的token
 */
GameCenter.prototype.getPlayToken = function() {
    return this.playToken;
};

/**
 * 以玩家身份与muses系统建立互动连接
 *
 * 会发送echo信息确认对方玩家的存在
 * 以 OPPONENT_ENTER_ROOM 事件对外通知对方玩家已接入
 *
 * @param {string} token
 * @param {Function} afterHandler
 */
GameCenter.prototype.connectAsPlayer = function(token, afterHandler) {
    var me = this;
    me.playToken = token;
    function connectInternal() {
        var connect = /** @type {Connect} */new me.MusesConnect();
        me.connect = connect;

        connect
            .connectWith(token)
            .then(function() {
                // 回调
                afterHandler && afterHandler(connect);

                // EVENT: 已进入房间，但还不确定是否有对手在
                me.trigger(
                    GameCenter.Events.ROOM_ENTERED,
                    connect
                );

                var sendSeqs = [];
                var timer = null;
                connect.onMessage = function(msg) {
                    if (msg['type'] == 'echo') {
                        // 应答，序列号加1作为响应
                        connect.send({
                            'type': 'ack',
                            'seq': msg['seq'] + 1,
                            'player': me.player // 将自己的信息发送给对方
                        });
                    }
                    else if (msg['type'] == 'ack') {
                        var ackSeq = msg['seq'];
                        for (var i = 0; i < sendSeqs.length; i++) {
                            if (ackSeq == sendSeqs[i] + 1) {
                                clearTimeout(timer);
                                // EVENT: 确认对手进入房间
                                me.trigger(
                                    GameCenter.Events.OPPONENT_ENTER_ROOM,
                                    connect,
                                    msg['player'] // 收到对手信息
                                );
                                break;
                            }
                        }
                    }
                    else if (msg['type'] == 'message') {
                        me.trigger(GameCenter.Events.PLAYER_MESSAGE_RECEIVED, msg['data']);
                    }
                };
                /**
                 * 发起echo消息，探测房间里有没有人
                 */
                function echo() {
                    var seq = parseInt(Math.random() * 9007199254740991);
                    sendSeqs.push(seq);
                    // 删掉一些seq，免得始终没人回应，队列太长了
                    if (sendSeqs.length > 100) {
                        sendSeqs.shift();
                    }
                    connect.send({
                        'type': 'echo',
                        'seq': seq
                    });
                    timer = setTimeout(echo, 500);
                }
                echo();
            })
            .fail(function(err) {
                me.trigger(
                    GameCenter.Events.ERROR,
                    err
                );
            });
    }

    if (this.connect) {
        this.connect
            .disconnect()
            .then(function() {
                connectInternal();
            });
    }
    else {
        connectInternal();
    }
};

/**
 * 绑定事件
 */
GameCenter.prototype.addListener = function(eventName, handler) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    this.listeners[eventName].push(handler);
};

/**
 * 触发事件
 */
GameCenter.prototype.trigger = function(eventName, var_args) {
    var args = [].slice.call(arguments, 1);
    var handlers = this.listeners[eventName] || [];
    for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, args);
    }
};

/**
 * AI 类
 * @constructor
 */
GameCenter.AI = function(playerRecord, options) {
    /**
     * 玩家的历史记录
     * @type {Object}
     */
    this.playerRecord = playerRecord || {
        'averageCorrect': 4.5, // 平均正确数目
        'averageUnitCostTime': 1000, // 平均耗费时长
        'playTimes': 0 // 已玩局数
    };

    /**
     * AI是否是主玩家
     * @type {boolean}
     */
    this.isMaster = options.isMaster;

    /**
     * 比赛类
     */
    this.Competition = options.competition;

    /**
     * 向上难度系数
     * @type {number}
     */
    this.hardLevelRatio = 1.25;

    /**
     * 向下难度系数
     */
    this.easyLevelRatio = 0.95;

    /**
     * 正常难度系数
     */
    this.normalLevelRatio = 1.1;

    /**
     * 难度系数
     */
    this.levelRatio = this.normalLevelRatio;

    /**
     * 比赛对象
     */
    this.competition = null;

    /**
     * 对方玩家
     */
    this.oppoPlayer = null;

    /**
     * 游戏服务器连接对象
     */
    this.gameCenter = null;

    /**
     * muses连接对象
     */
    this.connect = null;

    /**
     * 当前游戏局数
     */
    this.playedGameCount = 0;

    /**
     * 总局数
     */
    this.totalGameCount = 3;

    /**
     * 当前局正确数目
     */
    this.currentRightCount = 0;

    /**
     * 游戏全局状态
     */
    this.globalStatus = 'waiting';

    /**
     * AI状态
     */
    this.selfGame = {
        status: 'waiting',
        correctCount: 0,
        costTime: 0,
        score: 0
    };

    /**
     * 对手状态
     */
    this.oppoGame = {
        status: 'waiting',
        correctCount: 0,
        costTime: 0,
        score: 0
    };
}

/**
 * 获取玩家历史战绩
 */
GameCenter.AI.prototype.getPlayerRecord = function() {
    return this.playerRecord;
};

/**
 * 合并玩家历史战绩
 */
GameCenter.AI.prototype.mergePlayerRecord = function(correctCount, costTime) {
    var movedFruitCount = correctCount + (correctCount < 5 ? 1 : 0);
    var unitCostTime = costTime * 1000 / movedFruitCount;
    console.log('unit: ' + unitCostTime);

    this.playerRecord['averageCorrect'] = (Math.max(correctCount, 4.5) + this.playerRecord['averageCorrect']) / 2;
    this.playerRecord['averageUnitCostTime'] = (Math.min(unitCostTime, 2000) + this.playerRecord['averageUnitCostTime']) / 2;
    this.playerRecord['playTimes']++;
    console.log(JSON.stringify(this.playerRecord, null, 4));
};

/**
 * AI启动
 */
GameCenter.AI.prototype.start = function() {
    var that = this;
    this.createGameCenter(function(gameCenter) {
        gameCenter.start(
            GameCenter.ClientMode.PLAYER,
            {
                userName: that.getRandomName()
            }
        );
    });
};

/**
 * 创建 GameCenter
 */
GameCenter.AI.prototype.createGameCenter = function(callback) {
    var that = this;
    require.config({
        paths: {
            'muses': 'http://ecma.bdimg.com/lego-mat/muses'
        }
    });

    require(['muses/connect'], function(Connect) {
        var gameCenter = new GameCenter({
            MusesConnect: Connect,
            host: 'http://114.215.181.63:8860'
        });
        that.gameCenter = gameCenter;

        gameCenter.addListener(
            GameCenter.Events.ROOM_ENTERED,
            function(conn) {
                that.connect = conn;
                that.competition = new that.Competition({
                    conn: conn,
                    isMaster: that.isMaster
                });
            }
        );
        gameCenter.addListener(
            GameCenter.Events.PLAYER_MESSAGE_RECEIVED,
            function(data) {
                // 接受到新消息
                that.processMessage(data);
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
                oppoExist = true;

                // 收到对方玩家信息
                that.oppoPlayer = oppoPlayer;

                // 有对手了，可以开始游戏了
                that.startGame();
            }
        );
        callback(gameCenter);
    });
};

/**
 * 获取AI玩家名称
 */
GameCenter.AI.prototype.getRandomName = function() {
    var names = ['小新', '苏牙', '李刚', '小A', '小B', 'Agenla', 'Cloe'];
    return names[parseInt(Math.random() * names.length)];
};

/**
 * 开始游戏
 */
GameCenter.AI.prototype.startGame = function() {
    if (this.isMaster) {
        this.competition.createTasks();
        this.taskHashs = this.competition.taskHashs;
        this.send({
            status: 'waiting',
            tasks: this.taskHashs
        });
    }
    var that = this;
    setTimeout(
        function() {
            that.setStatus('ready');
            that.checkStatus();
        },
        1000
    );
};

/**
 * 发送数据包
 */
GameCenter.AI.prototype.send = function(data) {
    var package = {
        type: 'message',
        data: data
    };
    this.connect.send(package);
};

/**
 * 处理收到的消息
 */
GameCenter.AI.prototype.processMessage = function(package) {
    // 如果不是主玩家，接收游戏题目
    if (!this.isMaster && package.tasks) {
        this.taskHashs = package.tasks;
        this.send({
            status: 'waiting'
        });
    }
    this.handleOppoData(package);
};

/**
 * 处理对手数据
 */
GameCenter.AI.prototype.handleOppoData = function(data) {
    this.oppoGame.status = data.status;
    switch(data.status) {
        case 'waiting':
            // do nothing
            break;
        case 'ready':
            // do nothing
            break;
        case 'playing':
            // do nothing
            break;
        case 'finish':
            // 记录对手游戏结果
            this.oppoGame.correctCount = data.rightNum;
            this.oppoGame.costTime = data.useTime;
            // 将游戏数据合并到历史，用于训练AI
            this.mergePlayerRecord(
                this.oppoGame.correctCount,
                this.oppoGame.costTime
            );
            break;
        case 'leave':
            // do nothing
            break;
    }

    this.checkStatus();
};

/**
 * 获取当前局盘子里的水果顺序
 */
GameCenter.AI.prototype.getCurrentPlate = function() {
    return this.taskHashs[this.playedGameCount];
};

/**
 * 获取当前局打乱了的水果顺序
 */
GameCenter.AI.prototype.getCurrentShuffle = function() {
    return this.taskHashs[this.playedGameCount + this.totalGameCount];
};

/**
 * 检查双方状态
 */
GameCenter.AI.prototype.checkStatus = function() {
    var selfStatus = this.selfGame.status;
    var oppoStatus = this.oppoGame.status;
    switch (this.globalStatus) {
        case 'waiting':
            if ('ready' == selfStatus
                && 'ready' == oppoStatus
            ) {
                this.globalStatus = 'playing';
                this.setStatus('playing');
                this.startTask();
            }
            break;
        case 'playing':
            if ('finish' == selfStatus
                && 'finish' == oppoStatus
            ) {
                this.globalStatus = 'waiting';
                this.setStatus('waiting');
                this.calcScore();
                this.finishTask();
            }
            break;
    }
};

/**
 * 设置自身状态，并通知对方
 */
GameCenter.AI.prototype.setStatus = function(status) {
    this.selfGame.status = status;
    this.send({
        status: status
    });
};

/**
 * 开始当前局
 */
GameCenter.AI.prototype.startTask = function() {
    var that = this;

    // 过8秒之后模拟用户拖动
    this.waitFor(8000, function() {
        that.startSimulate();
    });
};

/**
 * 结束当前局
 */
GameCenter.AI.prototype.finishTask = function() {
    var that = this;
    if (this.playedGameCount < this.totalGameCount) {
        this.playedGameCount++;
        this.nextGame();
    }
    else {
        this.reset();
    }
};

/**
 * 准备下一局
 */
GameCenter.AI.prototype.nextGame = function() {
    var that = this;
    this.setStatus('waiting');
    this.checkStatus();
    setTimeout(
        function() {
            that.setStatus('ready');
            that.checkStatus();
        },
        3000
    );
};

/**
 * 重置
 */
GameCenter.AI.prototype.reset = function() {
    this.setStatus('waiting');
    this.checkStatus();
};

/**
 * 准确等待函数
 */
GameCenter.AI.prototype.waitFor = function(time, callback) {
    var startTime = new Date().getTime();
    function heartBeat() {
        var currentTime = new Date().getTime();
        if (currentTime - startTime >= time) {
            callback();
        }
        else {
            setTimeout(heartBeat, 200);
        }
    }
    heartBeat();
};

/**
 * 模拟人玩游戏拖动水果的过程
 */
GameCenter.AI.prototype.startSimulate = function() {
    var plate = this.getCurrentPlate();

    var timer = null;
    var that = this;
    var index = 0;
    var correctCount = 0;
    var startTime = new Date().getTime();
    function finish() {
        that.selfGame.status = 'finish';
        that.send({
            'status': 'finish',
            'rightNum': correctCount,
            'useTime': ((new Date().getTime() - startTime) / 1000)
        });
        that.checkStatus();
    }
    function nextMove() {
        var costTime = that.getRandomCostTime();
        var correctRatio = that.getCorrectRatio();
        console.log(costTime);
        console.log(correctRatio);
        timer = setTimeout(
            function() {
                if (Math.random() < correctRatio || index == plate.length - 1) {
                    that.send({
                        'taskRes': ['fruit0' + plate[index], index],
                        'status':'playing'
                    });
                    correctCount++;
                    index++;
                    if (index < plate.length) {
                        nextMove();
                    }
                    else {
                        finish();
                    }
                }
                else {
                    that.send({
                        'taskRes': ['fruit0' + plate[index + 1], index],
                        'status':'playing'
                    });
                    finish();
                }
            },
            costTime
        );
    }
    nextMove();
};

/**
 * 获取AI拖动水果正确率
 */
GameCenter.AI.prototype.getCorrectRatio = function() {
    // 胜率计算方式：在平均胜率基础上乘以一个难度系数 levelRatio
    // 但不能高于1
    return Math.min(this.playerRecord['averageCorrect'] * this.levelRatio / 5, 1);
};

/**
 * 获取随机单步耗费时长
 */
GameCenter.AI.prototype.getRandomCostTime = function() {
    // 每步时长计算方式：在平均单位耗时基础上除以难度系数，并在此基础上正负20%波动
    // 但不能低于600ms...
    return Math.max(
        (this.playerRecord['averageUnitCostTime'] / this.levelRatio) * (9 + Math.random() * 2) / 10,
        600
    );
};

/**
 * 计分
 */
GameCenter.AI.prototype.calcScore = function() {
    var selfCorrectCount = this.selfGame.correctCount;
    var selfCostTime = this.selfGame.costTime;
    var oppoCorrectCount = this.oppoGame.correctCount;
    var oppoCostTime = this.oppoGame.costTime;

    var result;
    if (selfCorrectCount > oppoCorrectCount) {
        result = 'winner';
    }
    else if (selfCorrectCount < oppoCorrectCount) {
        result = 'loser';
    }
    else {
        if (selfCostTime < oppoCostTime) {
            result = 'winner';
        }
        else if (selfCostTime > oppoCostTime) {
            result = 'loser';
        }
        else {
            result = 'tie';
        }
    }

    if (result = 'winner') {
        this.selfGame.score++;
        this.levelRatio = this.easyLevelRatio;
    }
    else if (result == 'loser') {
        this.oppoGame.score++;
        this.levelRatio = this.hardLevelRatio;
    }
    else {
        this.selfGame.score++;
        this.oppoGame.score++;
        this.levelRatio = this.normalLevelRatio;
    }
};














/* vim: set ts=4 sw=4 sts=4 tw=100 : */
