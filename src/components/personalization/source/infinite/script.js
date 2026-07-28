let scene, camera, renderer, controls;
let prismGroup;
let raycaster, mouse;
const TOTAL_PRISMS = 150;
const GRID_COLS = 15;
const GRID_ROWS = 10;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 3;
const GLASS_OPACITY = 0.9;
const CLICK_HEIGHT = 5;
const PRISM_WIDTH = 1.5;
const PRISM_DEPTH = 1.5;
let selectedPrism = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100;
const GRID_SIZE_X = GRID_COLS * PRISM_WIDTH;
const GRID_SIZE_Z = GRID_ROWS * PRISM_DEPTH;
const VIEW_DISTANCE = 3;
let activeGrids = new Map();
let originalPrisms = [];
let lastCameraPosition = new THREE.Vector3();
const CSS_COLORS = [
	"AliceBlue",
	"AntiqueWhite",
	"Aqua",
	"Aquamarine",
	"Azure",
	"Beige",
	"Bisque",
	"Black",
	"BlanchedAlmond",
	"Blue",
	"BlueViolet",
	"Brown",
	"BurlyWood",
	"CadetBlue",
	"Chartreuse",
	"Chocolate",
	"Coral",
	"CornflowerBlue",
	"Cornsilk",
	"Crimson",
	"Cyan",
	"DarkBlue",
	"DarkCyan",
	"DarkGoldenRod",
	"DarkGray",
	"DarkGrey",
	"DarkGreen",
	"DarkKhaki",
	"DarkMagenta",
	"DarkOliveGreen",
	"DarkOrange",
	"DarkOrchid",
	"DarkRed",
	"DarkSalmon",
	"DarkSeaGreen",
	"DarkSlateBlue",
	"DarkSlateGray",
	"DarkSlateGrey",
	"DarkTurquoise",
	"DarkViolet",
	"DeepPink",
	"DeepSkyBlue",
	"DimGray",
	"DimGrey",
	"DodgerBlue",
	"FireBrick",
	"FloralWhite",
	"ForestGreen",
	"Fuchsia",
	"Gainsboro",
	"GhostWhite",
	"Gold",
	"GoldenRod",
	"Gray",
	"Grey",
	"Green",
	"GreenYellow",
	"HoneyDew",
	"HotPink",
	"IndianRed",
	"Indigo",
	"Ivory",
	"Khaki",
	"Lavender",
	"LavenderBlush",
	"LawnGreen",
	"LemonChiffon",
	"LightBlue",
	"LightCoral",
	"LightCyan",
	"LightGoldenRodYellow",
	"LightGray",
	"LightGrey",
	"LightGreen",
	"LightPink",
	"LightSalmon",
	"LightSeaGreen",
	"LightSkyBlue",
	"LightSlateGray",
	"LightSlateGrey",
	"LightSteelBlue",
	"LightYellow",
	"Lime",
	"LimeGreen",
	"Linen",
	"Magenta",
	"Maroon",
	"MediumAquaMarine",
	"MediumBlue",
	"MediumOrchid",
	"MediumPurple",
	"MediumSeaGreen",
	"MediumSlateBlue",
	"MediumSpringGreen",
	"MediumTurquoise",
	"MediumVioletRed",
	"MidnightBlue",
	"MintCream",
	"MistyRose",
	"Moccasin",
	"NavajoWhite",
	"Navy",
	"OldLace",
	"Olive",
	"OliveDrab",
	"Orange",
	"OrangeRed",
	"Orchid",
	"PaleGoldenRod",
	"PaleGreen",
	"PaleTurquoise",
	"PaleVioletRed",
	"PapayaWhip",
	"PeachPuff",
	"Peru",
	"Pink",
	"Plum",
	"PowderBlue",
	"Purple",
	"RebeccaPurple",
	"Red",
	"RosyBrown",
	"RoyalBlue",
	"SaddleBrown",
	"Salmon",
	"SandyBrown",
	"SeaGreen",
	"SeaShell",
	"Sienna",
	"Silver",
	"SkyBlue",
	"SlateBlue",
	"SlateGray",
	"SlateGrey",
	"Snow",
	"SpringGreen",
	"SteelBlue",
	"Tan",
	"Teal",
	"Thistle",
	"Tomato",
	"Turquoise",
	"Violet",
	"Wheat",
	"White",
	"WhiteSmoke",
	"Yellow",
	"YellowGreen",
	"Peru",
	"Pink"
];

