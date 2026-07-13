var searchVisible = false;
var promoSlide = 1;
var signupSlide = 1;
var uploadSlide = 1;
var dailyVisible = true;
var theaterVisible = false;
var slideoutVisible = false;
var browserPages = [
	"browserContentPicks",
	"browserContentPop",
	"browserContentSubs",
	"browserContentRec",
	"browserContentRand"
];
var browserButtons = [
	"browserNavPicks",
	"browserNavPop",
	"browserNavSubs",
	"browserNavRec",
	"browserNavRand"
];
var browserDel = [];
var browserDisp;

//Config

//PLAYER SIZE
//Use CSS syntax.
var standardWidth = "100%";
var standardHeight = "100%";
//var theaterWidth = "100%";
//var theaterHeight = "100%";

//KEYBOARD SHORTCUTS
//Set to mostly match YouTube.
//Use keycodes available here:
//https://css-tricks.com/snippets/javascript/javascript-keycodes/
var keyPlay = [32, 75];
var keyBack5 = [37];
var keySkip5 = [39];
var keyBack10 = [74];
var keySkip10 = [76];
var keyTheater = [84];
var keyFull = [70];
var keyUp = [38, 187];
var keyDown = [40, 189];
var keyMute = [77];
var keyCaptions = [67];
var keyCapUp = [61];
var keyCapDown = [173];
var key10Perc = [49];
var key20Perc = [50];
var key30Perc = [51];
var key40Perc = [52];
var key50Perc = [53];
var key60Perc = [54];
var key70Perc = [55];
var key80Perc = [56];
var key90Perc = [57];
var keyRestart = [48, 36];
var keyEnd = [35];
var keySlower = [188];
var keyFaster = [190];

//DEFAULT POSTER
//Fallback if an HTML5 poster is not found.
//Shown blurred when videoContainer
//has extra space. Low resolution
//is unnoticable, recommended.
var defaultPoster = "https://a.safe.moe/kXK5t.jpg";

//DEFAULT VOLUME
var currentVol = 1;

//Config End

var fade1000 = setTimeout((function() {
    $("#controls").addClass("hidden");
    $("#loaderContainer").css("cursor", "none");
    disable($("#speedPopup"));
    disable($("#captionsPopup"));
    disable($("#qualityPopup"));
}), 1000);

var fade2000 = setTimeout((function() {
    $("#controls").addClass("hidden");
    $("#loaderContainer").css("cursor", "none");
    disable($("#speedPopup"));
    disable($("#captionsPopup"));
    disable($("#qualityPopup"));
}), 2000);

var fademin1000 = setTimeout((function() {
    $("#controls").addClass("hidden");
    $("#loaderContainer").css("cursor", "none");
}), 1000);

var fademin2000 = setTimeout((function() {
    $("#controls").addClass("hidden");
    $("#loaderContainer").css("cursor", "none");
}), 2000);

function fade() {
    $("#controls").addClass("hidden");
    $("#loaderContainer").css("cursor", "none");
}

var player = document.getElementById("player");
var playerBackground = document.getElementById("playerBackground");

var fadeTime;
var over = false;
var overVol = false;
var behind = true;
var full = false;
var mouseDown = false;
var statusCheck;
var volume = false;
var speed = false;
var captions = false;
var quality = false;
var pending = true;
var beforeVol = currentVol;
var muted;
var duration;

var color = "#673AB7";
var colorBg = "#512DA8";

//var browserNavTop = 400;
//var browserNavState = "absolute";

//$("#content").scroll(function() {
//	var p = $("#content").scrollTop();
//	if (p >= browserNavTop) {
//		if (browserNavState == "absolute") {
//			browserNavState = "fixed";
//			$("#browserNav").addClass("fixed");
//		}
//	} else if (browserNavState == "fixed") {
//		browserNavState = "absolute";
//			$("#browserNav").removeClass("fixed");
//	}
//});

//$(0"#content").scroll((function() {
//    $('#topWrap').css('top', $(this).scrollTop() + "px");
//}));

function fixScroll() {
	var calcer = $("<div />");
	$("#content").append(calcer);
	var width = calcer.width();
	calcer.remove();
	$(".top-wrap").css("width", width + "px");
}

$("#titlebarSearchInput").focus();

$("#playerContainer").addClass("pending");

silentVol(currentVol);

//forcePlay();

//goTheater();

/*
if ($("#player").attr("poster") !== undefined) {
  $("#playerBackground").css(
    "background-image",
    "url(" + $("#player").attr("poster") + ")"
  );
} else {
  $("#playerBackground").css("background-image", "url(" + defaultPoster + ")");
}*/

$("#player").on("loadstart", (function(event) {
	$("#loaderContainer").addClass("visible");
}));

$("#player").on("canplay", (function(event) {
	$("#loaderContainer").removeClass("visible");
}));

function readyCheck() {
	if ($("#player").prop("readyState") <= 1) {
		$("#loaderContainer").addClass("visible");
	} else {
		$("#loaderContainer").removeClass("visible");
	}
}

$("#player").on("loadeddata", getDuration);
$("#player").on("loadeddata", updateTime);

function getDuration() {
	duration = player.duration;
}

statusCheck = setInterval((function() {
	if ($("#player").get(0).duration > 0) {
		$("#player, #controls").css("pointer-events", "auto");
	}
	updateProgress();
	readyCheck();
}), 500);

$("#player").click(toggleVideo);
$("#loaderContainer").click(toggleVideo);
$("#noticeContainer").click(toggleVideo);
$("#loader").click(toggleVideo);
$("#notice").click(toggleVideo);
$("#playpause").click(toggleVideo);

$("#playerContainer").mousemove((function() {
	$("#controls").removeClass("hidden");
	$("#loaderContainer").css("cursor", "default");
	clearTimeout(fadeTime);
	if (!player.paused) {
		fadeTime = fade2000;
	}
}));

$("#playerContainer").mouseleave((function() {
	if (!player.paused) {
		fadeTime = fade2000;
	} else {
		fadeTime = fade1000;
	}
}));

$("#progressholder").hover(
	(function(e) {
		if (behind) {
			$("#progressScrub").css("background", colorBg);
			$("#progressScrub").css("opacity", "1");
			$("#progress").css("background", color);
		} else {
			$("#progressScrub").css("background", color);
			$("#progressScrub").css("opacity", "1");
			$("#progress").css("background", colorBg);
		}
		clearInterval(status);
		over = true;
		//disable($("#speedPopup"));
		//disable($("#captionsPopup"));
		//disable($("#qualityPopup"));
		//
	}),
	(function() {
		$("#progressScrub").css("opacity", "0");
		$("#progress").css("background", color);
		status = setInterval(statusCheck, 500);
		over = false;
	})
);

