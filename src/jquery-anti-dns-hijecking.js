;(function(win, $) {

    /**
    * 定义反劫持类
    */
    function AntiHijecking(config) {
        var defaults = {
            selector : ':not([anti-hijecking])', 
            server : 'http://mstats.vip.com/v1/stats/',
            name : 'dns_'
        }

        $.extend(this, defaults, config);
        this.bootstrap();
    }

    /**
    * 定义原型方法
    */
    $.extend(AntiHijecking.prototype, {

        // 入口
        bootstrap: function() {
            this.initPlatform();
            this.startCheck();
        },

        // 缓存拦截并删除的dom元素
        hijeckingList: [],

        // 已知的dns劫持方式关键字
        typeList: [
            'u.c.b.r.o.w.s.e.r', // uc浏览器在iphone会插入这一条
            '10086.cn', // 10086
            'adpro-tt', // http://ip/js/adpro-tt\d{2}.js
            'tlbsserver/jsreq', // http://ip:port/tlbsserver/jsreq?tid=xxxx
            'static/floatingcontent', // http://ip/static/floatingcontent/aflasjefkl/floating-frame.js
            // '__WeixinJSBridgeIframe', // <iframe id=\"__WeixinJSBridgeIframe\" style=\"display: none; \" src=\"weixin://dispatch_message/\"></iframe>
            '__WeiboJSInvokeIframe',
            'http://ma.vip.com/statics/js/active_common',
            't5.baidu.com',
            'ad.100msh.com',
            'wo.iuni.com.cn',
            'bdwm.hsmkj.net',
            'recog_div', // 空标签
            '<link>', // 空标签
            'pageSwitch_control',
            'http://3rd-app.vipstatic.com/mars/mars_wap',
            'http://ap.vip.com/statics/js/jquery',
            'MTT_NIGHT_MDOE_MSG_IFRAME',
            '<style></style>', // 空标签
            '<style type="text/css"></style>' // 空标签
            // 'other'
        ],

        whiteList : [
            '__WeixinJSBridgeIframe',
            '__WeixinJSBridgeIframe_SetResult'
        ],

        count: 0,

        platform: null,

        system: null,

        startCheck: function() {
            var checkFn;
            this.startTime = this.t1 = +new Date;
            // 每1秒执行一次定时检测
            checkFn = $.proxy(this.check, this);
            this.interval = setInterval(checkFn, 1000);
            checkFn();
        },

        getQueryString: function(name) {
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
                r = location.search.substr(1).match(reg);

            if (r != null) return unescape(r[2]);

            return null;
        },

        initPlatform: function() {
            var source = this.getQueryString('source'),
                ua = navigator.userAgent.toLowerCase(),
                url = location.host,
                platform,
                system;

            // android iphone ipad
            if (source) {
                platform = this.getQueryString('client');
                // weixin
            } else if (ua.indexOf('micromessenger') > -1) {
                platform = 'weixin';
                // wap
            } else if (/m.vip.com/.test(url)) {
                platform = 'wap';
                // other
            } else {
                platform = 'other';
            }

            this.platform = platform;
        },

        // 因为wap是嵌专题方式实现的，无法添加自定义属性，需要差异化处理
        isWap: function() {
            this.isWap = /m.vip.com/.test(location.host) ? true : false;
        },

        check: function() {
            var list = $(this.selector),
                that = this;


            if (list.length) {

                list.each(function(k, v) {

                    var parent, html, classList;
                    html = this.outerHTML;

                    // 过滤白名单元素，如微信bridge
                    if(that.whiteList.indexOf(this.id) > -1) return;

                    // array, 父链class
                    classList = $(this).parents().map(function() {
                        return $(this).attr('class')
                    });

                    that.hijeckingList.push({
                        html: html,
                        nodeList: $.makeArray ? $.makeArray(classList) : classList,
                        count: that.count
                    })

                    $(this).remove();
                })
            }

            this.afterCheck();
        },

        // 5秒后删除定时器，并发送请求
        // 收集第一次js运行的时间
        afterCheck: function() {
            if (!this.count) {
                this.runTime = +new Date - this.t1;
            }
            if (+new Date - this.startTime > 5000) {
                var data = this.getListParams();
                clearInterval(this.interval);
                this.hijeckingList.length && this.send(data);
            } else {
                this.count++;
            }
        },

        send: function(data) {
            var img = new Image,
                url = this.server;
            img.src = this.server + this.name + '?' + $.param(data);
        },

        // 查找已知拦截方式，匹配则设置type为拦截方式string，否则为other
        getType: function() {
            var match,
                type,
                strList = this.strList = JSON.stringify(this.hijeckingList);

            type = $.map(this.typeList, function(v) {
                if (strList.indexOf(JSON.stringify(v)) > -1) return v;
            })[0];

            return type || 'other';
        },

        // 获取上报数据
        getListParams: function() {
            var params,
                html,
                time = this.runTime,
                type;

            type = this.getType();
            // 如果不在拦截列表里，type设置为other，则过滤长度5000，一般手机浏览器限制8K左右，上报服务器暂时限制10K
            if (type == 'other') {
                html = this.strList.slice(-5000);
            }

            params = {
                // server需要获取的字段 : url, ua, ip
                // fe需要获取的字段
                query: JSON.stringify({
                    type: type, //'10086', 'uc', '', '<div></div>'
                    platform: this.platform, // android, wap, iphone, ipad, weixin, other
                }),
                data : JSON.stringify({
                    time : time
                }),
                msg: html || ''
            };

            return params;
        }
    })

    win.AntiHijecking = AntiHijecking;

    $(function(){
        var config = win.antiDnsHijeckingConfig;
        if(config) new AntiHijecking(config);
    })
    

})(window, $)