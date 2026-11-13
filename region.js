// Fictional Louisiana-inspired cities. Coordinates and block dimensions are in metres.
const cities = [
  {
    id: "cypress",
    name: "Cypress City",
    x: 7200,
    y: 4300,
    w: 4400,
    h: 3600,
    port: [9700, 4700],
    market: 1,
    spot: "cypress",
    districts: ["Old Landing", "Garden Ward", "Cypress Downtown", "Northside"],
    description:
      "A working river city with a dense downtown, residential wards, waterfront warehouses and public fishing piers.",
  },
  {
    id: "belle",
    name: "Belle Rive",
    x: 15300,
    y: 7900,
    w: 5600,
    h: 4400,
    port: [12200, 7900],
    market: 1.15,
    spot: "riverfront",
    districts: ["French Quarter", "University", "River Exchange", "Eastbank"],
    description:
      "The regional capital: a broad street grid, a commercial core, university parkland and a busy seafood exchange.",
  },
  {
    id: "gulf",
    name: "Port Soleil",
    x: 7700,
    y: 12900,
    w: 5000,
    h: 4000,
    port: [10500, 12600],
    market: 1.3,
    spot: "harbor",
    districts: ["Shipyard", "Canal Ward", "Soleil Center", "West Gardens"],
    description:
      "A coastal port with full-sized industrial blocks, a ship channel, residential neighborhoods and premium seafood buyers.",
  },
];
const deliveryJobs = [
  {
    id: "landing",
    city: "cypress",
    name: "Dockside supper",
    fish: null,
    count: 3,
    bonus: 85,
    xp: 25,
    description: "The landing café needs three fish of any species.",
  },
  {
    id: "bistro",
    city: "belle",
    name: "Riverfront bistro",
    fish: "Bass",
    count: 2,
    bonus: 220,
    xp: 55,
    description: "Deliver two bass to Belle Rive’s restaurant district.",
  },
  {
    id: "gulfbox",
    city: "gulf",
    name: "Coastal fish boxes",
    fish: null,
    count: 6,
    bonus: 300,
    xp: 70,
    description: "Supply six fish of any species to the coastal market.",
  },
  {
    id: "trophy",
    city: "gulf",
    name: "Aquarium commission",
    fish: "Alligator Gar",
    count: 1,
    bonus: 250,
    xp: 60,
    description: "Bring one alligator gar to the Port Soleil aquarium.",
  },
];
let selectedCity = "cypress";
const currentCity = () => cities.find((c) => c.id === state.city) || cities[0];
const jobById = () => deliveryJobs.find((j) => j.id === state.contract);
function marketValue(fish) {
  return Math.round(fish.worth * currentCity().market);
}
function matchingFish(job) {
  return state.inventory.filter(
    (f) =>
      !job.fish ||
      f.name === job.fish ||
      (job.fish === "Bass" && f.id === "bass"),
  );
}
function fareTo(id) {
  const destination = cities.find((c) => c.id === id);
  return destination.id === state.city
    ? 0
    : Math.ceil(
        (Math.hypot(
          destination.port[0] - currentCity().port[0],
          destination.port[1] - currentCity().port[1],
        ) /
          1000) *
          4,
      );
}
function sailTo(id) {
  const destination = cities.find((c) => c.id === id);
  if (!destination) return;
  if (busy) {
    toast("Finish your cast before setting sail.");
    return;
  }
  const fare = fareTo(id);
  if (state.cash < fare) {
    toast("Not enough cash for this passage.");
    return;
  }
  state.cash -= fare;
  state.city = id;
  state.spot = destination.spot;
  state.position = { x: 0, z: 40 };
  if (!state.visited.includes(state.spot)) state.visited.push(state.spot);
  if (!state.unlocked.includes(state.spot)) state.unlocked.push(state.spot);
  log(
    "Docked at " + destination.name + (fare ? " · passage $" + fare : "") + ".",
  );
  toast("Welcome to " + destination.name);
  update();
}
function acceptContract(id) {
  if (state.contract) {
    toast("Complete or cancel your current contract first.");
    return;
  }
  if (!deliveryJobs.some((j) => j.id === id)) return;
  state.contract = id;
  toast("Contract accepted. Keep the requested fish!");
  update();
}
function completeContract() {
  const job = jobById();
  if (
    !job ||
    currentCity().id !== job.city ||
    matchingFish(job).length < job.count
  )
    return;
  let remaining = job.count,
    total = 0;
  state.inventory = state.inventory.filter((f) => {
    if (
      remaining &&
      (!job.fish ||
        f.name === job.fish ||
        (job.fish === "Bass" && f.id === "bass"))
    ) {
      remaining--;
      total += marketValue(f);
      return false;
    }
    return true;
  });
  state.cash += total + job.bonus;
  state.deliveries++;
  state.contract = null;
  addXP(job.xp);
  log(
    "Completed " +
      job.name +
      " · fish $" +
      money(total) +
      " + bonus $" +
      job.bonus +
      ".",
  );
  toast("Delivery complete! +$" + money(total + job.bonus));
  update();
}
function cancelContract() {
  state.contract = null;
  toast("Contract cancelled. Your fish are still in your bucket.");
  update();
}
function renderContracts() {
  const active = jobById();
  let summary =
    '<div class="contract-summary"><b>Supply the cities</b><p class="muted">Accept a delivery, catch the requested fish, then sail to its port to turn it in. Payment includes local fish value plus the bonus. Contracts are repeatable; selling fish removes them from delivery progress.</p><b>' +
    state.deliveries +
    " deliveries completed</b></div>";
  if (active) {
    const city = cities.find((c) => c.id === active.city),
      count = Math.min(active.count, matchingFish(active).length);
    summary += `<div class="contract-summary"><h3>Active · ${active.name}</h3><div>${count}/${active.count} ${active.fish || "fish"} · Deliver to ${city.name}</div><p class="muted">Fish value + $${active.bonus} bonus · ${active.xp} XP</p><button class="smallBtn" onclick="completeContract()" ${count < active.count || state.city !== active.city ? "disabled" : ""}>Complete delivery</button><button class="smallBtn" onclick="cancelContract()">Cancel contract</button></div>`;
  }
  return (
    summary +
    '<div class="grid">' +
    deliveryJobs
      .map(
        (job) =>
          `<article class="item"><div class="emoji">📦</div><h3>${job.name}</h3><p>${job.description}</p><p class="contract-progress">+$${job.bonus} bonus · ${job.xp} XP</p><button onclick="acceptContract('${job.id}')" ${active ? "disabled" : ""}>Accept delivery</button></article>`,
      )
      .join("") +
    "</div>"
  );
}
function updateRegion() {
  const city = cities.find((c) => c.id === selectedCity),
    distance =
      Math.hypot(
        city.port[0] - currentCity().port[0],
        city.port[1] - currentCity().port[1],
      ) / 1000;
  $("portName").textContent = city.name;
  $("portDescription").textContent = city.description;
  $("cityArea").textContent =
    (city.w / 1000).toFixed(1) + " × " + (city.h / 1000).toFixed(1) + " km";
  $("marketRate").textContent = "×" + city.market.toFixed(2);
  $("routeDistance").textContent = distance.toFixed(1) + " km";
  $("passageFare").textContent = "$" + fareTo(city.id);
  $("districtList").textContent = city.districts.join(" · ");
  $("sail").textContent =
    city.id === state.city
      ? "Docked here"
      : "Sail to port · $" + fareTo(city.id);
  $("sail").disabled =
    city.id === state.city || busy || state.cash < fareTo(city.id);
  $("dockedAt").textContent =
    "⚓ " +
    currentCity().name +
    " · " +
    spots.find((s) => s.id === state.spot).name;
  $("localMarket").textContent =
    "Local market ×" +
    currentCity().market.toFixed(2) +
    " · " +
    state.deliveries +
    " deliveries";
  drawRegion();
}