$("#progressholder").mousedown((function() {
	mouseDown = true;
}));

$("#progressholder").mouseup(changePos);

function changePos(e) {
	mouseDown = false;
	var pos = e.pageX - $("#progressholder").offset().left - 7;
	var prop = (pos + 1) / $("#progressholder").width();
	var prog = prop * player.duration;
	if (prog < 0) {
		prog = 0;
	} else if (prog >= duration) {
		prog = duration - 1;
	}
	player.currentTime = prog;
	playerBackground.currentTime = prog;
	statusCheck;
}

$("#playerContainerf").dblclick(fullscreen);
$("#playerBackground").dblclick(fullscreen);
$("#player").dblclick(fullscreen);
$("#loaderContainer").dblclick(fullscreen);
$("#noticeContainer").dblclick(fullscreen);
$("#loader").dblclick(fullscreen);
$("#notice").dblclick(fullscreen);
$("#fullscreen").click(fullscreen);

function fullscreen() {
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	//
	if (theaterVisible == true) {
		goTheater();
	}
	speed = false;
	captions = false;
	quality = false;
	volume = false;

	hideSignup();
	hideLogin();
	hidePromo();
	hideUpload();
	if (!full) {
		full = !full;
		launchIntoFullscreen(document.getElementById("playerContainer"));
		$("#playerContainer").addClass("alternate");
		setTimeout((function() {
			$("#controls").css("bottom", $(window).height() - $("#player").offset().top - $("#player").height() + "px");
            $("#controls").css("width", $("#player").width() - 29 + "px");
            $("#controls").css("left", $("#player").offset().left + "px");
		}), 200);
		forcePlay();
	} else {
		full = !full;
		exitFullscreen(document.getElementById("playerContainer"));
		$("#playerContainer").removeClass("alternate");
		$("#controls").css("bottom", "0");
        $("#controls").css("left", "0px");
        setTimeout(function() {
            $("#controls").css("width", $("#player").width() - 29 + "px");
        }, 150);
	}
}

function launchIntoFullscreen(element) {
	$(element).css("width", "100%");
	$(element).css("height", "100%");
	$("#fullscreen").html("fullscreen_exit");
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if (element.msRequestFullscreen) {
		element.msRequestFullscreen();
	}
}

function exitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
	$("#playerContainer").css("width", standardWidth);
	$("#playerContainer").css("height", standardHeight);
	$("#fullscreen").html("fullscreen");
	$("#theater").html("swap_horizontal");
}

$("#progressholder").mousemove((function(e) {
	updateOrb(e);
}));

function toggleVideo() {
	$("#playerContainer").removeClass("pending");
	$("#playerContainer").removeClass("complete");
	pending = false;
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	//
	speed = false;
	captions = false;
	quality = false;
	volume = false;
	//We're playing
	if (!player.paused) {
		$("#controls").removeClass("hidden");
		$("#loaderContainer").css("cursor", "default");
		$("#playpause").html("play_arrow");
		player.pause();
		playerBackground.pause();
		notifly("<div class='notice material-icons' id='notice'>pause</div>");
	} else {
		fade();
		$("#player").css("cursor", "default");
		$("#playpause").html("pause");
		$("#titlebarSearchInput").blur();
		player.play();
		playerBackground.play();
		if (theaterVisible || full) {
			player.currentTime = player.currentTime;
			playerBackground.currentTime = player.currentTime;
		}
		notifly("<div class='notice material-icons' id='notice'>play_arrow</div>");
		$("#profileBackground").addClass("hidden");
		var hideBackground = setTimeout((function() {
			$("#profileBackground").css("display", "none");
		}), 500);
	}
}

$("#playerContainer").click((function() {
	if (pending == true) {
		forcePlay();
	}
}));

function forcePlay() {
	$("#playerContainer").removeClass("pending");
	$("#playerContainer").removeClass("complete");
	pending = false;
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	//
	speed = false;
	captions = false;
	quality = false;
	volume = false;
    fade();
	$("#playpause").html("pause");
	$("#titlebarSearchInput").blur();
	player.play();
	playerBackground.play();
	player.currentTime = player.currentTime;
	playerBackground.currentTime = player.currentTime;
	$("#profileBackground").addClass("hidden");
}

function updateProgress() {
	var bp = player.buffered.end(player.buffered.length - 1) / player.duration;
	var bw = bp * 100;
	$("#buffered").css("width", bw + "%");

	var p = player.currentTime / player.duration;
	var w = p * 100;

	$("#progress").css("width", w + "%");
	updateTime();

	if (player.ended) {
		pending = true;
		$("#playerContainer").addClass("complete");
		$("#playerContainer");
		$("#playpause").html("replay");
		//$("#controls").removeClass("hidden");
		//$("#loaderContainer").css("cursor", "default");
		clearTimeout(fadeTime);
	}
}

function updateOrb(e) {
	var pos = e.pageX - $("#progressholder").offset().left - 7;
	var prop = pos / $("#progressholder").width();
	var prog = prop * player.duration;
	if (behind) {
		if (prog > player.currentTime) {
			$("#progressScrub").css("background", color);
			$("#progressScrub").css("opacity", "1");
			$("#progress").css("background", colorBg);
			$("#progress").css("z-index", "13");
			behind = !behind;
		}
	} else if (prog < player.currentTime) {
		$("#progress").css("background", color);
		$("#progressScrub").css("background", colorBg);
		$("#progressScrub").css("opacity", "1");
		$("#progress").css("z-index", "11");
		behind = !behind;
	}
	if (prog >= 0 && prog <= player.duration) {
		$("#progressorb").css("margin-left", pos + "px");
		$("#progressScrub").css("width", prop * 100 + "%");
		$("#progresstime").text(
			prog.toString().toHHMMSS() + " / " + player.duration.toString().toHHMMSS()
		);
	}
}

