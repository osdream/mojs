var game = {
	lock : true,
	pageLoad : false,
	getReady : false,
	num : 0,
	touchstart : "touchstart",
	touchmove :"touchmove",
	touchend : "touchend",
	init : function() {
		game.touchstart = "ontouchend" in document ? "touchstart" : "mousedown";
		game.touchmove = "ontouchend" in document ? "touchmove" : "mousemove";
		game.touchend = "ontouchend" in document ? "touchend" : "mouseup";
		game.move();
		game.bindEvent();
		game.connPrepare();
		game.loading();
	},
	loading:function(){
		var imgCount = $("img").size();
		var imgNum = 0;
		$("img").each(function(index, element) {
			$(this).attr("src",$(this).attr("data-src"));
			$(this).load(function(){
				imgNum+=1;
				if(imgNum >= imgCount){
					game.pageLoad = true;
					game.loadEnd();
				}
			});
			$(this).error(function(){
				imgNum+=1;
				if(imgNum >= imgCount){
					game.pageLoad = true;
					game.loadEnd();
				}
			});
		});
	},
	loadEnd:function(){
		//alert(game.pageLoad +"::"+ game.conLoad);
		if(game.pageLoad){
			$("#loading").fadeOut(800);
		}
	},
	bindEvent:function(){
		$(".box").attr({"mX":0,"mY":0,"curX":0,"curY":0}).css({opacity:1}).show();
		$("#btn-start").bind(game.touchstart,function(e){
			connect.send(['std', 2].join('|')); // 发送标准信
			//game.start();
		});
		$("#btn-continue").bind(game.touchstart,function(e){
			$("#tab").css({top:0}).show();
			$("#btn-continue").fadeOut(800,function(){
				$("#move").fadeOut(800);
				$("#tableBg").css({opacity:0}).delay(600).animate({opacity:1},500);
				$("#btn-sup").hide().delay(1200).fadeIn(800);
				$("#sup-tip").hide().delay(1500).fadeIn(800);
			});
			e.preventDefault();
		});
		$("#btn-sup").bind(game.touchstart,function(e){
			
			$("#hand").transition({rotate: '150deg'},2200);
			connect.send(["showCar"].join('|')); // 发送标准信息
			setTimeout(function(){
				game.end();
			},1000);
			e.preventDefault();
		});
		$("#btn-share").bind(game.touchstart,function(e){
			$("#weixin").fadeIn(500);
			e.preventDefault();
		});
		$("#weixin").bind(game.touchstart,function(e){
			$("#weixin").fadeOut(500);
		});
	},
	start : function() {
		

		$("#tip").css({opacity:0,left:-10});
		
		$("#box1").css({left:-450,top:-50});
		$("#box2").css({left:-450,top:800});
		$("#box3").css({left:1100,top:-300});
		$("#box4").css({left:1100,top:420});
		$("#box5").css({left:1100,top:760,"z-index":2});

						
		setTimeout(function(){
			$("#box1").delay(400).animate(
				{
					left:-10,
					top:67
				},600,"easeOutQuint",function(){
					$("#tip").animate({opacity:1,left:0},500);
				}
			);
			$("#box2").delay(300).animate(
				{
					left:-20,
					top:455
				},600,"easeOutQuint"
			);
			$("#box3").delay(200).animate(
				{
					left:274,
					top:0
				},600,"easeOutQuint"
			);
			$("#box4").delay(100).animate(
				{
					left:356,
					top:418
				},600,"easeOutQuint"
			);
			$("#box5").animate(
				{
					left:163,
					top:325
				},600,"easeOutQuint"
			);
		},500);
		
		$('#homepage').fadeOut(1000,function(){
			
		});
		$('#move').css({top:0}).show();
		
	},
	move : function() {
		
		var tempX = tempY = curX = curY = mX = mY = 0;
		var startTime=10;
		var speed = 10;
		var touchLock = false;
		$(".box").bind(game.touchstart,function(e){
			var touch = game.touchstart == "touchstart" ? event.touches[0] : window.event || e ;
			touchLock = true;
			if(game.lock && touchLock){
				startTime = new Date().getTime();
				$(this).css({"z-index":10});
				//curX = parseInt($(this).attr("mX")) || 0;
				//curY = parseInt($(this).attr("mY")) || 0;
				tempX = touch.pageX;
				tempY = touch.pageY;
				
			}
			e.preventDefault();
		});
		$(".box").bind(game.touchmove,function(e){
			var touch = game.touchstart == "touchstart" ? event.touches[0] : e ;
			if(game.lock && touchLock){
				mX = touch.pageX-tempX;
				mY = touch.pageY-tempY;
				$(this).attr({"mX":mX,"mY":mY,"curX":curX,"curY":curY}).css("-webkit-transform","translate(" + mX + "px," + mY + "px)");
			}
			
		});
		$(".box").bind(game.touchend,function(e){
			if(game.lock && touchLock){
					speed = new Date().getTime() - startTime;
					speed = speed < 100 ? 100 : speed;
					speed = speed > 300 ? 300 : speed;
					game.num += 1;
					
					game.lock = false;
					var id = $(this).attr("data");
					var rX = mX > 0 ? "R" : "L";
					var rY = mY > 0 ? "B" : "T";
					var ratio = 5;
					if(Math.abs(mX) > Math.abs(mY)){
						ratio = 800 / Math.abs(mX);
					}else{
						ratio = 800 / Math.abs(mY);
					}
					mX *= ratio;
					mY *= ratio;

					$(this).transition({"x":mX,"y":mY,opacity:0},speed,function(){
						$(this).hide().css("-webkit-transform","translate(0,0)");	
						$(this).css({"z-index":1});
					});
					
					if(mX < 30 && mX > -30){
						connect.send(["pageID",id+rY].join('|')); // 发送标准信息
					}else if(mY < 30 && mY > -30){
						connect.send(["pageID",id+rX].join('|')); // 发送标准信
					}else{
						connect.send(["pageID",id+rX+rY].join('|')); // 发送标准信
					}
		
					
					if(game.num >= 5){
						$(".box").fadeOut(500);
						$("#tip").animate({opacity:0,left:-10},500);
						$("#btn-continue").fadeIn(800);
					}
					touchLock = false;
			}
		});
		
	},
	closeFlash : function() {
		$("#homepage").hide();
		$("#move").hide();
		$("#tab").hide();
		$("#end").css({top:0}).show();
		$("#btn-share,#btn-restart,#btn-end").hide();
		$("#ebg").animate({opacity:1},900);
		$("#elogo").delay(500).fadeIn(500);
		$("#p").delay(100).animate({opacity:1,left:384},800);
	},
	end : function (){
		$("#end").css({top:0}).show();
		$("#ebg").css({opacity:0});
		
		$("#elogo").hide();
		$("#p").css({opacity:0,left:390});
		$("#btn-share,#btn-restart,#btn-end").css({opacity:0});
		$("#tab").fadeOut(800,function(){
			$("#ebg").animate({opacity:1},900);
			$("#elogo").delay(500).fadeIn(500);
			$("#p").delay(100).animate({opacity:1,left:384},800);
			$("#btn-share,#btn-restart,#btn-end").delay(500).animate({opacity:1},600);
		});
		$("#tip").show();
		$(".box").attr({"mX":0,"mY":0,"curX":0,"curY":0}).css({opacity:1}).show();
	},
	complete : function() {
		connect.send(["std",4].join('|')); // 发送标准信息
		$("#btn-share,#btn-restart,#btn-end").fadeOut(800);
		window.close();
	},
	restart : function() {
		connect.send(["Reset"].join('|')); // 发送标准信息
		game.num = 0;
		$("#hand").css("-webkit-transform","rotate(-29deg)");
		$("#move").css({top:0}).fadeIn(500);
		$("#end").fadeOut(1000);
		game.start();
	},
	connPrepare : function (){
		
        require.config({
            paths: {
                'muses': 'http://ecma.bdimg.com/lego-mat/muses'
            }
        });
        // 加载Connect模块
        require(['muses/connect'], function(Connect) {
            var matches = window.location.href.match(/(?:\?|&)muses_scepter=([^&]+)/);
            var token = matches && matches.length >= 2 ? matches[1] : null;
            window.connect = new Connect();
            connect.connectWith(token)
                .then(function() {
                    //_log('[INFO] 连接成功，token: ' + token);
					connect.send(['std', 1].join('|'));// 发送标准信息
                   // game.start();
                    connect.onMessage = function(actions) {// 接收信息
						if(actions=="loadEnd"){
							game.start();
						}
						if(actions == "PicEnd"){
							game.lock = true;
						}
						if(actions == "closeFlash"){
							connect.destroy();
							game.closeFlash();
						}
                    }
                })
                .fail(function(err) {
                    connect.destroy();
                    //_log('[FAIL] 连接游戏失败，' + (err ? err : ''));
                });
            connect.onTokenExpired = function() {
               // _log('连接超时');
                connect.destroy();
            }
        });
		
		
	}
}