function colorNameToHex(colorName) {
	const colorMap = {
		aliceblue: "#f0f8ff",
		antiquewhite: "#faebd7",
		aqua: "#00ffff",
		aquamarine: "#7fffd4",
		azure: "#f0ffff",
		beige: "#f5f5dc",
		bisque: "#ffe4c4",
		black: "#000000",
		blanchedalmond: "#ffebcd",
		blue: "#0000ff",
		blueviolet: "#8a2be2",
		brown: "#a52a2a",
		burlywood: "#deb887",
		cadetblue: "#5f9ea0",
		chartreuse: "#7fff00",
		chocolate: "#d2691e",
		coral: "#ff7f50",
		cornflowerblue: "#6495ed",
		cornsilk: "#fff8dc",
		crimson: "#dc143c",
		cyan: "#00ffff",
		darkblue: "#00008b",
		darkcyan: "#008b8b",
		darkgoldenrod: "#b8860b",
		darkgray: "#a9a9a9",
		darkgrey: "#a9a9a9",
		darkgreen: "#006400",
		darkkhaki: "#bdb76b",
		darkmagenta: "#8b008b",
		darkolivegreen: "#556b2f",
		darkorange: "#ff8c00",
		darkorchid: "#9932cc",
		darkred: "#8b0000",
		darksalmon: "#e9967a",
		darkseagreen: "#8fbc8f",
		darkslateblue: "#483d8b",
		darkslategray: "#2f4f4f",
		darkslategrey: "#2f4f4f",
		darkturquoise: "#00ced1",
		darkviolet: "#9400d3",
		deeppink: "#ff1493",
		deepskyblue: "#00bfff",
		dimgray: "#696969",
		dimgrey: "#696969",
		dodgerblue: "#1e90ff",
		firebrick: "#b22222",
		floralwhite: "#fffaf0",
		forestgreen: "#228b22",
		fuchsia: "#ff00ff",
		gainsboro: "#dcdcdc",
		ghostwhite: "#f8f8ff",
		gold: "#ffd700",
		goldenrod: "#daa520",
		gray: "#808080",
		grey: "#808080",
		green: "#008000",
		greenyellow: "#adff2f",
		honeydew: "#f0fff0",
		hotpink: "#ff69b4",
		indianred: "#cd5c5c",
		indigo: "#4b0082",
		ivory: "#fffff0",
		khaki: "#f0e68c",
		lavender: "#e6e6fa",
		lavenderblush: "#fff0f5",
		lawngreen: "#7cfc00",
		lemonchiffon: "#fffacd",
		lightblue: "#add8e6",
		lightcoral: "#f08080",
		lightcyan: "#e0ffff",
		lightgoldenrodyellow: "#fafad2",
		lightgray: "#d3d3d3",
		lightgrey: "#d3d3d3",
		lightgreen: "#90ee90",
		lightpink: "#ffb6c1",
		lightsalmon: "#ffa07a",
		lightseagreen: "#20b2aa",
		lightskyblue: "#87cefa",
		lightslategray: "#778899",
		lightslategrey: "#778899",
		lightsteelblue: "#b0c4de",
		lightyellow: "#ffffe0",
		lime: "#00ff00",
		limegreen: "#32cd32",
		linen: "#faf0e6",
		magenta: "#ff00ff",
		maroon: "#800000",
		mediumaquamarine: "#66cdaa",
		mediumblue: "#0000cd",
		mediumorchid: "#ba55d3",
		mediumpurple: "#9370db",
		mediumseagreen: "#3cb371",
		mediumslateblue: "#7b68ee",
		mediumspringgreen: "#00fa9a",
		mediumturquoise: "#48d1cc",
		mediumvioletred: "#c71585",
		midnightblue: "#191970",
		mintcream: "#f5fffa",
		mistyrose: "#ffe4e1",
		moccasin: "#ffe4b5",
		navajowhite: "#ffdead",
		navy: "#000080",
		oldlace: "#fdf5e6",
		olive: "#808000",
		olivedrab: "#6b8e23",
		orange: "#ffa500",
		orangered: "#ff4500",
		orchid: "#da70d6",
		palegoldenrod: "#eee8aa",
		palegreen: "#98fb98",
		paleturquoise: "#afeeee",
		palevioletred: "#db7093",
		papayawhip: "#ffefd5",
		peachpuff: "#ffdab9",
		peru: "#cd853f",
		pink: "#ffc0cb",
		plum: "#dda0dd",
		powderblue: "#b0e0e6",
		purple: "#800080",
		rebeccapurple: "#663399",
		red: "#ff0000",
		rosybrown: "#bc8f8f",
		royalblue: "#4169e1",
		saddlebrown: "#8b4513",
		salmon: "#fa8072",
		sandybrown: "#f4a460",
		seagreen: "#2e8b57",
		seashell: "#fff5ee",
		sienna: "#a0522d",
		silver: "#c0c0c0",
		skyblue: "#87ceeb",
		slateblue: "#6a5acd",
		slategray: "#708090",
		slategrey: "#708090",
		snow: "#fffafa",
		springgreen: "#00ff7f",
		steelblue: "#4682b4",
		tan: "#d2b48c",
		teal: "#008080",
		thistle: "#d8bfd8",
		tomato: "#ff6347",
		turquoise: "#40e0d0",
		violet: "#ee82ee",
		wheat: "#f5deb3",
		white: "#ffffff",
		whitesmoke: "#f5f5f5",
		yellow: "#ffff00",
		yellowgreen: "#9acd32",
		peru: "#cd853f",
		pink: "#ffc0cb"
	};
	return colorMap[colorName.toLowerCase()] || "#ffffff";
}