function updateTime() {
	$("#progresstime").text(
		player.currentTime.toString().toHHMMSS() +
		" / " +
		player.duration.toString().toHHMMSS()
	);
	var ltQual = $("#quality").offset().left - $("#player").offset().left;
	var ltCap = $("#captions").offset().left - $("#player").offset().left;
	var ltSpeed = $("#speed").offset().left - $("#player").offset().left;
	//var ltVol = $("#volume").offset().left - $("#player").offset().left;
	$("#qualityPopup").css("left", ltQual - 37 + "px");
	$("#captionsPopup").css("left", ltCap - 40 + "px");
	$("#speedPopup").css("left", ltSpeed - 35 + "px");
	//$("#volumeHolder").css("left", ltVol + 4 + "px");
}

status = setInterval(statusCheck, 500);

var sync = setInterval(syncCheck, 2000);

function syncCheck() {
	if (theaterVisible || full) {
		if (playerBackground.currentTime <= player.currentTime - 0.1 || playerBackground.currentTime >= player.currentTime + 0.1) {
			player.currentTime = player.currentTime;
			playerBackground.currentTime = player.currentTime;
		}
	}
}

String.prototype.toHHMMSS = function() {
	var sec_num = parseInt(this, 10);
	var minutes = Math.floor(sec_num / 60);
	var seconds = sec_num - minutes * 60;

	if (seconds < 10) {
		seconds = "0" + seconds;
	}
	var time = minutes + ":" + seconds;
	return time;
};

$("#speed").click(displaySpeed);

$("#theater").click(goTheater);

function displaySpeed() {
	if (!speed) {
		$("#speedPopup").css("display", "block");
		setTimeout((function() {
			$("#speedPopup").removeClass("hidden");
		}), 50);
		disable($("#captionsPopup"));
		disable($("#qualityPopup"));
		//
		captions = false;
		quality = false;
		volume = false;
		speed = !speed;
	} else {
		disable($("#speedPopup"));
		speed = !speed;
	}
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
}

$("#captions").click(displayCaptions);

function displayCaptions() {
	if (!captions) {
		$("#captionsPopup").css("display", "block");
		setTimeout((function() {
			$("#captionsPopup").removeClass("hidden");
		}), 50);
		disable($("#speedPopup"));
		disable($("#qualityPopup"));
		//
		speed = false;
		quality = false;
		captions = !captions;
	} else {
		disable($("#captionsPopup"));
		captions = !captions;
	}
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
}

$("#quality").click(displayQuality);

function displayQuality() {
	if (!quality) {
		$("#qualityPopup").css("display", "block");
		setTimeout((function() {
			$("#qualityPopup").removeClass("hidden");
		}), 50);
		disable($("#speedPopup"));
		disable($("#captionsPopup"));
		//
		speed = false;
		captions = false;
		volume = false;
		quality = !quality;
	} else {
		disable($("#qualityPopup"));
		quality = !quality;
	}
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
}

function disable(element) {
	element.addClass("hidden");
	setTimeout((function() {
		element.css("display", "none");
	}), 150);
}

function goTheater() {
	exitFullscreen();
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	//

	volume = false;
	speed = false;
	captions = false;
	quality = false;

	hideSignup();
	hideLogin();
	hidePromo();
	hideUpload();

	if (full == true) {
		fullscreen();
		setTimeout((function() {
			toggleTheater();
		}), 150);
	} else {
		toggleTheater();
	}
}

function setSpeed(rate, entry) {
	player.playbackRate = rate;
	playerBackground.playbackRate = rate;
	$("#speedPopup > .player-popup-entry").removeClass("active");
	entry.addClass("active");
	notifly("<div class='notice' id='notice'>" + rate + "x</div>");
	if (rate == 2) {
		$("#speed").css("color", "#00e676");
		$("#speed").addClass("active");
	} else if (rate == 1.5) {
		$("#speed").css("color", "#69f0ae");
		$("#speed").addClass("active");
	} else if (rate == 1.25) {
		$("#speed").css("color", "#b9f6ca");
		$("#speed").addClass("active");
	} else if (rate == 1) {
		$("#speed").css("color", "#d3d3d3");
		$("#speed").removeClass("active");
	} else if (rate == 0.5) {
		$("#speed").css("color", "#8F62DF");
		$("#speed").addClass("active");
	} else {
		$("#speed").css("color", "#673AB7");
		$("#speed").addClass("active");
	}
}

function notifly(message) {
	$("#noticeContainer").html(message);
	setTimeout(clearNotice, 500);
}

function notistay(message) {
	$("#noticeContainer").html(message);
}

function clearNotice() {
	$("#noticeContainer").html("");
}

