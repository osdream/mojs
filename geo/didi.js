function(window, undefined) {
    var dd = window.dd || {};
    if (!dd || !dd.base) {
        window.dd = dd;
        var b = dd.base || {};
        b.diffPlatform = function(e) {
            var t = navigator.userAgent,
                n = function(e) {
                    "function" == typeof e && e()
                };
            t.match(/(Android)/i) ? n(e.android) : t.match(/(iPhone|iPod|ios|iPad)/i) ? n(e.ios) : t.match(/(Windows phone)/i) ? n(e.wp) : n(e.others)
        }, b.loadJS = function(e, t) {
            var n = document.createElement("script");
            n.type = "text/javascript", n.src = e, document.getElementsByTagName("head")[0].appendChild(n), n.onload = n.onreadystatechange = function() {
                this.readyState && "loaded" != this.readyState && "complete" != this.readyState || "function" == typeof t && t()
            }
        }, b.jsonp = function(e, t) {
            var n = document.createElement("script");
            n.type = "text/javascript", n.src = e + "&callback=dd.jsonp." + t, document.getElementsByTagName("head")[0].appendChild(n)
        }, b.touch = function(e, t) {
            e && "function" == typeof t && (e.addEventListener("touchstart", function(e) {
                e.target.focus(), e.stopPropagation()
            }, !1), e.addEventListener("touchmove", function(e) {
                e.target.setAttribute("moved", "true")
            }, !1), e.addEventListener("touchend", function(e) {
                e.target.blur(), "true" !== e.target.getAttribute("moved") ? t(e) : e.target.setAttribute("moved", "false")
            }, !1))
        }, b.getElesByKls = function(e, t) {
            if (e = e ? e : document.body, e.getElementsByClassName) return e.getElementsByClassName(t);
            for (var n = [], i = e.getElementsByTagName("*"), o = 0, a = i.length; a > o; o++) i[o].getAttribute && -1 !== i[o].getAttribute("className").indexOf(t) && n.push(i[o]);
            return n
        }, b.getQueryStr = function() {
            var e, t, n, i = {},
                o = location.search.length ? location.search.substring(1) : "";
            if (!o) return i;
            if (-1 === o.indexOf("&") && o.indexOf("=") > -1) return e = o.split("="), t = decodeURIComponent(e[0]), n = decodeURIComponent(e[1]), t && (i[t] = n || ""), i;
            if (o.indexOf("&") > -1) {
                items = queryString.split("&");
                for (var a = 0, r = items.length; r > a; a++) e = items[a].split("="), t = decodeURIComponent(e[0]), t = decodeURIComponent(e[1]), t && (i[t] = n);
                return i
            }
        }, b.txtToJson = function(txt) {
            if (txt) {
                var j = {};
                try {
                    j = JSON.parse(txt)
                } catch (e) {
                    try {
                        j = eval("(" + txt + ")")
                    } catch (ee) {}
                }
                return j
            }
        };
        var _singleton = function(e) {
                var t = null;
                return function() {
                    return t || (t = e.apply(this, arguments))
                }
            },
            createXhr = function() {
                if (window.XMLHttpRequest) return new XMLHttpRequest;
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP")
                } catch (e) {}
            },
            _XHR = _singleton(createXhr);
        b.ajax = function(e) {
            var t = function(e) {
                if (e) {
                    var t = "";
                    for (var n in e) e.hasOwnProperty(n) && (t += "&" + n + "=" + e[n]);
                    return t.replace(/^\&/, "")
                }
            };
            if (e) {
                var n = e.isSequenceReq === !0 ? new _XHR : createXhr();
                e.isSequenceReq === !0 && 0 !== n.readyState && n.abort();
                var i = 0,
                    o = e.timeout;
                if (e.async !== !1 && (e.async = !0), n.open(e.method, e.url, e.async), n.onreadystatechange = function() {
                    4 === n.readyState && (i && clearTimeout(i), 200 === n.status ? e.succFunc(n.responseText) : e.failFunc(n.responseText))
                }, "GET" === e.method.toUpperCase()) n.send(null);
                else if ("POST" === e.method.toUpperCase()) {
                    var a = e.data ? t(e.data) : "";
                    n.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), n.send(a)
                }
                if (o) {
                    var r = o.millisecond || 1e4;
                    i = setTimeout(function() {
                        n.abort(), o.callback && o.callback()
                    }, r)
                }
            }
        }, b.setCookie = function(e, t, n) {
            var i = new Date;
            n ? i.setTime(i.getTime() + n) : i.setTime(i.getTime() + 2592e6), document.cookie = e + "=" + escape(t) + ";expires=" + i.toGMTString()
        }, b.getCookie = function(e) {
            var t, n = new RegExp("(^| )" + e + "=([^;]*)(;|$)");
            return t = document.cookie.match(n), t ? unescape(t[2]) : null
        }, b.delCookie = function(e) {
            var t = new Date;
            t.setTime(t.getTime() - 1);
            var n = b.getCookie(e);
            null != n && (document.cookie = e + "=11111;expires=" + t.toGMTString())
        }, b.clearCookies = function() {
            var e = document.cookie.match(/[^ =;]+(?=\=)/g);
            if (e)
                for (var t = e.length; t--;) document.cookie = e[t] + "=0;expires=Thu, 01 Jan 1970 00:00:00 GMT;"
        }, b.isArray = function(e) {
            return "[object Array]" === Object.prototype.toString.call(e)
        }, b.isObject = function(e) {
            return "[object Object]" === Object.prototype.toString.call(e)
        }, b.isFunc = function(e) {
            return "[object Function]" === Object.prototype.toString.call(e)
        }, b.collectLog = function(e, t, n) {
            this.ajax({
                method: "GET",
                url: "/api/v2/weixinapi/collect_log?openid=" + e + "&phone=" + t + n
            })
        }, Function.prototype.method = function(e, t) {
            return this.prototype[e] || (this.prototype[e] = t), this
        }, String.method("trim", function() {
            return this.replace(/^\s+|\s$/g, "")
        }), Array.method("contain", function(e) {
            for (var t in this)
                if (this[t] === e) return !0;
            return !1
        }), dd.base = b
    }
}(window),
function(e) {
    var t = e.dd || {};
    if (t.dialog) return t.dialog;
    var n = {},
        i = document.documentElement,
        o = i.clientHeight,
        a = i.clientWidth,
        r = null,
        l = null,
        c = null,
        d = function(e) {
            return Array.isArray(e)
        },
        s = function(e) {
            document.body.appendChild(e)
        },
        u = {
            genDom: function(e, t, n) {
                if (e)
                    if ("[object Object]" === Object.prototype.toString.call(e, null)) {
                        e.type = e.type || "loading", e.bg = e.bg || "", e.op = e.op || "", e.width = e.width || "280px", e.d_bg = e.d_bg || "#fff", e.d_op = e.d_op || "", e.wallCss = "background:" + e.bg + ";opacity:" + e.op + ";filter:" + e.filter + ";", e.wrapCss = "text-align:center;width:" + e.width + ";height:" + e.height + ";opacity:" + e.d_op + ";filter:" + e.d_filter + ";background: " + e.d_bg + ";background-size:100% auto;", t.style.cssText = e.wallCss, n.style.cssText = e.wrapCss;
                        var i = "<div style='" + ("loading" === e.type ? "padding:0px;" : "padding: 0px 6%;") + "'>" + u.genIcon(e) + u.genTitle(e) + u.genTip(e) + u.genButtons(e) + "</div>" + u.genClose(e);
                        n.innerHTML = i
                    } else "[object String]" === Object.prototype.toString.call(e, null) ? n.innerHTML = e : "[object HTMLDivElement]" === Object.prototype.toString.call(e, null) && (n.style.cssText = "display:inline-block;width:280px;background-color:#fff;", e.style.display = "inline-block", n.appendChild(e))
            },
            genIcon: function(e) {
                if (!e.icon) return "";
                var t = "";
                e.icon = 1 == e.icon && {};
                var n = e.icon.width || "8px",
                    i = e.icon.height || "36px",
                    o = e.icon.url || "http://static.xiaojukeji.com/webapp/images/i-plaint.png",
                    a = "",
                    r = "",
                    l = "";
                return "loading" === e.type ? (o = e.icon.url || "http://static.xiaojukeji.com/webapp/images/loading_2.gif", a = "margin:36px 0 10px", l = "display:inline-block;width:30px;height:30px;background:url(" + o + ") no-repeat;background-size:30px 30px;") : (a = "margin:24px 0 12px", l = "display:inline-block;width:60px;height:60px;background-color:#f0f0f0;background-size:60px 60px;border-radius:50%;", r = '<span style="vertical-align:middle;display:inline-block;height:100%;"></span><img src=' + o + ' style="width:' + n + ";height:" + i + ';vertical-align:middle;" />'), t = '<p  style="' + a + '"><span style="' + l + '">' + r + "</span></p>"
            },
            genTitle: function(e) {
                e.title = e.title || {};
                var t = e.title.color || "#ff8a01",
                    n = e.title.size || "1.9rem";
                return '<p style="margin-bottom: 5px;color:' + t + ";font-size:" + n + ';">' + (e.title.txt || "") + "</p>"
            },
            genTip: function(e) {
                return e.title && e.title.txt ? (e.tip.color = e.tip.color || "#666", e.tip.size = e.tip.size || "1.4rem") : (e.tip.color = e.tip.color || "#333", e.tip.size = e.tip.size || "1.6rem"), e.tip ? '<p style="' + ("loading" !== e.type ? "text-align:center;" : "") + "line-height:1.9rem;color:" + e.tip.color + ";font-size:" + e.tip.size + ';">' + e.tip.txt + "</p>" : ""
            },
            genClose: function(e) {
                return e.close ? '<a class="d-close" href="javascript:void(0);"></a>' : ""
            },
            genButtons: function(e) {
                var t = "";
                if (e.btns && d(e.btns)) {
                    t += '<div style="padding:20px 0;">';
                    for (var n = 0, i = e.btns.length; i > n; n++) {
                        var o = e.btns[n];
                        t += o && "alert" === e.type ? '<a class="' + o.kls + '" id="' + o.id + '">' + o.val + "</a>" : o && "confirm" === e.type ? '<a class="' + o.kls + '" id="' + o.id + '" style="width: 43%; height: 40px; line-height: 40px; margin:0 3%;">' + o.val + "</a>" : '<a class="' + o.kls + '" id="' + o.id + '" style="margin:5px 0;">' + o.val + "</a>"
                    }
                    t += "</div>"
                }
                return e.ext && "string" == typeof e.ext && (t += e.ext), t
            },
            addEvents: function(e) {
                var t = null;
                if (e.close) {
                    var n = document.getElementsByClassName("d-close")[0];
                    n.addEventListener("click", function() {
                        c.hide()
                    }, !1)
                }
                if (d(e.btns) && e.btns.length)
                    for (var i = 0, o = e.btns.length; o > i; i++)
                        if (t = e.btns[i]) {
                            var a = t.event || "click",
                                r = document.getElementById(t.id);
                            r && (r.removeEventListener(a, t.handler, !1), r.addEventListener(a, t.handler, !1))
                        }
            }
        },
        p = function(e) {
            return this instanceof p ? (new p.fn.init(e), void 0) : c = new p(e)
        };
    p.fn = p.prototype = {
        constructor: p,
        init: function(e) {
            if (e) {
                var t = document.createElement("div"),
                    n = document.createElement("div");
                t.id = "d-wall", n.id = "d-wrap", u.genDom(e, t, n), r && document.body.removeChild(r), l && document.body.removeChild(l), s(t), s(n), r = t, l = n, "[object Object]" === Object.prototype.toString.call(e, null) && u.addEvents(e)
            }
        },
        show: function() {
            function t(i) {
                e.removeEventListener(i.type, t, !1), n.reset.call(n)
            }
            var n = this;
            r && l && (n.reset(), r.style.display = "block", l.style.display = "inline-block", e.addEventListener("resize", t, !1), e.addEventListener("scroll", t, !1))
        },
        hide: function() {
            r && l && (r.style.display = "none", l.style.display = "none")
        },
        reset: function() {
            if (r && l) {
                l.style.top = (o - l.clientHeight - 20) / 2 + "px", l.style.left = (a - l.clientWidth) / 2 + "px";
                var e = document.body.scrollHeight || document.documentElement.scrollHeight;
                r.style.width = a + "px", r.style.height = e + "px"
            }
        }
    }, n.alert = function(e) {
        var t = {};
        "string" == typeof arguments[0] && arguments[0] ? (t.title = arguments[1] || "", t.tip = arguments[0], t.btn = {
            val: arguments[2] || "我知道了"
        }) : e && "object" == typeof e && (t = e), c = p({
            type: "alert",
            icon: t.icon || {
                url: "http://static.xiaojukeji.com/webapp/images/i-plaint.png",
                width: "8px",
                height: "36px"
            },
            title: {
                txt: t.title
            },
            tip: {
                txt: t.tip
            },
            btns: [{
                id: "btn-close",
                kls: "btn-orange",
                event: "click",
                val: t.btn && t.btn.val || "我知道了",
                handler: function(e) {
                    c.hide(), "function" == typeof t.btn.handler && t.btn.handler(e)
                }
            }]
        }), c.show()
    }, n.confirm = function(e) {
        var t = {};
        "string" == typeof arguments[0] && arguments[0] ? (t.text = arguments[0] || "", t.confirm = {}, t.confirm.handler = arguments[1]) : e && "object" == typeof e && (t = e);
        var n = t.cancel || {},
            i = t.confirm || {};
        c = p({
            type: "confirm",
            tip: {
                txt: t.text
            },
            icon: t.icon || {
                url: "http://static.xiaojukeji.com/webapp/images/i-plaint.png"
            },
            btns: [{
                id: n.id || "btn-cancel",
                val: n.val || "取消",
                kls: n.kls || "btn-white",
                event: n.event || "click",
                handler: function(e) {
                    c.hide(), "function" == typeof n.handler && n.handler(e)
                }
            }, {
                id: i.id || "btn-ok",
                val: i.val || "确定",
                kls: i.kls || "btn-orange",
                event: i.event || "click",
                handler: function(e) {
                    c.hide(), "function" == typeof i.handler && i.handler(e)
                }
            }],
            ext: t.ext
        }), c.show()
    }, n.loading = function(t) {
        var n = {};
        "object" != typeof arguments[0] ? (n.text = arguments[0], n.time = arguments[1] || 0) : n = t, c = p({
            type: "loading",
            bg: "#fff",
            d_bg: "#0c0d0d",
            d_op: "0.7",
            width: "140px",
            height: "140px",
            icon: !0,
            tip: {
                txt: n.text || "正在加载",
                color: "#fff",
                size: "14px"
            }
        }), c.show(), n.time || (n.time = 5e3), e.setTimeout(function() {
            c.hide(), console.log("function" == typeof n.hideCB), "function" == typeof n.hideCB && n.hideCB()
        }, n.time)
    }, n.flatLoading = function(t) {
        var n = {};
        "object" != typeof arguments[0] ? (n.text = arguments[0], n.time = arguments[1] || 0) : n = t, c = p({
            type: "loading",
            bg: "#fff",
            op: "1",
            d_bg: "#fff",
            d_op: "1",
            width: "140px",
            height: "140px",
            icon: !0,
            tip: {
                txt: n.text || "",
                color: "#666",
                size: "14px"
            }
        }), c.show(), n.time || (n.time = 5e3), e.setTimeout(function() {
            c.hide(), "function" == typeof n.hideCB && n.hideCB()
        }, n.time)
    }, n.logoLoading = function(e, t) {
        c = p('<div class="loading-car"><div class="bg"></div><div class="loading-car-icon"></div></div>'), c.show(), e || (e = 5e3), setTimeout(function() {
            c.hide(), "function" == typeof t && t()
        }, e)
    }, n.Fn = p, e.dd = t, t.dialog = n
}(window);
var CryptoJS = CryptoJS || function(e, t) {
    var n = {},
        i = n.lib = {},
        o = function() {},
        a = i.Base = {
            extend: function(e) {
                o.prototype = this;
                var t = new o;
                return e && t.mixIn(e), t.hasOwnProperty("init") || (t.init = function() {
                    t.$super.init.apply(this, arguments)
                }), t.init.prototype = t, t.$super = this, t
            },
            create: function() {
                var e = this.extend();
                return e.init.apply(e, arguments), e
            },
            init: function() {},
            mixIn: function(e) {
                for (var t in e) e.hasOwnProperty(t) && (this[t] = e[t]);
                e.hasOwnProperty("toString") && (this.toString = e.toString)
            },
            clone: function() {
                return this.init.prototype.extend(this)
            }
        },
        r = i.WordArray = a.extend({
            init: function(e, n) {
                e = this.words = e || [], this.sigBytes = n != t ? n : 4 * e.length
            },
            toString: function(e) {
                return (e || c).stringify(this)
            },
            concat: function(e) {
                var t = this.words,
                    n = e.words,
                    i = this.sigBytes;
                if (e = e.sigBytes, this.clamp(), i % 4)
                    for (var o = 0; e > o; o++) t[i + o >>> 2] |= (n[o >>> 2] >>> 24 - 8 * (o % 4) & 255) << 24 - 8 * ((i + o) % 4);
                else if (65535 < n.length)
                    for (o = 0; e > o; o += 4) t[i + o >>> 2] = n[o >>> 2];
                else t.push.apply(t, n);
                return this.sigBytes += e, this
            },
            clamp: function() {
                var t = this.words,
                    n = this.sigBytes;
                t[n >>> 2] &= 4294967295 << 32 - 8 * (n % 4), t.length = e.ceil(n / 4)
            },
            clone: function() {
                var e = a.clone.call(this);
                return e.words = this.words.slice(0), e
            },
            random: function(t) {
                for (var n = [], i = 0; t > i; i += 4) n.push(4294967296 * e.random() | 0);
                return new r.init(n, t)
            }
        }),
        l = n.enc = {},
        c = l.Hex = {
            stringify: function(e) {
                var t = e.words;
                e = e.sigBytes;
                for (var n = [], i = 0; e > i; i++) {
                    var o = t[i >>> 2] >>> 24 - 8 * (i % 4) & 255;
                    n.push((o >>> 4).toString(16)), n.push((15 & o).toString(16))
                }
                return n.join("")
            },
            parse: function(e) {
                for (var t = e.length, n = [], i = 0; t > i; i += 2) n[i >>> 3] |= parseInt(e.substr(i, 2), 16) << 24 - 4 * (i % 8);
                return new r.init(n, t / 2)
            }
        },
        d = l.Latin1 = {
            stringify: function(e) {
                var t = e.words;
                e = e.sigBytes;
                for (var n = [], i = 0; e > i; i++) n.push(String.fromCharCode(t[i >>> 2] >>> 24 - 8 * (i % 4) & 255));
                return n.join("")
            },
            parse: function(e) {
                for (var t = e.length, n = [], i = 0; t > i; i++) n[i >>> 2] |= (255 & e.charCodeAt(i)) << 24 - 8 * (i % 4);
                return new r.init(n, t)
            }
        },
        s = l.Utf8 = {
            stringify: function(e) {
                try {
                    return decodeURIComponent(escape(d.stringify(e)))
                } catch (t) {
                    throw Error("Malformed UTF-8 data")
                }
            },
            parse: function(e) {
                return d.parse(unescape(encodeURIComponent(e)))
            }
        },
        u = i.BufferedBlockAlgorithm = a.extend({
            reset: function() {
                this._data = new r.init, this._nDataBytes = 0
            },
            _append: function(e) {
                "string" == typeof e && (e = s.parse(e)), this._data.concat(e), this._nDataBytes += e.sigBytes
            },
            _process: function(t) {
                var n = this._data,
                    i = n.words,
                    o = n.sigBytes,
                    a = this.blockSize,
                    l = o / (4 * a),
                    l = t ? e.ceil(l) : e.max((0 | l) - this._minBufferSize, 0);
                if (t = l * a, o = e.min(4 * t, o), t) {
                    for (var c = 0; t > c; c += a) this._doProcessBlock(i, c);
                    c = i.splice(0, t), n.sigBytes -= o
                }
                return new r.init(c, o)
            },
            clone: function() {
                var e = a.clone.call(this);
                return e._data = this._data.clone(), e
            },
            _minBufferSize: 0
        });
    i.Hasher = u.extend({
        cfg: a.extend(),
        init: function(e) {
            this.cfg = this.cfg.extend(e), this.reset()
        },
        reset: function() {
            u.reset.call(this), this._doReset()
        },
        update: function(e) {
            return this._append(e), this._process(), this
        },
        finalize: function(e) {
            return e && this._append(e), this._doFinalize()
        },
        blockSize: 16,
        _createHelper: function(e) {
            return function(t, n) {
                return new e.init(n).finalize(t)
            }
        },
        _createHmacHelper: function(e) {
            return function(t, n) {
                return new p.HMAC.init(e, n).finalize(t)
            }
        }
    });
    var p = n.algo = {};
    return n
}(Math);
! function() {
    var e = CryptoJS,
        t = e.lib,
        n = t.WordArray,
        i = t.Hasher,
        o = [],
        t = e.algo.SHA1 = i.extend({
            _doReset: function() {
                this._hash = new n.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520])
            },
            _doProcessBlock: function(e, t) {
                for (var n = this._hash.words, i = n[0], a = n[1], r = n[2], l = n[3], c = n[4], d = 0; 80 > d; d++) {
                    if (16 > d) o[d] = 0 | e[t + d];
                    else {
                        var s = o[d - 3] ^ o[d - 8] ^ o[d - 14] ^ o[d - 16];
                        o[d] = s << 1 | s >>> 31
                    }
                    s = (i << 5 | i >>> 27) + c + o[d], s = 20 > d ? s + ((a & r | ~a & l) + 1518500249) : 40 > d ? s + ((a ^ r ^ l) + 1859775393) : 60 > d ? s + ((a & r | a & l | r & l) - 1894007588) : s + ((a ^ r ^ l) - 899497514), c = l, l = r, r = a << 30 | a >>> 2, a = i, i = s
                }
                n[0] = n[0] + i | 0, n[1] = n[1] + a | 0, n[2] = n[2] + r | 0, n[3] = n[3] + l | 0, n[4] = n[4] + c | 0
            },
            _doFinalize: function() {
                var e = this._data,
                    t = e.words,
                    n = 8 * this._nDataBytes,
                    i = 8 * e.sigBytes;
                return t[i >>> 5] |= 128 << 24 - i % 32, t[(i + 64 >>> 9 << 4) + 14] = Math.floor(n / 4294967296), t[(i + 64 >>> 9 << 4) + 15] = n, e.sigBytes = 4 * t.length, this._process(), this._hash
            },
            clone: function() {
                var e = i.clone.call(this);
                return e._hash = this._hash.clone(), e
            }
        });
    e.SHA1 = i._createHelper(t), e.HmacSHA1 = i._createHmacHelper(t)
}(), document.addEventListener("DOMContentLoaded", function() {
    var e = dd.base || {},
        t = dd.dialog || {},
        n = document;
    dd.jsonp = {}, dd.webappBiz = {};
    var i = n.getElementById("txt_start"),
        o = n.getElementById("txt_end"),
        a = n.getElementById("btn_call"),
        r = n.getElementById("d_sugs"),
        l = n.getElementById("ul_pois"),
        c = n.getElementById("i-close-s"),
        d = n.getElementById("i-close-e"),
        s = n.getElementById("h_cityid"),
        u = n.getElementById("h_cityname"),
        p = n.getElementById("h_ip_cityname"),
        f = n.getElementById("h_priceTips"),
        g = n.getElementById("h_priceTip"),
        h = n.getElementById("h_pois"),
        m = n.getElementById("h_access_token"),
        v = n.getElementById("h_openid").value || "fuck",
        y = n.getElementById("dv-ext"),
        b = n.getElementById("h_curr_lng"),
        x = n.getElementById("h_curr_lat"),
        w = n.getElementById("h_from_lng"),
        _ = n.getElementById("h_from_lat"),
        k = n.getElementById("h_from_name"),
        B = n.getElementById("h_from_addr"),
        C = n.getElementById("h_to_lat"),
        S = n.getElementById("h_to_lng"),
        E = n.getElementById("h_to_name"),
        j = n.getElementById("h_to_addr"),
        T = n.getElementsByTagName("header")[0].clientHeight,
        I = e.getElesByKls(n.body, "content")[0].clientHeight,
        H = e.getElesByKls(n.body, "content")[0].clientWidth,
        A = 0,
        z = localStorage.phone || e.getCookie("phone"),
        L = localStorage.token || e.getCookie("token"),
        O = null,
        F = {
            btnOrder: null,
            current: "",
            currentIndex: 0,
            handler: null,
            prevHanlder: null,
            extHanlder: null,
            extPrevHanlder: null,
            bannerHanlder: null,
            bannerPrevHanlder: null
        },
        N = {
            showCarCnt: function(e) {
                s_driver_num.className = "undefined" != typeof e ? "" : "loading", s_driver_num.innerText = "undefined" != typeof e ? e.toString() : ""
            },
            addMenus: function() {},
            showAdv: function() {},
            showExtInfo: function(e) {
                y.innerHTML = e
            }
        },
        J = function() {
            var e = t.Fn({
                type: "ad",
                tip: {
                    txt: "<span style='display:block;font-size:2.3rem;color:#ff8903;margin-top:120px;line-height:30px'>私人专车 随叫随到</span><span style='color:#666;font-size:1.2rem;line-height:1.2rem;'>上千优质轿车及专业司机<br/>随时响应您的呼叫</span>"
                },
                d_bg: "url(http://static.xiaojukeji.com/webapp/images/ad_biz.png) 0 -35px no-repeat #fff",
                close: !0,
                height: "208px"
            });
            e.show()
        },
        R = function(t) {
            if (dd.initSlide) {
                f.value = t.join(",");
                var i = function(e) {
                        g.value = e && e.cnt
                    },
                    o = function(e) {
                        if (e.length) {
                            for (var t = [], o = 0, a = e.length; a > o; o++) t.push({
                                name: e[o] + "元",
                                desc: e[o] + "元",
                                cnt: e[o],
                                selectedCB: i
                            });
                            dd.initSlide({
                                type: "price",
                                data: t
                            }), n.getElementById("sp-tips").style.display = "inline-block"
                        }
                        X(O[0])
                    };
                if (dd.jsonp.pGetFlag = function(i) {
                    i && (0 === i.errno && 1 === i.wanliu_flag ? (dd.initSlide({
                        type: "biz",
                        data: O,
                        defaultIndex: F.currentIndex
                    }), n.getElementById("dv-ext").style.display = "block", "true" !== localStorage.udacheTipsFlag && "true" !== e.getCookie("udacheTipsFlag") && (localStorage.udacheTipsFlag = "true", e.setCookie("udacheTipsFlag", "true"), J())) : o(t), localStorage.udacheExportFlag = JSON.stringify(i))
                }, z) {
                    var a = "http://api.udache.com/gulfstream/api/v1/webapp/pGetFlag?phone=" + z + "&lat=" + x.value + "&lng=" + b.value + "&from=wlwebapp";
                    e.jsonp(a, "pGetFlag")
                } else o(t)
            }
        },
        P = function(i) {
            var o = n.getElementById("menu"),
                a = n.querySelectorAll(".menu-mask")[0],
                r = a.querySelectorAll(".r")[0],
                l = n.getElementById("btnMenu"),
                c = n.getElementById("btnClose"),
                d = function() {
                    return localStorage.phone || e.getCookie("phone")
                },
                s = function() {
                    t.loading(), location.replace("/api/v2/weixinapi?openid=" + v + "&phone=" + i + "&page=phonecode&way=2")
                },
                u = function() {
                    return d() ? (setTimeout(function() {
                        a.className = a.className.replace(" hidden", "") + " visible", setTimeout(function() {
                            r.className += " visible"
                        }, 100)
                    }, 200), void 0) : (s(), void 0)
                },
                p = function() {
                    r.className = r.className.replace(" visible", " "), setTimeout(function() {
                        a.className = a.className.replace(" visible", " hidden")
                    }, 100)
                },
                f = function() {
                    d() ? window.open("/api/v2/weixinapi?openid=" + v + "&page=mybalance", "_self") : window.open("/api/v2/weixinapi?openid=" + v + "&phone=" + i + "&page=phonecode&way=2", "_self")
                },
                g = function() {
                    e.diffPlatform({
                        ios: function() {
                            location.replace("https://itunes.apple.com/cn/app/di-di-da-che-zhi-jian-shang/id554499054?ls=1&mt=8")
                        },
                        android: function() {
                            location.replace("http://bcs.duapp.com/ddtaxi/didi_psngr_000.apk")
                        },
                        wp: function() {
                            location.replace("http://www.windowsphone.com/zh-cn/store/app/%E5%98%80%E5%98%80%E6%89%93%E8%BD%A6/df0b0606-22c2-4b93-a016-936ac248eccc?signin=true")
                        }
                    })
                },
                h = function() {
                    t.confirm({
                        text: "确定要退出吗？",
                        confirm: {
                            handler: function() {
                                localStorage.removeItem("token"), e.delCookie("token"), localStorage.removeItem("phone"), e.delCookie("phone"), p()
                            }
                        }
                    })
                },
                m = function(e) {
                    switch (e.item.clz) {
                        case "balance":
                            f();
                            break;
                        case "help":
                            window.open("/share/faq/weixin_webapp_help.html");
                            break;
                        case "coupon":
                            window.open("/api/v2/p_coupon/couponinfo?pid=" + L, "_self");
                            break;
                        case "download":
                            g();
                            break;
                        case "loginOut":
                            h()
                    }
                },
                y = {
                    items: [{
                        clz: "phone",
                        title: i || "",
                        notNeedActive: !0
                    }, {
                        clz: "balance",
                        title: "我的余额"
                    }, {
                        clz: "coupon",
                        title: "我的打车券"
                    }, {
                        clz: "help",
                        title: "乘客指南"
                    }, {
                        clz: "download",
                        title: "下载客户端"
                    }, {
                        clz: "loginOut",
                        title: "退出登录"
                    }],
                    events: {
                        tap: m
                    }
                };
            l.addEventListener("touchend", u, !1), c.addEventListener("touchend", p, !1), e.loadJS("http://static.xiaojukeji.com/webapp/lib/ui/dd.ui.menu.js", function() {
                dd.ui.menu(o, y)
            })
        },
        M = function() {
            var e = 0,
                t = ["", ".", "..", "..."];
            A && clearInterval(A), A = setInterval(function() {
                i.placeholder = "定位中" + t[e], e++, e >= 4 && (e = 0)
            }, 300)
        },
        U = function() {
            A && clearInterval(A), i.placeholder = "我在", i.removeAttribute("disabled")
        },
        D = function(t) {
            U(), dd.geo.isGeoSucc = !0;
            var r = e.txtToJson(t);
            0 === r.errno && (x.value = r.lat, b.value = r.lng, r.result && r.result.length && (i.value = r.result[0].displayname, _.value = r.result[0].lat, w.value = r.result[0].lng, k.value = r.result[0].displayname, B.value = r.result[0].address, a.className = o.value && i.value ? "btn-orange" : "btn-gray", h.value = JSON.stringify(r.result)), r.cityid && (s.value = r.cityid, u.value = r.cityname || r.city), e.loadJS("http://static.xiaojukeji.com/webapp/lib/dd.slide.js?v=20141012", function() {
                R(r.tip)
            }), N.showCarCnt(n.getElementById("hid-car-cnt").value), e.loadJS("http://static.xiaojukeji.com/webapp/lib/dd.banner.js", function() {
                dd.banner({
                    events: {
                        tap: function() {}
                    }
                })
            }))
        },
        G = function(t) {
            e.ajax({
                method: "GET",
                url: "/api/v2/weixinapi/p_reversegeocoding?lng=" + t.lng + "&lat=" + t.lat + "&appversion=" + (t.version || 2.5) + "&maptype=" + t.maptype + "&need=1",
                succFunc: D,
                failFunc: U
            })
        },
        q = {
            loading: M,
            succCB: G,
            deniedCB: U,
            timeout: {
                cnt: 5e3,
                CB: U
            }
        },
        W = {
            accesstoken: m.value,
            loading: M,
            succCB: G,
            errorCB: function() {
                dd.geo.h5(q)
            },
            timeout: {
                cnt: 5e3,
                CB: function() {
                    dd.geo.h5(q)
                }
            }
        },
        X = function(n) {
            if (F.current !== n.name && O && e.isArray(O)) {
                var i = null,
                    r = null,
                    l = null;
                N.common = {
                    lat: x.value,
                    lng: b.value,
                    flat: _.value,
                    flng: w.value,
                    from_name: k.value,
                    from_address: B.value,
                    tlat: C.value,
                    tlng: S.value,
                    to_name: o.value,
                    to_address: j.value,
                    cityid: s.value,
                    cityname: u.value
                };
                var c = function() {
                    if (i = dd.webappBiz[n.name], !e.isFunc(i)) throw "Please return an object like this:  { init: function(platData){ /*Do what you want */ } }";
                    if (r = i.call(null, N), !e.isObject(r)) throw "Please return an object when invoked the init function like this: { }";
                    e.isFunc(r.outCB) && (n.outCB = r.outCB), e.isFunc(r.onFromChange) && (N.onFromChange = r.onFromChange), e.isFunc(r.onFromChange) && (N.onDestChange = r.onDestChange), F.current = n.name, localStorage.currentBiz = n.name, F.btnOrder = r.btnOrder, a.innerText = F.btnOrder.val, F.handler = function(n) {
                        if ("btn-orange" === n.target.className) {
                            var i = function(e) {
                                    t.alert(e), n.target.className = "btn-orange"
                                },
                                a = {
                                    token: encodeURIComponent(localStorage.token || e.getCookie("token")),
                                    phone: localStorage.phone || e.getCookie("phone"),
                                    openid: v,
                                    lat: x.value,
                                    lng: b.value,
                                    flat: _.value,
                                    flng: w.value,
                                    from_name: k.value,
                                    from_address: B.value,
                                    tlat: C.value,
                                    tlng: S.value,
                                    to_name: o.value,
                                    to_address: j.value,
                                    cityid: s.value,
                                    cityname: u.value
                                };
                            if (!a.lng || !a.lat) return t.alert("未能获得您的位置，详细描述起点，可以帮助我们为您定位哦"), void 0;
                            if (!a.from_name || !a.to_name || !a.cityid) throw "Need data is miss.";
                            Z({
                                tlat: a.tlat,
                                tlng: a.tlng,
                                to_name: a.to_name,
                                to_address: a.to_address
                            }), t.loading(), n.target.className = "btn-gray";
                            var r = "";
                            e.isFunc(F.btnOrder.touchCB) && (r = F.btnOrder.touchCB(a, i)), "undefined" != typeof r && r && (localStorage.udacheCallOrderUrl = r, a.token ? location.replace(r + "&token=" + a.token) : location.replace("/api/v2/weixinapi?openid=" + a.openid + "&phone=" + a.phone + "&page=phonecode&way=4"))
                        }
                    }, F.extHanlder = function() {
                        localStorage.udacheShortOrderInfo = JSON.stringify({
                            toLat: C.value,
                            toLng: S.value,
                            toName: o.value,
                            toAddr: j.value,
                            biz: "udache"
                        }), e.isFunc(r.extTouchCB) && r.extTouchCB(y.innerHTML)
                    }, F.prevHanlder && a.removeEventListener("touchend", F.prevHanlder, !1), a.addEventListener("touchend", F.handler, !1), F.extPrevHanlder && y.removeEventListener("touchend", F.extPrevHanlder, !1), y.addEventListener("touchend", F.extHanlder, !1), F.prevHanlder = F.handler, F.extPrevHanlder = F.extHanlder;
                    for (var c = 0, d = O.length; d > c; c++) l = O[c], l.name !== n.name && F.current && e.isFunc(l.outCB) && l.outCB()
                };
                e.loadJS(n.js, c)
            }
        };
    O = [{
        name: "diditaxi",
        desc: "出租车",
        js: "http://static.xiaojukeji.com/webapp/js/diditaxi.js",
        selectedCB: function() {
            X(this)
        }
    }, {
        name: "udache",
        desc: "专车",
        js: "http://static.udache.com/gulfstream/webapp/js/biz.min.js",
        selectedCB: function() {
            X(this)
        }
    }];
    var $ = function(t) {
            if ("udache" === localStorage.currentBiz) {
                var i = e.txtToJson(localStorage.udacheShortOrderInfo);
                i && (o.value = i.toName, F.currentIndex = 1, localStorage.removeItem("currentBiz"), localStorage.removeItem("udacheShortOrderInfo"))
            }
            var a = !1,
                r = function() {
                    a = !0, WeixinJSBridge && (e.loadJS("http://static.xiaojukeji.com/webapp/lib/dd.geo.js", function() {
                        dd.geo && dd.geo.location(WeixinJSBridge, {
                            weixin: W,
                            h5: q
                        })
                    }), e.loadJS("http://static.xiaojukeji.com/webapp/wx.share.js", function() {
                        "function" == typeof define_wx_share && define_wx_share(WeixinJSBridge)
                    }))
                };
            "undefined" == typeof WeixinJSBridge ? n.addEventListener("WeixinJSBridgeReady", r) : r(), t || (localStorage.current = "orderinfo", e.setCookie("current", "orderinfo")), P(z)
        },
        K = function(n) {
            var i = function() {
                var t = localStorage.current || e.getCookie("current"),
                    i = (new Date).getTime(),
                    o = localStorage.time || e.getCookie("time"),
                    a = i - o,
                    r = 18e5 >= a,
                    l = 108e5 >= a,
                    c = 18e6 >= a;
                if ("waitforstrive" == t && r) {
                    var d = localStorage.pers || e.getCookie("pers");
                    if (!d) return;
                    location.replace("/api/v2/weixinapi?openid=" + v + "&page=waitforstrive&phone=" + z)
                } else if ("waitforcar" == t && l)(localStorage.driver || e.getCookie("driver")) && location.replace("/api/v2/weixinapi?openid=" + v + "&page=waitforcar&phone=" + z);
                else if ("charge" == t && c) {
                    var s = localStorage.orderid || getCookie("orderid");
                    if (n || s) return location.replace("/api/v2/weixinapi?openid=" + v + "&page=charge&oid=" + n || s + "&showwxpaytitle=1"), void 0
                } else if ("retrytocall" === t && r) {
                    if (localStorage.order || e.getCookie("order")) return location.replace("/api/v2/weixinapi?openid=" + v + "&page=retrytocall"), void 0
                } else $()
            };
            t.confirm({
                text: "您有未完成的出租车订单，是否恢复？",
                cancel: {
                    handler: function() {
                        $(!0)
                    }
                },
                confirm: {
                    handler: i
                }
            })
        },
        Q = function(e) {
            e && t.confirm({
                text: "您有未完成的专车订单，是否恢复？",
                cancel: {
                    handler: function() {
                        $(!0)
                    }
                },
                confirm: {
                    handler: function() {
                        e && L && (location.href = "http://api.udache.com/gulfstream/api/v1/webapp/pIndex?token=" + encodeURIComponent(L) + "&oid=" + encodeURIComponent(e) + "&phone=" + z)
                    }
                }
            })
        };
    ! function(t) {
        return t && L ? (e.ajax({
            method: "GET",
            url: "/api/v2/c_orderrecover?token=" + encodeURIComponent(L),
            succFunc: function(t) {
                var n = localStorage.current || e.getCookie("current");
                return t = e.txtToJson(t), 0 !== t.errno ? ($(), void 0) : ("TVE9PQ==" === t.product_type && "orderinfo" !== n ? K(t.oid) : "TWc9PQ==" === t.product_type ? Q(t.oid) : t.product_type || "orderinfo" === n ? $() : K(null), void 0)
            },
            failFunc: $
        }), void 0) : ($(), void 0)
    }(z);
    var V = function(e) {
        var t = e === c ? i : o;
        e.style.display = "none", r.style.display = "none", a.className = "btn-gray", t.value = "", setTimeout(function() {
            t.focus()
        }, 5)
    };
    c.addEventListener("touchend", function(e) {
        V(e.target)
    }, !1), d.addEventListener("touchend", function(e) {
        V(e.target)
    }, !1);
    var Y = function() {
            var t = "",
                n = null,
                i = e.txtToJson(localStorage.toList);
            if (e.isArray(i)) {
                for (var o = i.length; o--;) n = i[o], n && "object" == typeof n ? t += "<li>" + n.to_name + "<span>" + n.to_address + "</span><input type='hidden' lat='" + n.tlat + "' lng='" + n.tlng + "'></li>" : n && "string" == typeof n && (t += "<li>" + n + "</li>");
                t += "<li style='border-bottom:none;color:#ff8a01' id='liExpand'><a>收起</a></li>", tt(t, !1)
            }
        },
        Z = function(t) {
            var n = function(t, n) {
                    if (!e.isArray(t)) return !1;
                    for (var i = t.length; i--;)
                        if (n.to_name === t[i].to_name) return !0;
                    return !1
                },
                i = e.txtToJson(localStorage.toList);
            e.isArray(i) || (i = []), n(i, t) || (i.push(t), localStorage.toList = JSON.stringify(i))
        },
        et = function(e) {
            var t = "",
                n = null;
            if (!e || !e.length) return t;
            for (var i = 0, o = e.length; o > i; i++) n = e[i], n && (t += "<li>" + n.displayname + "<span>" + n.address + '</span><input type="hidden" value="' + (n.city || "") + '" lat="' + (n.lat || "") + '" lng="' + (n.lng || "") + '"></li>');
            return t += "<li style='border-bottom:none;color:#ff8a01;' id='liExpand'><a>收起</a></li>"
        };
    l.addEventListener("click", function(t) {
        var n = function(e) {
                return "LI" === e.nodeName.toUpperCase() ? e : arguments.callee(e.parentNode)
            },
            s = function(t, n) {
                if (n) {
                    var r = t ? i : o,
                        l = t ? _ : C,
                        c = t ? w : S,
                        d = t ? k : E,
                        s = t ? B : j,
                        u = t ? N.onFromChange : N.onDestChange,
                        p = n.name === d.value && n.addr === s.value && n.lat === l.value && n.lng === c.value;
                    p || (r.value = n.name, l.value = n.lat, c.value = n.lng, d.value = n.name, s.value = n.addr, e.isFunc(u) && u.call(N, n), a.className = o.value && i.value ? "btn-orange" : "btn-gray")
                }
            },
            p = "true" === l.getAttribute("relativeFrom") ? !0 : !1,
            f = p ? c : d,
            g = n(t.target);
        if (f.style.display = "none", r.style.display = "none", "liExpand" !== g.id) {
            var h = g.childNodes,
                m = h[0],
                v = h[1],
                y = h[2],
                b = {
                    name: m.nodeValue,
                    addr: v.innerText,
                    lat: y.getAttribute("lat"),
                    lng: y.getAttribute("lng")
                };
            if (s(p, b), !dd.geo.isGeoSucc) {
                {
                    h[1].innerText
                }
                u.value = h[2].getAttribute("value")
            }
        }
    }, !1);
    var tt = function(e, t) {
            l.innerHTML = e, l.setAttribute("relativeFrom", t), r.style.width = H + "px", r.style.top = t ? T + (I - 1) / 2 + "px" : T + I - 2 + "px", r.style.display = "block"
        },
        nt = function(t, n) {
            var o = "",
                a = t.value.replace("附近", "");
            return a.length < 2 ? (r.style.display = "none", void 0) : ("city" === n && u.value ? o = "/api/v2/p_placesuggestion?query=" + encodeURIComponent(a) + "&openid=" + v + "&city=" + u.value : "country" === n && (o = "/api/v2/weixinapi/p_getstartsug?query=" + encodeURIComponent(a) + "&openid=" + v + "&ipcity=" + p.value), e.ajax({
                method: "GET",
                url: o,
                isSequenceReq: !0,
                succFunc: function(o) {
                    var a = e.txtToJson(o);
                    "0" == a.errno && a.result.length ? (p.value = "country" === n ? a.ipcity : p.value, tt(et(a.result), t === i)) : r.style.display = "none"
                },
                failFunc: function() {
                    r.style.display = "none"
                }
            }), void 0)
        },
        it = function(e) {
            dd.geo.isGeoSucc ? nt(e, "city") : nt(e, "country")
        },
        ot = function(t) {
            a.className = o.value && i.value ? "btn-orange" : "btn-gray", t === i ? (c.style.display = t.value ? "inline-block" : "none", !t.value && dd.geo.isGeoSucc && tt(et(e.txtToJson(h.value)), !0)) : t === o && (d.style.display = t.value ? "inline-block" : "none", t.value || Y())
        },
        at = function(e) {
            var t = 0,
                n = [],
                i = 0;
            e.txtEle && 1 === e.txtEle.nodeType && e.txtEle.addEventListener("input", function(o) {
                "function" == typeof e.immediateAction && e.immediateAction(o.target), t++, n.push(o.target.value), t === n.length ? i = setTimeout(function() {
                    n[n.length - 1] && e.deplayAction && e.deplayAction(o.target), t = 0, n = []
                }, e.interval) : clearTimeout(i)
            }, !1)
        };
    at({
        txtEle: i,
        interval: 600,
        immediateAction: ot,
        deplayAction: it
    }), at({
        txtEle: o,
        interval: 600,
        immediateAction: ot,
        deplayAction: it
    }), i.addEventListener("focus", function(t) {
        d.style.display = "none", c.style.display = t.target.value ? "inline-block" : "none", dd.geo.isGeoSucc ? t.target.value && t.target.value !== k.value ? nt(t.target, "city") : tt(et(e.txtToJson(h.value)), !0) : nt(t.target, "country")
    }, !1), o.addEventListener("focus", function(e) {
        c.style.display = "none", d.style.display = e.target.value ? "inline-block" : "none", e.target.value ? it(e.target) : Y()
    }, !1)
}, !1);