const chart = $("regionMap"),
  ctx = chart.getContext("2d");
let camera = { x: 11600, y: 8800, scale: 1 },
  chartWidth = 700,
  chartHeight = 450,
  drag = null;
const WORLD = { w: 24000, h: 18000 };
function fitScale() {
  return Math.min(chartWidth / WORLD.w, chartHeight / WORLD.h);
}
function pixelsPerMetre() {
  return fitScale() * camera.scale;
}
function boundCamera() {
  camera.x = Math.max(0, Math.min(WORLD.w, camera.x));
  camera.y = Math.max(0, Math.min(WORLD.h, camera.y));
}
function focusCity(id) {
  selectedCity = id;
  $("citySelect").value = id;
  const c = cities.find((c) => c.id === id);
  camera = { x: (c.x + c.port[0]) / 2, y: c.y, scale: 3.1 };
  updateRegion();
}
function zoomMap(factor) {
  camera.scale = Math.max(1, Math.min(18, camera.scale * factor));
  boundCamera();
  drawRegion();
}
function resetMap() {
  camera = { x: 12000, y: 9000, scale: 1 };
  drawRegion();
}
function strokePath(points, color, width) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
}
function textAt(text, x, y, size = 12, color = "#f4efd7") {
  ctx.font = `600 ${size / pixelsPerMetre()}px system-ui`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}