$(window).keydown((function(e) {
	if ($("input:focus").length === 0 & $("textarea:focus").length === 0) {
		var key = e.which;
		if (keyPlay.includes(key)) {
			toggleVideo();
		} else if (keyBack5.includes(key)) {
			jumpTo(player.currentTime - 5);
			notifly(
				"<div class='notice material-icons' id='notice' style='font-weight:normal'>replay_5</div>"
			);
		} else if (keySkip5.includes(key)) {
			jumpTo(player.currentTime + 5);
			notifly(
				"<div class='notice material-icons' id='notice' style='font-weight:normal'>forward_5</div>"
			);
		} else if (keyBack10.includes(key)) {
			jumpTo(player.currentTime - 10);
			notifly(
				"<div class='notice material-icons' id='notice' style='font-weight:normal'>replay_10</div>"
			);
		} else if (keySkip10.includes(key)) {
			jumpTo(player.currentTime + 10);
			notifly(
				"<div class='notice material-icons' id='notice' style='font-weight:normal'>forward_10</div>"
			);
		} else if (keyTheater.includes(key)) {
			goTheater();
		} else if (keyFull.includes(key)) {
			fullscreen();
		} else if (keyUp.includes(key)) {
			setVol(currentVol + 0.1);
		} else if (keyDown.includes(key)) {
			setVol(currentVol - 0.1);
		} else if (keyMute.includes(key)) {
			setVol(beforeVol * muted);
		} else if (keyCaptions.includes(key)) {
			toggleCaptions();
		} else if (keyCapUp.includes(key)) {
			capUp();
		} else if (keyCapDown.includes(key)) {
			capDown();
		} else if (key10Perc.includes(key)) {
			jumpTo(10 * duration / 100);
			notifly("<div class='notice' id='notice'>10%</div>");
		} else if (key20Perc.includes(key)) {
			jumpTo(20 * duration / 100);
			notifly("<div class='notice' id='notice'>20%</div>");
		} else if (key30Perc.includes(key)) {
			jumpTo(30 * duration / 100);
			notifly("<div class='notice' id='notice'>30%</div>");
		} else if (key40Perc.includes(key)) {
			jumpTo(40 * duration / 100);
			notifly("<div class='notice' id='notice'>40%</div>");
		} else if (key50Perc.includes(key)) {
			jumpTo(50 * duration / 100);
			notifly("<div class='notice' id='notice'>50%</div>");
		} else if (key60Perc.includes(key)) {
			jumpTo(60 * duration / 100);
			notifly("<div class='notice' id='notice'>60%</div>");
		} else if (key70Perc.includes(key)) {
			jumpTo(70 * duration / 100);
			notifly("<div class='notice' id='notice'>70%</div>");
		} else if (key80Perc.includes(key)) {
			jumpTo(80 * duration / 100);
			notifly("<div class='notice' id='notice'>80%</div>");
		} else if (key90Perc.includes(key)) {
			jumpTo(90 * duration / 100);
			notifly("<div class='notice' id='notice'>90%</div>");
		} else if (keyRestart.includes(key)) {
			jumpTo(0);
			notifly("<div class='notice material-icons' id='notice'>replay</div>");
		} else if (keyEnd.includes(key)) {
			jumpTo(duration - 1);
			notifly("<div class='notice material-icons' id='notice'>skip_next</div>");
		} else if (keySlower.includes(key)) {
			if (player.playbackRate >= 2) {
				setSpeed(1.5, $("#speedPopupEntry-15"));
			} else if (player.playbackRate == 1.5) {
				setSpeed(1.25, $("#speedPopupEntry-125"));
			} else if (player.playbackRate == 1.25) {
				setSpeed(1, $("#speedPopupEntry-1"));
			} else if (player.playbackRate == 1) {
				setSpeed(0.5, $("#speedPopupEntry-5"));
			} else if (player.playbackRate == 0.5) {
				setSpeed(0.25, $("#speedPopupEntry-25"));
			}
			disable($("#speedPopup"));
			speed = false;
		} else if (keyFaster.includes(key)) {
			if (player.playbackRate <= 0.25) {
				setSpeed(0.5, $("#speedPopupEntry-5"));
			} else if (player.playbackRate == 0.5) {
				setSpeed(1, $("#speedPopupEntry-1"));
			} else if (player.playbackRate == 1) {
				setSpeed(1.25, $("#speedPopupEntry-125"));
			} else if (player.playbackRate == 1.25) {
				setSpeed(1.5, $("#speedPopupEntry-15"));
			} else if (player.playbackRate == 1.5) {
				setSpeed(2, $("#speedPopupEntry-2"));
			}
			disable($("#speedPopup"));
			speed = false;
		}
	}
}));

function setVol(vol) {
	if (vol >= 1) {
		vol = 1;
		$("#volumeUp").addClass("active");
		$("#volumeDown").removeClass("active");
		beforeVol = vol;
		notifly("<div class='notice material-icons' id='notice'>volume_up</div>");
	} else if (vol <= 0) {
		$("#volumeUp").removeClass("active");
		$("#volumeDown").removeClass("active");
		vol = 0;
		notifly("<div class='notice material-icons' id='notice'>volume_mute</div>");
		$("#volumeDown").html("volume_down");
		$("#volumeDown").addClass("active");
	} else if (vol > currentVol) {
		$("#volumeUp").removeClass("active");
		$("#volumeDown").removeClass("active");
		beforeVol = vol;
		notifly("<div class='notice material-icons' id='notice'>volume_up</div>");
	} else {
		$("#volumeUp").removeClass("active");
		$("#volumeDown").removeClass("active");
		beforeVol = vol;
		notifly("<div class='notice material-icons' id='notice'>volume_down</div>");
	}
	if (vol.toFixed(1) <= 0.1) {
		$("#volumeDown").html("volume_mute");
	} else {
		$("#volumeDown").html("volume_down");
	}
	currentVol = vol;
	silentVol(currentVol);
}

function silentVol(vol) {
	$("#volumeMeter").css(
		"height",
		currentVol * $("#volumeHolder").height() - 4 + "px"
	);
	$("#volumeOrb").css(
		"bottom",
		currentVol * $("#volumeHolder").height() - 4 + "px"
	);
	$("#player").prop("volume", currentVol);
	if (currentVol === 0) {
		muted = 1;
	} else if (currentVol >= 0.6) {
		muted = 0;
	} else {
		muted = 0;
	}
	$("#volume").html((currentVol * 10).toFixed(0));
}

function jumpTo(jumpPos) {
	$("#playerContainer").removeClass("pending");
	$("#playerContainer").removeClass("complete");
	pending = false;
	if (jumpPos < 0) {
		jumpPos = 0;
	} else if (jumpPos > duration) {
		jumpPos = duration;
	}
	player.play();
	playerBackground.play();
	player.currentTime = jumpPos;
	playerBackground.currentTime = jumpPos;
}

function toggleCaptions() {}

function capUp() {}

function capDown() {}

$("#volumeWrap").mousewheel((function(e) {
	setVol(currentVol + 0.1 * e.deltaY);
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
}));

$("#loaderContainer").mousewheel((function(e) {
	setVol(currentVol + 0.1 * e.deltaY);
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
}));

$("#noticeContainer").mousewheel((function(e) {
	setVol(currentVol + 0.1 * e.deltaY);
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
}));

$("#speed").mousewheel((function(e) {
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));

	if (e.deltaY > 0) {
		if (player.playbackRate <= 0.25) {
			setSpeed(0.5, $("#speedPopupEntry-5"));
		} else if (player.playbackRate == 0.5) {
			setSpeed(1, $("#speedPopupEntry-1"));
		} else if (player.playbackRate == 1) {
			setSpeed(1.25, $("#speedPopupEntry-125"));
		} else if (player.playbackRate == 1.25) {
			setSpeed(1.5, $("#speedPopupEntry-15"));
		} else if (player.playbackRate == 1.5) {
			setSpeed(2, $("#speedPopupEntry-2"));
		}
	} else {
		if (player.playbackRate >= 2) {
			setSpeed(1.5, $("#speedPopupEntry-15"));
		} else if (player.playbackRate == 1.5) {
			setSpeed(1.25, $("#speedPopupEntry-125"));
		} else if (player.playbackRate == 1.25) {
			setSpeed(1, $("#speedPopupEntry-1"));
		} else if (player.playbackRate == 1) {
			setSpeed(0.5, $("#speedPopupEntry-5"));
		} else if (player.playbackRate == 0.5) {
			setSpeed(0.25, $("#speedPopupEntry-25"));
		}

	}
}));

