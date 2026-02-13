var slideoutVisible = false;
function toggleSlideout() {
	if (slideoutVisible) {
		$("#slideout").addClass("hidden");
		$("#shadow").addClass("hidden");
		setTimeout(function() {
			$("#shadow").css("display", "none");
		}, 150);
		slideoutVisible = false;
	} else {
		$("#slideout").removeClass("hidden");
		setTimeout(function() {
			$("#shadow").removeClass("hidden");
		}, 50);
		$("#shadow").css("display", "block");
		slideoutVisible = true;
	}
}

$("#columnLeft").scroll(function() {
	if ($("#columnLeft").scrollTop() > 5) {
		$("#settingsSearchParent").addClass("active");
		$("#titlebar").addClass("active");
	} else if (!$("#settingsSearch").is(":focus")) {
		$("#settingsSearchParent").removeClass("active");
		$("#titlebar").removeClass("active");
	}
});

$("#contentMain").scroll(function() {
	if ($("#contentMain").scrollTop() > 5) {
		$("#titlebar").addClass("active");
	} else if (!$("#settingsSearch").is(":focus")) {
		$("#titlebar").removeClass("active");
	}
});

$("#settingsSearchParent").click(function() {
	$("#settingsSearch").focus();
});

$("#settingsSearch").focus(function() {
	 $("#settingsSearchParent").addClass("active");
});

$("#settingsSearch").focusout(function() {
	if ($("#columnLeft").scrollTop() <= 5) {
		$("#settingsSearchParent").removeClass("active");
	}
});

$("#settingsSearch").keyup(function(e) {
	var key = e.keyCode || e.which;
	var value = $("#settingsSearch").val().replace(/\s/g, "").toLowerCase();
    if(key == 13) {
		$("#settingsSearch").blur();
		$("#settingsSearchParent").removeClass("active");
	} else if (key == 27) {
		$("#settingsSearch").blur();
	} else if (value !== "") {
		var total = $(".section-wrap").length;
		for (i = 0; i < total; i++) {
			var content = $(".section-wrap").eq(i).text().replace(/\s/g, "").toLowerCase();
			if (content.indexOf(value) == -1) {
				$(".section-wrap").eq(i).addClass("hidden");
			} else {
				$(".section-wrap").eq(i).removeClass("hidden");
				var subtotal = $(".section-wrap").eq(i).find(".section-item").length;
				for (o = 0; o < subtotal; o ++) {
					var subcontent = $(".section-wrap").eq(i).find(".section-item").eq(o).text().replace(/\s/g, "").toLowerCase();
					console.log(subcontent);
					if (subcontent.indexOf(value) == -1) {
						$(".section-wrap").eq(i).find(".section-item").eq(o).removeClass("active");
					} else {
						$(".section-wrap").eq(i).find(".section-item").eq(o).addClass("active");
					}
				}
			}
		}
	} else {
		$(".section-wrap").removeClass("hidden");
		$(".section-item").removeClass("active");
	}
	$("#columnLeft").animate({ scrollTop: 0 }, 150);
	$("#contentMain").animate({ scrollTop: 0 }, 150);
});

$(".column-left-item").click(function() {
	$(".column-left-item").removeClass("active");
	if ($("#columnLeft").scrollTop() > 5) {
		$("#settingsSearchParent").addClass("active");
	} else {
		$("#settingsSearchParent").removeClass("active");
	}
	$(this).addClass("active");
	console.log($(this).attr(data-scrollto));
});

$(".section-item-label").click(function() {
	$(this).parent().find("label").click();
})