// Stable geometry avoids random flicker when panning and keeps old devices lightweight.
function blockSeed(x, y) {
  return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}
function drawCity(city) {
  const left = city.x - city.w / 2,
    top = city.y - city.h / 2,
    s = pixelsPerMetre();
  ctx.fillStyle = "#526756";
  ctx.fillRect(left - 100, top - 100, city.w + 200, city.h + 200);
  // A continuous arterial connects the street grid to the working waterfront.
  strokePath([[city.x, city.y], city.port], "#82867a", 140);
  const block = 220;
  for (let x = left; x < left + city.w; x += block) {
    for (let y = top; y < top + city.h; y += block) {
      const seed = blockSeed(x, y),
        park = seed < 0.12;
      ctx.fillStyle = park ? "#3c614b" : "#253e3d";
      ctx.fillRect(x + 17, y + 17, 184, 184);
      if (s > 0.055 && !park) {
        const central =
          Math.abs(x - city.x) < city.w * 0.22 &&
          Math.abs(y - city.y) < city.h * 0.22;
        const industrial = Math.abs(x - city.port[0]) < 900;
        const cols = central ? 2 : industrial ? 1 : 3,
          unit = 164 / cols;
        for (let a = 0; a < cols; a++) {
          for (let b = 0; b < cols; b++) {
            const bx = x + 27 + a * unit,
              by = y + 27 + b * unit;
            ctx.fillStyle = "#152e31";
            ctx.fillRect(bx + 10, by + 13, unit - 12, unit - 12);
            ctx.fillStyle = central
              ? "#a3a18a"
              : industrial
                ? "#718f8d"
                : seed > 0.5
                  ? "#b39a74"
                  : "#89967e";
            ctx.fillRect(bx, by, unit - 14, unit - 16);
            if (central) {
              ctx.fillStyle = "#627a7a";
              ctx.fillRect(bx + 10, by + 10, unit - 34, unit - 36);
            }
          }
        }
      }
    }
  }
  // Broad boulevards and central green spaces break up residential blocks.
  strokePath(
    [
      [left, city.y],
      [left + city.w, city.y],
    ],
    "#a4a68c",
    65,
  );
  strokePath(
    [
      [city.x, top],
      [city.x, top + city.h],
    ],
    "#a4a68c",
    65,
  );
  ctx.fillStyle = "#477751";
  ctx.fillRect(city.x + 240, city.y - 660, 400, 440);
  ctx.fillStyle = "#ae9870";
  ctx.fillRect(city.port[0] - 150, city.port[1] - 260, 300, 520);
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(city.port[0] - 220, city.port[1] - 210 + i * 130, 500, 36);
  }
  if (camera.scale > 2) {
    city.districts.forEach((name, i) =>
      textAt(
        name,
        left + city.w * (i % 2 ? 0.73 : 0.27),
        top + city.h * (i < 2 ? 0.24 : 0.76),
        10,
        "#e5e6c7",
      ),
    );
    textAt("220 m street blocks", city.x, top - 260, 10, "#b8cbbb");
  }
  textAt(city.name.toUpperCase(), city.x, top - 650, 13);
}
function drawRegion() {
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2),
    s = pixelsPerMetre();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, chartWidth, chartHeight);
  ctx.fillStyle = "#264d42";
  ctx.fillRect(0, 0, chartWidth, chartHeight);
  ctx.save();
  ctx.translate(chartWidth / 2, chartHeight / 2);
  ctx.scale(s, s);
  ctx.translate(-camera.x, -camera.y);
  ctx.strokeStyle = "#36594a";
  ctx.lineWidth = 18;
  for (let x = 0; x <= WORLD.w; x += 1000) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.h);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.h; y += 1000) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.w, y);
    ctx.stroke();
  }
  const river = [
    [11500, -2000],
    [10900, 2000],
    [10600, 4600],
    [12300, 7900],
    [11900, 10000],
    [11100, 12600],
    [13500, 15600],
    [14500, 20000],
  ];
  strokePath(river, "#42746a", 1800);
  strokePath(river, "#0c4654", 1450);
  strokePath(river, "#1c5a65", 820);
  strokePath(
    [
      [0, 17200],
      [7000, 16900],
      [14000, 17400],
      [26000, 16100],
    ],
    "#0c4654",
    3800,
  );
  strokePath(
    [
      [11000, 4700],
      [9700, 4700],
    ],
    "#0c4654",
    420,
  );
  strokePath(
    [
      [12000, 12600],
      [10500, 12600],
    ],
    "#0c4654",
    420,
  );
  // Regional highway, bypasses, and bridges at a consistent physical scale.
  strokePath(
    [
      [6200, -1000],
      [4800, 4500],
      [4700, 10000],
      [4700, 17000],
    ],
    "#9e986d",
    105,
  );
  strokePath(
    [
      [17000, -1000],
      [18300, 7000],
      [18100, 16000],
    ],
    "#9e986d",
    105,
  );
  strokePath(
    [
      [4500, 2300],
      [18300, 2300],
    ],
    "#b3ab7b",
    95,
  );
  strokePath(
    [
      [4400, 10500],
      [18500, 10500],
    ],
    "#b3ab7b",
    95,
  );
  cities.forEach(drawCity);
  ctx.setLineDash([180, 140]);
  strokePath(
    cities.map((c) => c.port),
    "#e5cb7b",
    28,
  );
  ctx.setLineDash([]);
  cities.forEach((c) => {
    ctx.beginPath();
    ctx.arc(...c.port, 7 / s, 0, Math.PI * 2);
    ctx.fillStyle = c.id === state.city ? "#c5f36a" : "#ffd166";
    ctx.fill();
    ctx.strokeStyle = "#082b30";
    ctx.lineWidth = 2 / s;
    ctx.stroke();
    if (c.id === selectedCity) {
      ctx.beginPath();
      ctx.arc(...c.port, 12 / s, 0, Math.PI * 2);
      ctx.strokeStyle = "#fff6ca";
      ctx.stroke();
    }
  });
  textAt("GULF COAST", 18700, 16500, 12, "#8eb8b5");
  ctx.restore();
  ctx.fillStyle = "#e9e9cb";
  ctx.font = "bold 11px system-ui";
  ctx.textAlign = "right";
  ctx.fillText("N ↑", chartWidth - 16, 25);
  const length = camera.scale > 5 ? 200 : camera.scale > 2 ? 500 : 2000;
  ctx.strokeStyle = "#f4efd7";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, chartHeight - 50);
  ctx.lineTo(18 + length * s, chartHeight - 50);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillText(
    length >= 1000 ? length / 1000 + " km" : length + " m",
    18,
    chartHeight - 59,
  );
}
function resizeChart() {
  const rect = chart.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  chartWidth = rect.width;
  chartHeight = rect.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  chart.width = Math.round(chartWidth * dpr);
  chart.height = Math.round(chartHeight * dpr);
  drawRegion();
}
chart.addEventListener("pointerdown", (e) => {
  drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };
  chart.setPointerCapture(e.pointerId);
});
chart.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const s = pixelsPerMetre();
  camera.x -= (e.clientX - drag.x) / s;
  camera.y -= (e.clientY - drag.y) / s;
  drag.x = e.clientX;
  drag.y = e.clientY;
  boundCamera();
  drawRegion();
});
chart.addEventListener("pointerup", (e) => {
  if (!drag) return;
  const clicked =
    Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6;
  drag = null;
  if (clicked) {
    const rect = chart.getBoundingClientRect(),
      s = pixelsPerMetre(),
      x = (e.clientX - rect.left - chartWidth / 2) / s + camera.x,
      y = (e.clientY - rect.top - chartHeight / 2) / s + camera.y;
    const hit = cities.find(
      (c) =>
        Math.hypot(x - c.port[0], y - c.port[1]) * s < 24 ||
        (Math.abs(x - c.x) < c.w / 2 && Math.abs(y - c.y) < c.h / 2),
    );
    if (hit) focusCity(hit.id);
  }
});
chart.addEventListener("pointercancel", () => (drag = null));
chart.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoomMap(e.deltaY < 0 ? 1.2 : 1 / 1.2);
  },
  { passive: false },
);
chart.addEventListener("keydown", (e) => {
  const step = 80 / pixelsPerMetre();
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "+",
      "=",
      "-",
      "0",
    ].includes(e.key)
  )
    e.preventDefault();
  if (e.key === "ArrowLeft") camera.x -= step;
  if (e.key === "ArrowRight") camera.x += step;
  if (e.key === "ArrowUp") camera.y -= step;
  if (e.key === "ArrowDown") camera.y += step;
  if (e.key === "+" || e.key === "=") zoomMap(1.5);
  if (e.key === "-") zoomMap(1 / 1.5);
  if (e.key === "0") resetMap();
  boundCamera();
  drawRegion();
});
$("citySelect").addEventListener("change", (e) => focusCity(e.target.value));
$("zoomIn").addEventListener("click", () => zoomMap(1.6));
$("zoomOut").addEventListener("click", () => zoomMap(1 / 1.6));
$("resetMap").addEventListener("click", resetMap);
$("sail").addEventListener("click", () => sailTo(selectedCity));
window.addEventListener("resize", resizeChart);
selectedCity = state.city;
$("citySelect").value = selectedCity;
resizeChart();
update();