$("#speedPopup").mousewheel((function(e) {
	clearTimeout(fadeTime);
	fadeTime = fademin2000;
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));

	if (e.deltaY > 0) {
		if (player.playbackRate <= 0.25) {
			setSpeed(0.5, $("#speedPopupEntry-5"));
		} else if (player.playbackRate == 0.5) {
			setSpeed(1, $("#speedPopupEntry-1"));
		} else if (player.playbackRate == 1) {
			setSpeed(1.25, $("#speedPopupEntry-125"));
		} else if (player.playbackRate == 1.25) {
			setSpeed(1.5, $("#speedPopupEntry-15"));
		} else if (player.playbackRate == 1.5) {
			setSpeed(2, $("#speedPopupEntry-2"));
		}
	} else {
		if (player.playbackRate >= 2) {
			setSpeed(1.5, $("#speedPopupEntry-15"));
		} else if (player.playbackRate == 1.5) {
			setSpeed(1.25, $("#speedPopupEntry-125"));
		} else if (player.playbackRate == 1.25) {
			setSpeed(1, $("#speedPopupEntry-1"));
		} else if (player.playbackRate == 1) {
			setSpeed(0.5, $("#speedPopupEntry-5"));
		} else if (player.playbackRate == 0.5) {
			setSpeed(0.25, $("#speedPopupEntry-25"));
		}

	}
}));

//$("#volumeHolder").mousewheel(function(e) {
//  setVol(currentVol + 0.1 * e.deltaY);
//  clearTimeout(fadeTime);
//  fadeTime = fademin2000;
//});

$("#volumeUp").mousedown((function(e) {
	if (e.which == 2) {
		setVol(1);
	} else {
		setVol(currentVol + 0.1);
	}
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));

	return true;
}));

$("#volumeUp").on("tripleclick", {
	threshold: 350
}, (function() {
	setVol(1);
}));

$("#volumeDown").mousedown((function(e) {
	if (e.which == 2) {
		setVol(0);
	} else {
		setVol(currentVol - 0.1);
	}
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));

	return true;
}));

$("#volumeDown").on("tripleclick", {
	threshold: 350
}, (function() {
	setVol(0);
}));

function displayVolume() {
	if (!volume) {
		$("#volumeHolder").removeClass("hidden");
		disable($("#speedPopup"));
		disable($("#captionsPopup"));
		disable($("#qualityPopup"));
		speed = false;
		captions = false;
		quality = false;
		volume = !volume;
	} else {

		volume = !volume;
	}
}

$("#volumeHolder").mouseup((function(e) {
	var pos =
		e.pageY -
		($("#volumeHolder").offset().top + $("#volumeHOlder").outerHeight()) -
		7;
	var prop = pos / $("#volumeHolder").height();
	var prog = 1 - prop - 0.14;
	setVol(prog);
}));

function setCaptions(caption, title, entry) {
	$("#captionsPopup > .player-popup-entry").removeClass("active");
	entry.addClass("active");
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	disable($("volumeHolder"));
	speed = false;
	captions = false;
	quality = false;
	volume = false;
	if (caption == "none") {
		$("#captions").removeClass("active");
		notifly("<div id='notice' class='notice material-icons'>close</div>");
	} else {
		$("#captions").addClass("active");
		notifly("<div id='notice' class='notice'>" + title + "</div>");
		$("#subtitles").attr("src", caption);
		$("#subtitles").mode = "visible";
	}
}

function toggleCaptions() {}

function setQuality(qual, entry) {
	$("#qualityPopup > .player-popup-entry").removeClass("active");
	entry.addClass("active");
	disable($("#speedPopup"));
	disable($("#captionsPopup"));
	disable($("#qualityPopup"));
	disable($("volumeHolder"));
	speed = false;
	captions = false;
	quality = false;
	volume = false;
	if (qual >= 720) {
		$("#quality").addClass("active");
	} else {
		$("#quality").removeClass("active");
	}
	if (qual === 0) {
		//Auto quality function
		notifly("<div id='notice' class='notice'>Auto</div>");
	} else {
		notifly("<div id='notice' class='notice'>" + qual + "p</div>");
	}
}

const promovid = document.querySelector("video");
if (window.matchMedia("(prefers-reduced-motion)").matches) {
	promovid.removeAttribute("autoplay");
	promovid.pause();
}



window.onresize = function() {
	$(".signup .signup-color-picker-item").css(
		"height",
		$(".signp .signup-color-picker-item").width() + "px"
	);
};

$(".slideout .signup-color-picker-item").css(
	"height",
	$(".slideout .signup-color-picker-item").width() + "px"
);

window.onresize = function() {
	$(".slideout .signup-color-picker-item").css(
		"height",
		$(".slideout .signup-color-picker-item").width() + "px"
	);
};

function nextPromo() {
	if (promoSlide == 4) {
		promoSlide = 1;
	} else {
		promoSlide++;
	}
	if (promoSlide == 4) {
		$("#promoverlayNext").html(" <i class='material-icons'>replay</i>");
	} else {
		$("#promoverlayNext").html(" <i class='material-icons'>navigate_next</i>");
	}
	for (i = 0; i <= 4; i++) {
		if (promoSlide == i) {
			$("#promoverlay" + i).addClass("active");
		} else {
			$("#promoverlay" + i).removeClass("active");
			$("#promoverlay" + i).removeClass("alternate");
		}
	}
}

//$("#uploadNext").click(nextUpload);
//$("#uploadPrev").click(prevUpload);

function nextSignup() {
	if (signupSlide == 3) {
		$("#signupPrev").css("right", "90px");
		$("#signupNext").removeClass("active");
		submitSignup();
	}
	signupSlide++;
	$("#signupProgressBar").css("width", (signupSlide - 1) * 34 + "%");
	$("#signupPrev").addClass("active");
	for (i = 0; i <= 4; i++) {
		if (signupSlide == i) {
			$("#signup" + i).addClass("active");
		} else {
			$("#signup" + i).removeClass("active");
			$("#signup" + i).removeClass("alternate");
		}
	}
}

