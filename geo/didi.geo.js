! function(e) {
    if (e && e.base) {
        if (e.geo) return e.geo;
        var t = e.geo || {},
            o = [],
            n = [],
            a = 0,
            c = !1;
        t.weixin = function(t, n) {
            if (t) {
                n = n || {};
                var u = this,
                    r = "",
                    s = "",
                    g = (new Date).getTime(),
                    f = function() {
                        return n.appid || "wx69b6673576ec5a65"
                    },
                    p = function() {
                        var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                            t = e.length,
                            o = "";
                        for (i = 0; 32 > i; i++) o += e.charAt(Math.floor(Math.random() * t));
                        return s = o, o
                    },
                    w = function() {
                        var e = (new Date).getTime().toString();
                        return r = e, e
                    },
                    l = function() {
                        var e = w(),
                            t = p(),
                            i = "accesstoken=" + n.accesstoken + "&appid=" + f() + "&noncestr=" + t + "&timestamp=" + e + "&url=" + location.href;
                        return CryptoJS.SHA1(i).toString()
                    },
                    m = {
                        appId: f(),
                        scope: "jsapi_location",
                        signType: "SHA1",
                        addrSign: l(),
                        timeStamp: r,
                        nonceStr: s,
                        type: "wgs84"
                    },
                    d = function(t) {
                        if (c) return o.push("&w_type=weixin&w_status=timeout&w_time=" + ((new Date).getTime() - g)), "function" == typeof n.timeoutCB && n.timeoutCB(t), void 0;
                        if ("geo_location:ok" == t.err_msg) {
                            u.isGeoSucc = !0;
                            var i = "";
                            e.base.diffPlatform({
                                ios: function() {
                                    i = "wgs84"
                                },
                                android: function() {
                                    i = t.type && "wgs84" === t.type ? "wgs84" : "gcj02"
                                }
                            });
                            var r = {
                                lat: t.latitude,
                                lng: t.longitude,
                                maptype: i
                            };
                            o.push("&w_type=weixin&w_status=succ&lat=" + t.latitude + "&lng=" + t.longitude + "&maptype=" + i + "&w_time=" + ((new Date).getTime() - g)), "function" == typeof n.succCB && n.succCB(r)
                        } else o.push("&w_type=weixin&w_status=failed&w_time=" + ((new Date).getTime() - g)), "function" == typeof n.errorCB && n.errorCB(t);
                        clearTimeout(a)
                    },
                    y = n.timeout || {};
                "function" == typeof n.loading && n.loading(), "function" == typeof y.CB && (a = setTimeout(function() {
                    c = !0, y.CB()
                }, y.cnt || 6e3)), WeixinJSBridge.invoke("geoLocation", m, d), u.wxGeoLog = o
            }
        }, t.h5 = function(e) {
            e = e || {};
            var t = this,
                i = (new Date).getTime(),
                o = e.timeout || {},
                a = function(o) {
                    t.isGeoSucc = !0, n.push("&w_type=h5&w_status=succ&lat=" + o.coords.latitude + "&lng=" + o.coords.longitude + "&maptype=wgs84&w_time=" + ((new Date).getTime() - i));
                    var a = {
                        lat: o.coords.latitude,
                        lng: o.coords.longitude,
                        maptype: "wgs84"
                    };
                    "function" == typeof e.succCB && e.succCB(a)
                },
                c = function(t) {
                    var a = "";
                    switch (t.code) {
                        case t.TIMEOUT:
                            a = "timeout", "function" == typeof o.CB && o.CB(t);
                            break;
                        case t.POSITION_UNAVAILABLE:
                            a = "position_unavailable";
                            break;
                        case t.PERMISSION_DENIED:
                            "function" == typeof e.deniedCB && e.deniedCB(t), a = "permission_denied";
                            break;
                        case t.UNKNOWN_ERROR:
                            a = "unknow_error"
                    }
                    n.push("&w_type=h5&w_status=" + a + "&w_time=" + ((new Date).getTime() - i))
                };
            "function" == typeof e.loading && e.loading(), navigator.geolocation ? navigator.geolocation.getCurrentPosition(a, c, {
                enableHighAccuracy: !0,
                timeout: o.cnt || 5e3,
                maximumAge: 2e3
            }) : base.loadJS("/static/webapp/gears_init.min.js", function() {
                if (window.google && google.gears) try {
                    var e = google.gears.factory.create("beta.location");
                    e.getCurrentPosition(a, c, {
                        enableHighAccuracy: !0,
                        timeout: o.cnt || 5e3,
                        maximumAge: 2e3
                    })
                } catch (t) {}
            }), t.h5GeoLog = n
        }, t.location = function(e, t) {
            t = t || {};
            var i = this;
            e ? i.weixin(e, t.weixin) : i.h5(t.h5)
        }, t.isGeoSucc = !1, e.geo = t
    }
}(window.dd);