function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0a0a);
	scene.fog = new THREE.Fog(0x0a0a0a, 100, 500);
	camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.1,
		5000
	);
	camera.position.set(0.0, 10.8, 0.0);
	camera.rotation.set(-Math.PI / 2, 0, 0);
	const canvasContainer = document.getElementById("canvas-container");
	renderer = new THREE.WebGLRenderer({
		antialias: !0,
		alpha: !0
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = !0;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	canvasContainer.appendChild(renderer.domElement);
	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = !0;
	controls.dampingFactor = 0.05;
	controls.minDistance = 8;
	controls.maxDistance = 15;
	controls.target.set(0, 0, 0);
	controls.enableRotate = !1;
	controls.enablePan = !0;
	controls.enableZoom = !0;
	controls.screenSpacePanning = !0;
	controls.maxPolarAngle = Math.PI;
	controls.minPolarAngle = 0;
	controls.panSpeed = 2.0;
	controls.zoomSpeed = 1.5;
	controls.mouseButtons = {
		LEFT: THREE.MOUSE.PAN,
		MIDDLE: THREE.MOUSE.DOLLY,
		RIGHT: THREE.MOUSE.PAN
	};
	controls.update();
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
	setupLights();
	createOriginalPrisms();
	updateInfiniteGrid();
	setupEventListeners();
	lastCameraPosition.copy(camera.position);
}

function setupLights() {
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(100, 100, 100);
	directionalLight.castShadow = !0;
	directionalLight.shadow.mapSize.width = 2048;
	directionalLight.shadow.mapSize.height = 2048;
	directionalLight.shadow.camera.left = -200;
	directionalLight.shadow.camera.right = 200;
	directionalLight.shadow.camera.top = 200;
	directionalLight.shadow.camera.bottom = -200;
	directionalLight.shadow.camera.near = 0.5;
	directionalLight.shadow.camera.far = 500;
	scene.add(directionalLight);
	const fillLight = new THREE.DirectionalLight(0x4466ff, 0.3);
	fillLight.position.set(110, 110, 110);
	scene.add(fillLight);
	const accentLight1 = new THREE.PointLight(0xffcc66, 0.4, 300);
	accentLight1.position.set(110, 110, 110);
	scene.add(accentLight1);
	const accentLight2 = new THREE.PointLight(0x00aaff, 0.4, 300);
	accentLight2.position.set(110, 110, 110);
	scene.add(accentLight2);
}

function createOriginalPrisms() {
	originalPrisms = [];
	const totalWidth = (GRID_COLS - 1) * PRISM_WIDTH;
	const totalDepth = (GRID_ROWS - 1) * PRISM_DEPTH;
	const offsetX = -totalWidth / 2;
	const offsetZ = -totalDepth / 2;
	let prismIndex = 0;
	for (let row = 0; row < GRID_ROWS; row++) {
		for (let col = 0; col < GRID_COLS; col++) {
			if (prismIndex >= TOTAL_PRISMS) break;
			const height = MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT);
			const colorName = CSS_COLORS[prismIndex];
			const color = new THREE.Color(colorName.toLowerCase());
			const hexColor = colorNameToHex(colorName);
			const prism = createGlassPrism(
				PRISM_WIDTH,
				height,
				PRISM_DEPTH,
				color,
				colorName,
				hexColor
			);
			prism.position.x = offsetX + col * PRISM_WIDTH;
			prism.position.z = offsetZ + row * PRISM_DEPTH;
			prism.position.y = height / 2;
			prism.rotation.set(0, 0, 0);
			prism.userData = {
				index: prismIndex,
				colorName: colorName,
				hexColor: hexColor,
				originalHeight: height,
				originalPosition: {
					x: prism.position.x,
					y: prism.position.y,
					z: prism.position.z
				},
				isSelected: !1,
				originalMaterial: null,
				gridX: 0,
				gridZ: 0
			};
			originalPrisms.push(prism);
			prismIndex++;
		}
	}
}