function prevSignup() {
	if (signupSlide > 1) {
		signupSlide--;
		if (signupSlide == 1) {
			$("#signupPrev").removeClass("active");
		}
	}
	$("#signupProgressBar").css("width", (signupSlide - 1) * 34 + "%");
	$("#signupNext").addClass("active");
	$("#signupPrev").css("right", "160px");
	for (i = 0; i <= 4; i++) {
		if (signupSlide == i) {
			$("#signup" + i).addClass("active");
			$("#signup" + i).addClass("alternate");
		} else {
			$("#signup" + i).removeClass("active");
			$("#signup" + i).removeClass("alternate");
		}
	}
}

var selected = $('.selected');
var dropdown = $('.dropdown-list');
var optionList = $('.dropdown-list li');

selected.click((function() {
	dropdown.toggleClass('active');
	$(".selected").removeClass("pre");

	if (dropdown.hasClass('active')) {
		optionList.click((function() {

			if (optionList.hasClass('active')) {
				$(this).siblings().removeClass('active');
			} else {
				$(this).addClass('active');
			}
			dropdown.removeClass('active');
			selected.children('span').html($(this).html());
		}))
	}
}))

function nextUpload() {
	if (uploadSlide == 2) {
		$("#uploadPrev").css("right", "90px");
		$("#uploadNext").removeClass("active");
		submitUpload();
	}
	uploadSlide++;
	$("#uploadProgressBar").css("width", (uploadSlide - 1) * 50 + "%");
	$("#uploadPrev").addClass("active");
	for (i = 0; i <= 3; i++) {
		if (uploadSlide == i) {
			$("#upload" + i).addClass("active");
		} else {
			$("#upload" + i).removeClass("active");
			$("#upload" + i).removeClass("alternate");
		}
	}
}

function prevUpload() {
	if (uploadSlide > 1) {
		uploadSlide--;
		if (uploadSlide == 1) {
			$("#uploadPrev").removeClass("active");
		}
	}
	$("#uploadProgressBar").css("width", (uploadSlide - 1) * 50 + "%");
	$("#uploadNext").addClass("active");
	$("#uploadPrev").css("right", "160px");
	for (i = 0; i <= 3; i++) {
		if (uploadSlide == i) {
			$("#upload" + i).addClass("active");
			$("#upload" + i).addClass("alternate");
		} else {
			$("#upload" + i).removeClass("active");
			$("#upload" + i).removeClass("alternate");
		}
	}
}

if (Cookies.get("dailyVisible") == "false") {
	hidePromo();
	toggleDaily();
}

switchPage(Cookies.get("currentPage") || "browserContentPicks");

function toggleSearch() {
	if (searchVisible) {
		$("#titlebarSearch").addClass("hidden");
		searchVisible = false;
	} else {
		$("#titlebarSearchInput").focus();
		$("#titlebarSearch").removeClass("hidden");
		searchVisible = true;
	}
}

//$("#titlebarSearchInput").focus();

$("#titlebarSearchInput").keydown((function(e) {
	if ($("#titlebarSearchInput").val() !== "") {
		searchVisible = false;
		toggleSearch();
	}
	var key = e.keyCode || e.which;
	if (key == 27) {
		searchVisible = true;
		toggleSearch();
	} else if (key == 8 && $("#titlebarSearchInput").val() === "") {
		searchVisible = true;
		toggleSearch();
	}
}));

$("#titlebarSearchInput").focusout((function() {
	searchVisible = true;
	toggleSearch();
}));

function hidePromo() {
	$("#promoverlay").removeClass("active");
}

function showPromo() {
	$("#promoverlay").addClass("active");
}

function showSignup() {
	dailyVisible = false;
	toggleDaily();
	$("#playpause").html("play_arrow");
	player.pause();
	playerBackground.pause();
	$("#login").removeClass("active");
	$("#upload").removeClass("active");
	$("#signup").addClass("active");
	$("#signupProgressBar").css("width", (signupSlide - 1) * 50 + "%");
}

$("#titlebarPost").click(showUpload);

function showUpload() {
	dailyVisible = false;
	toggleDaily();
	$("#playpause").html("play_arrow");
	player.pause();
	playerBackground.pause();
	$("#login").removeClass("active");
	$("#signup").removeClass("active");
	$("#upload").addClass("active");
	$("#uploadProgressBar").css("width", (uploadSlide - 1) * 50 + "%");
	slideoutVisible = true;
	toggleSlideout();
}

function hideSignup() {
	$("#signup").removeClass("active");
	$("#signupProgressBar").css("width", "0");
}

function hideUpload() {
	$("#upload").removeClass("active");
	$("#uploadProgressBar").css("width", "0");
}

function submitSignup() {}

function submitUpload() {}

function showLogin() {
	dailyVisible = false;
	toggleDaily();
	$("#playpause").html("play_arrow");
	player.pause();
	playerBackground.pause();
	$("#signup").removeClass("active");
	$("#upload").removeClass("active");
	$("#login").addClass("active");
	// Fixed: loginSlide was not defined - removed this line as it's not needed for React version
	// $("#loginProgressBar").css("width", (loginSlide - 1) * 50 + "%");
}

function hideLogin() {
	$("#login").removeClass("active");
}

function submitLogin() {}
function subscribe(){}
function toggleDaily() {
	if (theaterVisible) {
		goTheater();
	} else if (dailyVisible) {
		$("#content").addClass("alternate");
		$("#titlebarDaily").removeClass("hidden");
		dailyVisible = false;
		$("#controls").removeClass("hidden");
		$("#loaderContainer").css("cursor", "default");
		$("#playpause").html("play_arrow");
		player.pause();
		playerBackground.pause();
		//Cookies.set("dailyVisible", false, {
		//	expires: 1
		//});
	} else {
		$("#content").removeClass("alternate");
		$("#titlebarDaily").addClass("hidden");
		dailyVisible = true;
	}
	$("#content").animate({
		scrollTop: 0
	}, 150);
}

function toggleSlideout() {
	if (slideoutVisible) {
		$("#slideout").addClass("hidden");
		$("#shadow").addClass("hidden");
		setTimeout((function() {
			$("#shadow").css("display", "none");
		}), 150);
		slideoutVisible = false;
	} else {
		$("#slideout").removeClass("hidden");
		setTimeout((function() {
			$("#shadow").removeClass("hidden");
		}), 50);
		$("#shadow").css("display", "block");
		slideoutVisible = true;
	}
}

