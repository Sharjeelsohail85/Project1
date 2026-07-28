function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  let bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function updateBlend() {
  const c1 = document.getElementById("color1").value;
  const c2 = document.getElementById("color2").value;

  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);

  const r = Math.round((rgb1.r + rgb2.r) / 2);
  const g = Math.round((rgb1.g + rgb2.g) / 2);
  const b = Math.round((rgb1.b + rgb2.b) / 2);

  const hex =
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0");

  // Update streams & bucket fills
  document.getElementById("stream1").style.background = c1;
  document.getElementById("bucket1").style.background = c1;
  document.getElementById("stream2").style.background = c2;
  document.getElementById("bucket2").style.background = c2;

  // Show blended color in ocean
  document.getElementById("ocean").style.background = hex;
  document.getElementById(
    "ocean"
  ).innerHTML = `<p id="clickhere" style="text-align:center; margin-top:20; padding-top:10px;">
      Blended Color: (${r}, ${g}, ${b}) → <b>${hex.toUpperCase()}</b>
     </p>`;

  // Update info near buckets
  document.getElementById(
    "bucket1Info"
  ).innerHTML = `<b>Bucket 1</b><br>HEX: ${c1}<br>RGB: (${rgb1.r}, ${rgb1.g}, ${rgb1.b})`;
  document.getElementById(
    "bucket2Info"
  ).innerHTML = `<b>Bucket 2</b><br>HEX: ${c2}<br>RGB: (${rgb2.r}, ${rgb2.g}, ${rgb2.b})`;

  // Show math in resultBox
  document.getElementById("resultBox").innerHTML = `
    <p>Red: (${rgb1.r} + ${rgb2.r}) ÷ 2 = <b>${r}</b>, 
       Green: (${rgb1.g} + ${rgb2.g}) ÷ 2 = <b>${g}</b>, 
       Blue: (${rgb1.b} + ${rgb2.b}) ÷ 2 = <b>${b}</b></p>
    <p><b>Blended Color: (${r}, ${g}, ${b}) → ${hex.toUpperCase()}</b></p>`;
}

// Update when colors change
document.getElementById("color1").addEventListener("input", updateBlend);
document.getElementById("color2").addEventListener("input", updateBlend);

// Initialize
updateBlend();