$(function (){
	game.init();	
	slightMovement.initSlightMovement();
});
function GetRandomNum(Min,Max)
{   
	var Range = Max - Min;   
	var Rand = Math.random();   
	return(Min + Math.round(Rand * Range));   
} 


//左右移动slightMovement.ismove
var slightMovement = {
	ismove:true,
	initSlightMovement:function(){
		if (window.DeviceMotionEvent) { 
			slightMovement.addEvent(window,"devicemotion",slightMovement.deviceMotionHandler);
		}
	},
	addEvent:function(obj,type,fn){
		if(obj.attachEvent){
			obj['e' + type +fn] = fn;
			obj[type+fn] = function(){
				obj['e' + type + fn](window.event);
			}
			obj.attachEvent("on" + type,obj[type+fn]);
		}else{
			obj.addEventListener(type,fn,false);
		}
	},
	removeEvent:function(obj,type,fn){
		if ( obj.detachEvent ) { 
			obj.detachEvent( 'on'+type, obj[type+fn] ); 
			obj[type+fn] = null; 
		  } else {
			obj.removeEventListener( type, fn, false ); 
		  }
			
	},
	deviceMotionHandler:function(eventData){
		
		if(slightMovement.ismove){
			 var acceleration = eventData.accelerationIncludingGravity; 
			 var facingUp = -1; 
			 if (acceleration.z > 0) { 
				facingUp = +1; 
			 }    
			
			 var LR = Math.round(((acceleration.x) / 9.81) * -180); 
			 var TB = Math.round(((acceleration.y) / 9.81) * -180); 
			
				 if(LR < -50 ){
					 LR = LR < -50 ? -50 : LR;
				 }else if(LR > 50 ){
					  LR = LR > 50 ? 50 : LR;
				 }
				 if(TB < -50 ){
					 TB = TB < -50 ? -50 : TB;
				 }else if(TB > 50 ){
					  TB = TB > 50 ? 50 : TB;
				 }
				 $("#box1 img").stop().animate({"margin-left":-LR*0.5,"margin-top":-TB*0.6},200);
				 $("#box2 img").stop().animate({"margin-left":-LR*0.6,"margin-top":-TB*0.5},200);
				 $("#box3 img").stop().animate({"margin-left":-LR*0.8,"margin-top":-TB*0.8},200);
				 $("#box4 img").stop().animate({"margin-left":-LR*0.7,"margin-top":-TB*0.7},200);
				 $("#box5 img").stop().animate({"margin-left":-LR*0.9,"margin-top":-TB*0.9},200);
				 
		}else{
			$(".box:visible").stop();
		}
	}
};