function switchPage(page) {
	browserDel = [];
	for (i = 0; i < browserPages.length; i++) {
		if (browserPages[i] == page) {
			$("#" + browserPages[i]).css("display", "block");
			browserDisp = browserPages[i];
			setTimeout((function() {
				$("#" + browserDisp).removeClass("hidden");
			}), 50);
			$("#" + browserButtons[i]).addClass("active");
			Cookies.set("currentPage", browserPages[i]);
		} else {
			browserDel.push(browserPages[i]);
			$("#" + browserPages[i]).addClass("hidden");
			$("#" + browserButtons[i]).removeClass("active");
		}
		setTimeout((function() {
			for (i = 0; i < browserDel.length; i++) {
				$("#" + browserDel[i]).css("z-index", "0");
			}
		}), 150);
	}
}

$("#signupManual").click((function() {
	$("#signupAccountBack").addClass("active");
	$("#signupPassword").addClass("active");
	$("#signupManual").addClass("hidden");
	$("#signupGoogle").addClass("hidden");
	$("#signupDropbox").addClass("hidden");
	$("#signupFacebook").addClass("hidden");
}));

$("#signupManual").click((function() {
	$("#signupAccountBack").addClass("active");
	$("#signupPassword").addClass("active");
	$("#signupManual").addClass("hidden");
	$("#signupGoogle").addClass("hidden");
	$("#signupDropbox").addClass("hidden");
	$("#signupFacebook").addClass("hidden");
}));

$("#signupAccountBack").click((function() {
	$("#signupAccountBack").removeClass("active");
	$("#signupPassword").removeClass("active");
	$("#signupManual").removeClass("hidden");
	$("#signupGoogle").removeClass("hidden");
	$("#signupDropbox").removeClass("hidden");
	$("#signupFacebook").removeClass("hidden");
}));

$("#signupManualInput").keyup((function() {
	setTimeout((function() {
		$("#signupNext").addClass("notify");
	}), 3000);
}));

$("#signupPassword").keyup((function(e) {
	if (e.which == 13) {
		nextSignup();
	}
}));

function navigate() {
	var item = $(this);
	var link = item.attr("data-href");
	$(item).addClass("active");
	hideSignup();
	hidePromo();
	hideLogin();
	hideUpload();
	dailyVisible = false;
	toggleDaily();
	$("#dailyTitle").html($(item).find(".browser-content-item-title").html());
	$("#dailyDesc").html($(item).find(".browser-content-item-desc").html());
	$("#dailyUser span").html(
		$(item).find(".browser-content-item-user span").html()
	);
	$("#dailyViews span").html(
		$(item).find(".browser-content-item-views span").html()
	);
	$("#dailyRating span").html(
		$(item).find(".browser-content-item-rating span").html()
	);
	if ($(item).find(".browser-content-item-pick").html() === "") {
		$("#dailyLabel").html("");
	} else {
		$("#dailyLabel span").html($(item).find(".browser-content-item-pick").html());
	}
	$("#content").animate({
		scrollTop: 0
	}, 150);
	forcePlay();
}

$(".signup-color-picker-item").click((function() {
	$(".signup-color-picker-item").removeClass("active");
	$(this).addClass("active");
	changeTheme($(this).css("background-color"));
}));

$("#customColorPickInput").change((function() {
	$("#customColorPick").css("background", $("#customColorPickInput").val());
	changeTheme($("#customColorPick").css("background-color"));
}));

function changeTheme(newColor) {
	newColorRgb = newColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	newColorBgRgb = newColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
	newColorBgRgb[1] -= 22;
	newColorBgRgb[2] -= 13;
	newColorBgRgb[3] -= 15;
	for (i = 1; i < 4; i++) {
		if (newColorBgRgb[i] < 0) {
			newColorBgRgb[i] = 0;
		}
	}
	newColorBg = "rgb(" + newColorBgRgb[1] + "," + newColorBgRgb[2] + "," + newColorBgRgb[3] + ")";
	color = newColor;
	colorBg = newColorBg;
	var luma = 0.2126 * newColorRgb[1] + 0.7152 * newColorRgb[2] + 0.0722 * newColorRgb[3];
	if (luma >= 190) {
		$("#controls").css("background", "linear-gradient(rgba(0, 0, 0, 0), rgba(96, 125,139, 0.8)");
		$(".player-popup").css("background-color", "rgba(96, 125,139, 0.8)");
		if (newColorRgb[1] >= 190 && newColorRgb[2] >= 190 && newColorRgb[3] < 60) {
			var colorText = "#212121";
		} else {
			var colorText = "#607D8B";
		}
	} else if (luma >= 178) {
		var colorText = "#212121";
		$("#controls").css("background", "linear-gradient(rgba(0, 0, 0, 0), rgba(96, 125,139, 0.8)");
		$(".player-popup").css("background-color", "rgba(96, 125,139, 0.8)");
	} else {
		var colorText = "#fafafa";
		$("#controls").css("background", "linear-gradient(transparent, rgba(" + newColorBgRgb[1] + "," + newColorBgRgb[2] + "," + newColorBgRgb[3] + ", 0.8)");
		$(".player-popup").css("background-color", "rgba(" + newColorRgb[1] + "," + newColorRgb[2] + "," + newColorRgb[3] + ", 0.8)");
	}
	$("#titlebarLogo").css("color", colorText);
	$("#accountBox .material-icons").css("color", colorText);
	$(".browser-nav-item").css("color", colorText);
	$(".browser-nav-item").css("border-color", colorText);
	//$(".button-float.daily-sub:hover").css("color", colorText);
	$("#progress").css("background-color", color);
	$("#progressScrub").css("background-color", newColor);
	$("#progressorbChild").css("background-color", color);
	$(".browser-content-item.pick .browser-content-item").css("border-color", color);
	$(".titlebar").css("background-color", color);
	$(".signup-tags-header").css("background-color", color);
	$(".signup-tags-header-label").css("background-color", colorBg);
	$(".browser-nav").css("background-color", colorBg);
	$(".browser-content-item.pick .browser-content-item-frame").css("border-color", color);
	//$(".button-toggle-parent input:checked~label:before").css("background-color", colorBg);
	//$(".button-toggle-parent input:checked~label:after").css("background-color", color);
	//$(".button-toggle-parent input:checked~label:before").css("border-color", color);
	//$(".button-toggle-parent input:checked~label:after").css("border-color", color);
	//$(".button-float.daily-sub:hover").css("background-color", color);
	$(".loader-container").css("background-color", "rgba(" + newColorRgb[1] + "," + newColorRgb[2] + "," + newColorRgb[3] + ", 0.2)");
	$("#loader-one").css("border-color", "transparent transparent rgba(" + newColorBgRgb[1] + "," + newColorBgRgb[2] + "," + newColorBgRgb[3] + ", 0.1) transparent");
	$("#loader-two").css("border-color", "transparent transparent rgba(" + newColorRgb[1] + "," + newColorRgb[2] + "," + newColorRgb[3] + ", 0.2) transparent");
	$("#loader-three").css("border-color", "transparent transparent rgba(" + newColorRgb[1] + "," + newColorRgb[2] + "," + newColorRgb[3] + ", 0.9) transparent");
	$(".daily.alternate #playerContainer").css("background", "linear-gradient(transparent, rgba(" + newColorBgRgb[1] + "," + newColorBgRgb[2] + "," + newColorBgRgb[3] + ", 0.4)");
	$("#playerContainer").css("background-image", "linear-gradient(transparent, rgba(" + newColorBgRgb[1] + "," + newColorBgRgb[2] + "," + newColorBgRgb[3] + ", 0.4)");
}
$(".browser-content-item").click(navigate);
$(".browser-content-item-info-report-text").click(report);