function createGlassPrism(width, height, depth, color, colorName, hexColor) {
	const geometry = new THREE.BoxGeometry(width, height, depth);
	const material = new THREE.MeshPhysicalMaterial({
		color: color,
		roughness: 0.1,
		metalness: 0.2,
		transparent: !0,
		opacity: GLASS_OPACITY,
		transmission: 0,
		thickness: 0.5,
		clearcoat: 0.5,
		clearcoatRoughness: 0.1,
		reflectivity: 0.5,
		specularIntensity: 1.0,
		side: THREE.DoubleSide
	});
	const prism = new THREE.Mesh(geometry, material);
	prism.castShadow = !0;
	prism.receiveShadow = !0;
	return prism;
}

function createGridAt(gridX, gridZ) {
	const group = new THREE.Group();
	originalPrisms.forEach((originalPrism) => {
		const clone = originalPrism.clone();
		clone.position.x = originalPrism.position.x + gridX * GRID_SIZE_X;
		clone.position.z = originalPrism.position.z + gridZ * GRID_SIZE_Z;
		clone.position.y = originalPrism.position.y;
		clone.material = originalPrism.material.clone();
		clone.userData = {
			...originalPrism.userData,
			gridX: gridX,
			gridZ: gridZ,
			isClone: !0,
			originalIndex: originalPrism.userData.index
		};
		group.add(clone);
	});
	scene.add(group);
	activeGrids.set(`${gridX},${gridZ}`, group);
	return group;
}

function removeGridAt(gridX, gridZ) {
	const key = `${gridX},${gridZ}`;
	if (activeGrids.has(key)) {
		const group = activeGrids.get(key);
		group.traverse((child) => {
			if (child.geometry) child.geometry.dispose();
			if (child.material) {
				if (Array.isArray(child.material)) {
					child.material.forEach((mat) => {
						if (mat.map) mat.map.dispose();
						mat.dispose();
					});
				} else {
					if (child.material.map) child.material.map.dispose();
					child.material.dispose();
				}
			}
		});
		scene.remove(group);
		activeGrids.delete(key);
	}
}

function updateInfiniteGrid() {
	const gridX = Math.floor(camera.position.x / GRID_SIZE_X);
	const gridZ = Math.floor(camera.position.z / GRID_SIZE_Z);
	const gridsToKeep = new Set();
	for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
		for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
			const targetGridX = gridX + dx;
			const targetGridZ = gridZ + dz;
			const key = `${targetGridX},${targetGridZ}`;
			gridsToKeep.add(key);
			if (!activeGrids.has(key)) {
				createGridAt(targetGridX, targetGridZ);
			}
		}
	}
	const gridsToRemove = [];
	activeGrids.forEach((group, key) => {
		if (!gridsToKeep.has(key)) {
			const [gx, gz] = key.split(",").map(Number);
			gridsToRemove.push({
				gridX: gx,
				gridZ: gz
			});
		}
	});
	gridsToRemove.forEach(({ gridX, gridZ }) => {
		removeGridAt(gridX, gridZ);
	});
}

function createTextMaterial(
	colorName,
	hexColor,
	backgroundColor,
	textColor = 0x000000
) {
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	const context = canvas.getContext("2d");
	context.fillStyle = backgroundColor;
	context.fillRect(0, 0, 512, 512);
	context.save();
	context.translate(256, 256);
	context.translate(-256, -256);
	context.font = "bold 40px Arial, sans-serif";
	context.fillStyle = `rgb(${(textColor >> 16) & 255}, ${
		(textColor >> 8) & 255
	}, ${textColor & 255})`;
	context.textAlign = "center";
	context.textBaseline = "middle";
	const maxWidth = 480;
	let fontSize = 60;
	let fits = !1;
	while (!fits && fontSize > 20) {
		context.font = `bold ${fontSize}px Arial, sans-serif`;
		const metrics = context.measureText(colorName);
		if (metrics.width <= maxWidth) {
			fits = !0;
		} else {
			fontSize -= 12;
		}
	}
	context.fillText(colorName, 256, 200);
	context.font = "bold 60px Arial, monospace";
	context.fillText(hexColor.toUpperCase(), 256, 280);
	context.restore();
	const texture = new THREE.CanvasTexture(canvas);
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	return new THREE.MeshBasicMaterial({
		map: texture,
		side: THREE.DoubleSide,
		transparent: !0,
		opacity: 0.95
	});
}

