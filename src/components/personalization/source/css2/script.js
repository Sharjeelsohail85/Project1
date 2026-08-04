var fulllist = document.getElementById("colors");
const listItems = document.querySelectorAll("li");
listItems.forEach((item) => {
	const colorValue = item.textContent;
	// item.style.color = colorValue;
	item.style.backgroundColor = colorValue;
	item.innerHTML = "";
	item.title = colorValue;
	item.addEventListener("click", function () {
		// alert("You clicked on: " + colorValue);
		fulllist.append(item);

		if (colorValue == "Orange") {
			console.log("clicked orange");
			listItems.forEach((item) => {
				item.classList.toggle("orange");
			});
		}
	});
});

function itsorange() {
	listItems.forEach((item) => {
		item.classList.toggle("orange");
	});
}
