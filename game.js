/* Browser controls and menus for The Living Bayou. */
"use strict";
const $ = (id) => document.getElementById(id),
  G = Bayou,
  SAVE = "bayouTycoonSave";
let saved;
try {
  saved = JSON.parse(localStorage.getItem(SAVE)) || {};
} catch {
  saved = {};
}
const state = G.createState(saved);
const spots = G.spots;
let busy = false;
function log(text) {
  journal(text);
}
function addXP(n) {
  state.xp += n;
  while (state.xp >= state.level * 60) {
    state.xp -= state.level * 60;
    state.level++;
  }
}
function update() {
  refresh();
  updateRegion();
}
function openCities() {
  world.keys.clear();
  $("cityPanel").showModal();
  resizeChart();
  updateRegion();
}
$("closeCities").addEventListener("click", () => $("cityPanel").close());
const world = new BayouWorld($("world"), state);
let mode = "idle",
  fight = null,
  panelName = "",
  marker = 0.5,
  fightTime = 0,
  lastFrame = 0,
  saveTimer = 0,
  weatherTimer = 0,
  toastTimer,
  catchTimer,
  audio = null;
const money = (n) => Math.floor(n).toLocaleString("en-US");
const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify(state));
    $("saveStatus").textContent = "Progress saved locally";
  } catch {
    $("saveStatus").textContent = "Saving unavailable";
    $("controlHint").textContent =
      "Browser storage is unavailable. Progress lasts for this visit only.";
  }
}
function toast(text) {
  clearTimeout(toastTimer);
  $("toast").textContent = text;
  $("toast").classList.add("show");
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3500);
}
function journal(text) {
  $("journalLine").textContent = text;
}
function refresh() {
  $("cash").textContent = money(state.cash);
  $("level").textContent = state.level;
  $("bucketCount").textContent = state.inventory.length;
  $("speciesCount").textContent =
    Object.keys(state.journal).length + " / 18 species";
  $("locationName").textContent = G.spots.find((p) => p.id === state.spot).name;
  $("baitLabel").textContent =
    state.bait === "lure" ? `Lure · ${state.lures} left` : "Worm · unlimited";
  $("baitShort").textContent = state.bait.toUpperCase();
  $("contractDot").hidden = !G.contracts.some(
    (c) => !state.claimed.includes(c.id) && c.progress(state) >= c.target,
  );
  updateConditions();
  save();
  if ($("panel").open) renderPanel();
}
function updateConditions() {
  const hrs = Math.floor(state.hour),
    mins = Math.floor((state.hour % 1) * 60);
  $("clock").textContent =
    String(hrs).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
  $("weather").textContent = state.weather;
  const p = G.period(state.hour);
  $("conditions").textContent =
    (p === "night"
      ? "Night fishing. The bayou is still awake."
      : p === "dawn"
        ? "Golden-hour water. Watch for rising fish."
        : "Slow water. A little room to breathe.") +
    (state.weather === "Rain" ? " Rain stirs the catfish." : "");
  $("coordinates").textContent = Math.round(state.position.z) + " m upstream";
}
function cast() {
  if ($("panel").open || $("cityPanel").open) return;
  if (mode === "waiting") return;
  if (mode === "fight") {
    reel();
    return;
  }
  clearTimeout(catchTimer);
  $("catchCard").hidden = true;
  fight = G.startCast(state, Math.random, world.isHotspot());
  mode = "waiting";
  busy = true;
  world.casting = true;
  world.biting = false;
  $("cast").disabled = true;
  $("cast").innerHTML = "Watching the float… <span>⋯</span>";
  $("fishingMode").textContent = world.isHotspot()
    ? "CAST INTO A FEEDING POCKET"
    : "LINE IN THE WATER";
  $("status").textContent = "Let it drift. Wait for the float to dip.";
  refresh();
  setTimeout(
    () => {
      mode = "fight";
      fightTime = 0;
      world.biting = true;
      $("fight").hidden = false;
      $("cast").disabled = false;
      $("cast").innerHTML = "Reel in <span>↻</span>";
      $("status").textContent =
        "Fish on! Tap Reel when the marker is in green.";
      $("fishingMode").textContent = "EASY DOES IT · THREE GOOD REELS";
      $("fightCount").textContent = "0 / 3";
      updateTension();
    },
    1800 + Math.random() * 1700,
  );
}
function updateTension() {
  $("tensionBar").style.width = fight.tension + "%";
  $("tensionText").textContent = Math.round(fight.tension) + "%";
}
function reel() {
  const result = G.reel(fight, marker, state.rod);
  $("fightCount").textContent = fight.hits + " / 3";
  updateTension();
  if (result === "caught") {
    const isNew = !state.journal[fight.type.id];
    const f = G.landFish(state, fight.type);
    finish();
    $("status").textContent =
      `Landed a ${f.name}! ${f.lbs.toFixed(1)} lb · $${money(G.marketValue(state, f))}`;
    $("catchCard").hidden = false;
    $("catchRarity").textContent =
      (isNew ? "NEW DISCOVERY · " : "") + f.rarity.toUpperCase();
    $("catchName").textContent = f.name;
    $("catchDetails").textContent =
      `${f.lbs.toFixed(1)} lb / $${money(G.marketValue(state, f))} market value`;
    journal(`${f.name}, ${f.lbs.toFixed(1)} lb. That one is worth a story.`);
    catchTimer = setTimeout(() => ($("catchCard").hidden = true), 8000);
    refresh();
  } else if (result === "escaped") {
    finish();
    $("status").textContent = "The line snapped. Take a breath and try again.";
    journal("The one that got away. There are more out there.");
    toast("Reel in the green zone to keep the line safe.");
  } else
    $("status").textContent =
      result === "good"
        ? "Nice pull. Keep the marker in green."
        : "Too much strain! Wait for the green zone.";
}
function finish() {
  busy = false;
  mode = "idle";
  world.casting = false;
  world.biting = false;
  $("fight").hidden = true;
  $("cast").disabled = false;
  $("cast").innerHTML = "Cast again <span>↗</span>";
  $("fishingMode").textContent = "YOUR NEXT STORY IS OUT THERE";
  save();
}
function showPanel(name) {
  panelName = name;
  world.keys.clear();
  renderPanel();
  if (!$("panel").open) $("panel").showModal();
}
function button(action, label, disabled = false, extra = "") {
  return `<button data-action="${action}" ${disabled ? "disabled" : ""} ${extra}>${label}</button>`;
}
function renderPanel() {
  const titles = {
    inventory: "Your livewell",
    journal: "The fish journal",
    shop: "The outfitter",
    contracts: "The contract board",
    map: "A little further out",
    bait: "The tackle box",
    help: "Welcome to the bayou",
  };
  $("panelTitle").textContent = titles[panelName];
  const root = $("panelContent");
  if (panelName === "inventory") {
    const total = state.inventory.reduce(
      (n, f) => n + G.marketValue(state, f),
      0,
    );
    root.innerHTML =
      '<p class="intro">Fresh from the water. Sell your catch here to fund the next expedition.</p>' +
      (state.inventory.length
        ? state.inventory
            .map(
              (f) =>
                `<div class="row"><span><strong>${escapeHTML(f.name)}</strong><br><small>${f.lbs ? f.lbs.toFixed(1) + " lb" : "Catch from your original save"} · ${escapeHTML(f.rarity || "freshwater")}</small></span><b>$${money(G.marketValue(state, f))}</b></div>`,
            )
            .join("")
        : '<p class="intro">Your livewell is empty. Head back to the water and cast a line.</p>') +
      `<div class="panel-footer"><span>${state.inventory.length} fish aboard</span>${button("sell", "Sell all · $" + money(total), !state.inventory.length, 'class="primary"')}</div>`;
  }
  if (panelName === "journal")
    root.innerHTML = `<p class="intro">${Object.keys(state.journal).length} of 18 species discovered. Habitat and feeding times affect what bites. Your personal records stay with your save.</p><div class="grid">${G.fish
      .map((f) => {
        const j = state.journal[f.id];
        return `<article class="card ${j ? "" : "undiscovered"}"><div class="fish-silhouette" style="--fish:${f.color}"></div><span class="rarity">${f.rarity}${j ? " · DISCOVERED" : ""}</span><h3>${f.name}</h3><p>${f.habitats.map((id) => G.spots.find((s) => s.id === id).name).join(" / ")}<br>Best bite: ${f.time === "dawn" ? "dawn & dusk" : f.time}</p><small>${j ? `${j.count} landed · record ${j.best.toFixed(1)} lb` : "Not discovered yet"}</small></article>`;
      })
      .join("")}</div>`;
  if (panelName === "shop")
    root.innerHTML = `<p class="intro">Better equipment, longer days on the water. Balance: $${money(state.cash)}. Guides earn $${state.crew * 18}/min.</p><div class="grid">${G.upgrades.map((u) => `<article class="card"><span class="rarity">LEVEL ${state[u.id]} / ${u.max}</span><h3>${u.name}</h3><p>${u.description}</p>${button("upgrade:" + u.id, state[u.id] >= u.max ? "Fully upgraded" : "Upgrade · $" + money(G.price(state, u)), state[u.id] >= u.max || state.cash < G.price(state, u))}</article>`).join("")}</div><div class="panel-footer"><small>A fresh $100 supplies grant every UTC day.</small>${button("daily", state.lastDaily === new Date().toISOString().slice(0, 10) ? "Grant collected" : "Collect daily $100", state.lastDaily === new Date().toISOString().slice(0, 10))}</div>`;
  if (panelName === "contracts")
    root.innerHTML = `<p class="intro">A few favors for the folks at the landing. Rewards are paid once per contract.</p><div class="grid">${G.contracts
      .map((c) => {
        const n = Math.min(c.target, c.progress(state)),
          done = state.claimed.includes(c.id);
        return `<article class="card"><span class="rarity">$${c.reward} REWARD</span><h3>${c.name}</h3><p>${c.description}</p><div class="quest-progress"><i style="width:${(n / c.target) * 100}%"></i></div><small>${n} / ${c.target}</small><div style="margin-top:12px">${button("claim:" + c.id, done ? "Completed" : n >= c.target ? "Collect $" + c.reward : "In progress", done || n < c.target)}</div></article>`;
      })
      .join("")}</div>`;
  if (panelName === "contracts") root.innerHTML += renderContracts();
  if (panelName === "map")
    root.innerHTML = `<p class="intro">Four wild regions and two public city waters. Each has its own fish. Travel is paused while a fish is on your line.</p><div class="grid">${G.spots
      .map((s, i) => {
        const unlocked = state.unlocked.includes(s.id);
        return `<article class="card"><span class="rarity">REGION 0${i + 1} · ${G.fish.filter((f) => f.habitats.includes(s.habitat || s.id)).length} SPECIES</span><h3>${s.name}</h3><p>${s.description}</p>${button("travel:" + s.id, s.id === state.spot ? "You are here" : unlocked ? "Travel · $" + G.fareTo(state, s.city) : "Unlock · $" + money(s.cost + G.fareTo(state, s.city)), mode !== "idle" || s.id === state.spot || state.cash < (unlocked ? 0 : s.cost) + G.fareTo(state, s.city))}</article>`;
      })
      .join("")}</div>`;
  if (panelName === "bait")
    root.innerHTML = `<p class="intro">Worms are always free. Lures improve the odds of uncommon and trophy fish; one lure is used per cast.</p><div class="grid"><article class="card"><span class="rarity">UNLIMITED</span><h3>Earthworms</h3><p>A dependable freshwater classic. Never run out.</p>${button("worm", state.bait === "worm" ? "Equipped" : "Equip worms", state.bait === "worm")}</article><article class="card"><span class="rarity">${state.lures} IN YOUR BOX</span><h3>Spinner lures</h3><p>Buy a pack of 5 for $40. Attract rarer fish in every region.</p>${button("buybait", "Buy 5 · $40", state.cash < 40)} ${button("lure", state.bait === "lure" ? "Equipped" : "Equip", !state.lures || state.bait === "lure")}</article></div>`;
  if (panelName === "help")
    root.innerHTML = `<p class="intro">An illustrated, perspective-rendered bayou to explore at your own pace. No downloads, accounts or external art required.</p><ol class="help-list"><li><strong>Explore:</strong> WASD / arrow keys, or tap and hold the steering buttons. Your skiff stays in the channel. The motor upgrade increases speed.</li><li><strong>Aim:</strong> click or tap the water. Cast near surface feeding rings for better rare-fish odds.</li><li><strong>Fish:</strong> Cast / Space, wait for a bite, then tap Reel / Space three times with the marker in green. Red-zone pulls strain the line. There is no time limit.</li><li><strong>Grow:</strong> sell fish from the Livewell, upgrade your gear, claim contracts, and unlock new regions.</li><li><strong>Watch the world:</strong> a full day takes 24 real minutes. Weather changes every 90 seconds; species prefer different conditions.</li><li><strong>Save:</strong> progress is stored in this browser. Your original cash, gear, catches and unlocked regions carry over. Clearing browser data erases the save.</li></ol><p class="intro">Sound is optional synthesized ambience. This is a stylized game world, not a photorealistic or multiplayer simulation.</p>`;
}
$("panelContent").addEventListener("click", (event) => {
  const b = event.target.closest("button[data-action]");
  if (!b || b.disabled) return;
  const [action, id] = b.dataset.action.split(":");
  if (action === "sell") {
    const value = G.sell(state);
    toast("Catch sold · +$" + money(value));
    journal("A good day at the fish market. +$" + money(value));
  }
  if (action === "upgrade" && G.buyUpgrade(state, id))
    toast("Equipment upgraded.");
  if (action === "daily")
    toast(
      G.daily(state)
        ? "Daily supplies · +$100"
        : "Supplies already collected today.",
    );
  if (action === "claim") {
    const value = G.claim(state, id);
    if (value) toast("Contract complete · +$" + value);
  }
  if (action === "travel" && mode === "idle" && G.travel(state, id)) {
    toast("Welcome to " + G.spots.find((s) => s.id === id).name);
    journal("New waters, new possibilities.");
    $("panel").close();
    $("status").textContent = "Find a quiet pocket of water. Cast a line.";
  }
  if (action === "buybait" && G.buyBait(state))
    toast("5 spinner lures packed and equipped.");
  if (action === "worm") state.bait = "worm";
  if (action === "lure" && state.lures) state.bait = "lure";
  refresh();
});
document
  .querySelectorAll("[data-panel]")
  .forEach((b) =>
    b.addEventListener("click", () => showPanel(b.dataset.panel)),
  );