function onPrismClick(prism) {
	if (selectedPrism === prism) {
		resetPrism(prism);
		selectedPrism = null;
		hideSelectedInfo();
		return;
	}
	if (selectedPrism) {
		resetPrism(selectedPrism);
	}
	selectedPrism = prism;
	prism.userData.isSelected = !0;
	if (!prism.userData.originalMaterial) {
		prism.userData.originalMaterial = prism.material;
	}
	const scaleFactor = CLICK_HEIGHT / prism.userData.originalHeight;
	prism.scale.y = scaleFactor;
	prism.position.y = CLICK_HEIGHT / 2;
	const hexColor = prism.userData.hexColor;
	const colorName = prism.userData.colorName;
	const hexToRgb = (hex) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16)
			  }
			: {
					r: 255,
					g: 255,
					b: 255
			  };
	};
	const rgbColor = hexToRgb(hexColor);
	const backgroundColor = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
	const luminance =
		(0.299 * rgbColor.r + 0.587 * rgbColor.g + 0.114 * rgbColor.b) / 255;
	const textColor = luminance > 0.5 ? 0x000000 : 0xffffff;
	const textMaterial = createTextMaterial(
		colorName,
		hexColor,
		backgroundColor,
		textColor
	);
	prism.material = [
		prism.userData.originalMaterial,
		prism.userData.originalMaterial,
		textMaterial,
		prism.userData.originalMaterial,
		prism.userData.originalMaterial,
		prism.userData.originalMaterial
	];
	updateSelectedInfo(colorName, hexColor, prism.userData.originalHeight);
	try {
		if (window.__THEME_BRIDGE && hexColor) {
			window.parent.postMessage({ source: window.__THEME_BRIDGE, color: hexColor }, "*");
		}
	} catch (e) {}
}

function resetPrism(prism) {
	prism.userData.isSelected = !1;
	prism.scale.y = 1;
	prism.position.y = prism.userData.originalPosition.y;
	if (prism.userData.originalMaterial) {
		if (Array.isArray(prism.material)) {
			prism.material.forEach((mat) => {
				if (mat.map) mat.map.dispose();
				mat.dispose();
			});
		} else if (prism.material.map) {
			prism.material.map.dispose();
			prism.material.dispose();
		}
		prism.material = prism.userData.originalMaterial;
	}
}

function updateSelectedInfo(colorName, hexColor, originalHeight) {
	const selectedInfo = document.getElementById("selected-info");
	const selectedDetails = document.getElementById("selected-details");
	selectedDetails.innerHTML = `
            <strong>Couleur :</strong> ${colorName}<br>
            <strong>Code Hex :</strong> ${hexColor.toUpperCase()}<br>
        `;
	selectedInfo.style.display = "block";
}

function hideSelectedInfo() {
	document.getElementById("selected-info").style.display = "none";
}

function updateControls() {
	const currentTime = Date.now();
	if (currentTime - lastUpdateTime < UPDATE_INTERVAL) {
		return;
	}
	lastUpdateTime = currentTime;
	if (camera.position.distanceTo(lastCameraPosition) > GRID_SIZE_X * 0.3) {
		updateInfiniteGrid();
		lastCameraPosition.copy(camera.position);
	}
}

function setupEventListeners() {
	window.addEventListener("resize", onWindowResize);
	renderer.domElement.addEventListener("click", onCanvasClick);
	renderer.domElement.addEventListener("dblclick", function () {
		controls.reset();
	});
	renderer.domElement.addEventListener("mousemove", updateControls);
	renderer.domElement.addEventListener("wheel", updateControls);
	controls.addEventListener("change", function () {
		updateInfiniteGrid();
		updateControls();
	});
}

function onCanvasClick(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	const allPrisms = [];
	activeGrids.forEach((group) => {
		allPrisms.push(...group.children);
	});
	const intersects = raycaster.intersectObjects(allPrisms, !0);
	if (intersects.length > 0) {
		const prism = intersects[0].object;
		onPrismClick(prism);
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	updateControls();
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	updateControls();
	renderer.render(scene, camera);
}
init();
animate();
console.log("&Toc on codepen - https://codepen.io/ol-ivier");