function report() {}

function toggleTheater() {
	if (theaterVisible) {
		$("#daily").animate({
			scrollTop: 0
		}, 0);
		$("#daily").removeClass("alternate");
		$("#browser").css("transform", "none");
		$("#browserNav").css("transform", "none");
		$("#controls").css("width", "calc(100% - 30px)");
        $("#controls").css("left", "0");
		$("#daily").css("overflow-y", "hidden");
		$("#content").css("overflow-y", "auto");
		//$("#dailyComment").html("<i class='material-icons'>comments</i>");
		fixScroll();
	} else {
		$("#daily").addClass("alternate");
		$("#browser").css("transform", "translateY(" + ($(document).height() - 460) + "px)");
		$("#browserNav").css("transform", "translateY(" + ($(document).height() - 460) + "px)");
		setTimeout((function() {
			$("#daily").css("overflow-y", "auto");
			$("#content").css("overflow-y", "hidden");
			$("#controls").css("width", $("#player").width() - 30 + "px");
            $("#controls").css("left", "0");
			fixScroll();
		}), 200);
		//$("#dailyComment").html("<i class='material-icons'>close</i>");
		$("#titlebarDaily").addClass("hidden");
		dailyVisible = true;
		forcePlay();
		Cookies.set("dailyVisible", dailyVisible, {
			expires: 1
		});
	}

	theaterVisible = !theaterVisible;
}

//$("#browserContent").scroll(function() {
//	dailyVisible = true;
//	toggleDaily();
//});

//$("#browserContent").mousewheel(function() {
//	dailyVisible = true;
//	toggleDaily();
//});

//$("#daily").scroll(function() {
//	theaterVisible = false;
//	goTheater();
//});

//$("#daily").mousewheel(function() {
//	theaterVisible = false;
//	goTheater();
//});

$("#daily").click((function() {
	$("#content").animate({
		scrollTop: 0
	}, 150);
}));

$("#promoverlay").click((function() {
	$("#content").animate({
		scrollTop: 0
	}, 150);
}));

$("#signup").click((function() {
	$("#content").animate({
		scrollTop: 0
	}, 150);
}));

$("#login").click((function() {
	$("#content").animate({
		scrollTop: 0
	}, 150);
}));

$("#upload").click((function() {
	$("#content").animate({
		scrollTop: 0
	}, 150);
}));

function uploadItem(button) {
	$(".upload .upload-item-select").addClass("hidden");
	$(".upload .upload-link-divide").addClass("hidden");
	if ($(button).attr('id') == "uploadLink") {
		$("#uploadLinkBox").addClass("active");
		$("#uploadLinkInput").focus();
	} else if ($(button).attr('id') == "uploadYoutube") {
		$("#uploadYoutubeBox").addClass("active");
		$("#uploadYoutubeInput").focus();
	} else if ($(button).attr('id') == "uploadFacebook") {
		$("#uploadFacebookBox").addClass("active");
		$("#uploadFacebookInput").focus();
	}
}

function signupItem(button) {
	$(".signup .upload-item-select").addClass("hidden");
	$(".signup .upload-link-divide").addClass("hidden");
	if ($(button).attr('id') == "signupPassword") {
		$("#signupPasswordBox").addClass("active");
		$("#signupPasswordInput").focus();
	}
}

$(".upload .upload-item-select").click((function() {
	uploadItem(this);
}));

$(".signup .upload-item-select").click((function() {
	signupItem(this);
}));

$(".upload-label").click(function() {
	$(this).siblings(".input").focus();
});

$(".upload .upload-link-back").click((function() {
	$(".upload .upload-item-select").removeClass("hidden");
	$(".upload .upload-link-divide").removeClass("hidden");
	
	$("#uploadLinkBox").removeClass("active");
	$("#uploadLinkInput").blur();
	$("#uploadYoutubeBox").removeClass("active");
	$("#uploadYoutubeInput").blur();
	$("#uploadFacebookBox").removeClass("active");
	$("#uploadFacebookInput").blur();
}));

$(".signup .upload-link-back").click((function() {
	$(".signup .upload-item-select").removeClass("hidden");
	$(".signup .upload-link-divide").removeClass("hidden");
	
	$("#signupPasswordBox").removeClass("active");
	$("#signupPasswordInput").blur();
}));

$("#uploadLinkInput").keyup((function() {
	if ($("#uploadLinkInput").val() !== "") {
		$("#uploadLinkGo").addClass("active");
	} else {
		$("#uploadLinkGo").removeClass("active");
	}
}));

$("#uploadYoutubeInput").keyup((function() {
	if ($("#uploadYoutubeInput").val() !== "") {
		$("#uploadYoutubeGo").addClass("active");
	} else {
		$("#uploadYoutubeGo").removeClass("active");
	}
}));

$("#uploadFacebookInput").keyup((function() {
	if ($("#uploadFacebookInput").val() !== "") {
		$("#uploadFacebookGo").addClass("active");
	} else {
		$("#uploadFacebookGo").removeClass("active");
	}
}));

$("#signupPasswordInput").keyup((function() {
	if ($("#signupPasswordInput").val() !== "") {
		$("#signupPasswordGo").addClass("active");
	} else {
		$("#signupPasswordGo").removeClass("active");
	}
}));

$("#showit").click(showPromo);

fixScroll();