$("closePanel").addEventListener("click", () => $("panel").close());
$("panel").addEventListener("click", (e) => {
  if (e.target === $("panel")) {
    const r = $("panel").getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      $("panel").close();
  }
});
$("openMap").addEventListener("click", openCities);
$("openBait").addEventListener("click", () => showPanel("bait"));
$("help").addEventListener("click", () => showPanel("help"));
$("cast").addEventListener("click", cast);
$("world").addEventListener("pointerdown", (event) => {
  if (mode !== "idle") return;
  const r = $("world").getBoundingClientRect();
  world.setAim(
    (event.clientX - r.left) / r.width,
    (event.clientY - r.top) / r.height,
  );
  $("fishingMode").textContent = world.isHotspot()
    ? "FEEDING POCKET · GOOD WATER"
    : "CASTING SPOT SELECTED";
});
const keyMap = {
  w: "forward",
  ArrowUp: "forward",
  s: "back",
  ArrowDown: "back",
  a: "left",
  ArrowLeft: "left",
  d: "right",
  ArrowRight: "right",
};
window.addEventListener("keydown", (e) => {
  if (
    $("panel").open ||
    $("cityPanel").open ||
    e.target.closest("button,a,input,select,textarea")
  )
    return;
  if (keyMap[e.key]) {
    e.preventDefault();
    world.keys.add(keyMap[e.key]);
  }
  if (e.code === "Space") {
    e.preventDefault();
    if (!e.repeat) cast();
  }
});
window.addEventListener("keyup", (e) => world.keys.delete(keyMap[e.key]));
window.addEventListener("blur", () => world.keys.clear());
document.querySelectorAll("[data-move]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    if (mode === "idle") {
      world.move(b.dataset.move, 5);
      world.keys.add(b.dataset.move);
    }
  });
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(event, () => world.keys.delete(b.dataset.move));
  b.addEventListener("click", (e) => {
    if (e.detail === 0 && mode === "idle") world.move(b.dataset.move, 10);
  });
});
$("sound").addEventListener("click", async () => {
  try {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        toast("Audio is not supported by this browser.");
        return;
      }
      const context = new Audio();
      const buffer = context.createBuffer(
          1,
          context.sampleRate * 3,
          context.sampleRate,
        ),
        data = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < data.length; i++) {
        previous = (previous + Math.random() * 0.04 - 0.02) / 1.015;
        data[i] = previous;
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 650;
      const gain = context.createGain();
      gain.gain.value = 0.4;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
      audio = { context, on: true };
      await context.resume();
    } else {
      audio.on = !audio.on;
      if (audio.on) await audio.context.resume();
      else await audio.context.suspend();
    }
    $("sound").setAttribute("aria-pressed", String(audio.on));
    $("sound").querySelector("span").textContent = audio.on
      ? "Sound on"
      : "Sound off";
  } catch {
    toast("Audio could not start. You can still play without sound.");
  }
});
function frame(ms) {
  const dt = Math.min((ms - lastFrame) / 1000 || 0, 0.05);
  lastFrame = ms;
  const paused = $("panel").open || $("cityPanel").open;
  if (!paused) {
    world.step(dt);
    state.hour = (state.hour + dt / 60) % 24;
    weatherTimer += dt;
    if (weatherTimer >= 90) {
      weatherTimer = 0;
      state.weather = ["Clear", "Overcast", "Rain", "Mist"][
        Math.floor(Math.random() * 4)
      ];
      updateConditions();
    }
    if (mode === "fight") {
      fightTime += dt;
      marker = 0.5 + Math.sin(fightTime * 2.1) * 0.49;
      $("reelMarker").style.left = marker * 100 + "%";
    }
  }
  world.draw();
  saveTimer += dt;
  if (saveTimer >= 5) {
    saveTimer = 0;
    G.tick(state, Date.now());
    refresh();
  }
  requestAnimationFrame(frame);
}
document.addEventListener("visibilitychange", () => {
  world.keys.clear();
  if (document.hidden) {
    G.tick(state, Date.now());
    save();
  } else {
    G.tick(state, Date.now());
    refresh();
    lastFrame = performance.now();
  }
});
window.addEventListener("pagehide", () => {
  G.tick(state, Date.now());
  save();
});
refresh();
requestAnimationFrame(frame);
