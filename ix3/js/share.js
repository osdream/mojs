var title ="标题"
var content = "内容";
var img_url = "";
var shareurl = "";

(function(){
	if( document.addEventListener ){
		document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
	}else if (document.attachEvent){
		document.attachEvent('WeixinJSBridgeReady', onBridgeReady); 
		document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
	}
	
	function onBridgeReady(){
		
		
		// 发送给好友; 
		WeixinJSBridge.on('menu:share:appmessage', function(argv){
			WeixinJSBridge.invoke('sendAppMessage',{
				"img_url"    : img_url,
				"img_width"  : "640",
				"img_height" : "640",
				"link"       : shareurl,
				"desc"       : content,
				"title"      : title
			}, function(res) {
				
			});
		});
		
		// 分享到朋友圈;
		WeixinJSBridge.on('menu:share:timeline', function(argv){
				WeixinJSBridge.invoke('shareTimeline',{
					"img_url"    : img_url,
					"img_width"  : "640",
					"img_height" : "640",
					"link"       : shareurl,
					"desc"       : content,
					"title"      : title
				}, function(res) {
					
				});
		});
		
		// 分享到微博;
		var weiboContent = '';
		WeixinJSBridge.on('menu:share:weibo', function(argv){
			WeixinJSBridge.invoke('shareWeibo',{
			  "content" : title+content,
			  "url"     : shareurl 
			}, function(res) {
			  
			});
		});
	
		// 分享到Facebook
		 WeixinJSBridge.on('menu:share:facebook', function(argv){
			WeixinJSBridge.invoke('shareFB',{
				  "img_url"    : img_url,
				  "img_width"  : "640",
				  "img_height" : "640",
				  "link"       : shareurl,
				  "desc"       : content,
				  "title"      : title
			}, function(res) {
				
			});
		});
		
		// 新的接口
		WeixinJSBridge.on('menu:general:share', function(argv){
			var scene = 0;
			switch(argv.shareTo){
				case 'friend'  : scene = 1; break;
				case 'timeline': scene = 2; break;
				case 'weibo'   : scene = 3; break;
			}
			argv.generalShare({
				"appid"      : "",
				"img_url"    : img_url,
				"img_width"  : "640",
				"img_height" : "640",
				"link"       : shareurl,
				"desc"       : content,
				"title"      : title
			}, function(res){
				
			});
		});
		
		// get network type
		var nettype_map = {
			"network_type:fail" : "fail",
			"network_type:edge": "2g",
			"network_type:wwan": "3g",
			"network_type:wifi": "wifi"
		};
		
	}
})();
