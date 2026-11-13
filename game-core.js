/* Game rules are independent of the renderer so saves and progression can be tested. */
(function (root) {
  "use strict";
  const fish = [
    [
      "bluegill",
      "Bluegill",
      12,
      5,
      42,
      0.4,
      1.8,
      "common",
      ["cypress", "marsh"],
      "day",
      "#87ada0",
    ],
    [
      "redear",
      "Redear Sunfish",
      18,
      6,
      32,
      0.5,
      2.2,
      "common",
      ["cypress", "marsh"],
      "day",
      "#bd9c5c",
    ],
    [
      "crappie",
      "Black Crappie",
      26,
      9,
      25,
      0.7,
      3,
      "common",
      ["cypress", "marsh"],
      "dawn",
      "#a5c3b0",
    ],
    [
      "catfish",
      "Channel Catfish",
      32,
      10,
      24,
      2,
      16,
      "common",
      ["cypress", "marsh", "bayou"],
      "night",
      "#84999e",
    ],
    [
      "bass",
      "Largemouth Bass",
      48,
      14,
      18,
      1.5,
      12,
      "uncommon",
      ["cypress", "marsh", "bayou"],
      "dawn",
      "#6e985a",
    ],
    [
      "bowfin",
      "Bowfin",
      55,
      16,
      12,
      3,
      14,
      "uncommon",
      ["cypress", "bayou"],
      "night",
      "#74854b",
    ],
    [
      "perch",
      "Yellow Perch",
      22,
      8,
      28,
      0.4,
      2.8,
      "common",
      ["marsh"],
      "day",
      "#c9b653",
    ],
    [
      "pickerel",
      "Chain Pickerel",
      65,
      18,
      13,
      2,
      8,
      "uncommon",
      ["marsh"],
      "day",
      "#8d9e4d",
    ],
    [
      "buffalo",
      "Smallmouth Buffalo",
      80,
      20,
      10,
      8,
      30,
      "uncommon",
      ["marsh", "bayou"],
      "dawn",
      "#b1a17c",
    ],
    [
      "gar",
      "Alligator Gar",
      130,
      28,
      6,
      15,
      90,
      "rare",
      ["bayou", "marsh"],
      "night",
      "#879473",
    ],
    [
      "flathead",
      "Flathead Catfish",
      110,
      25,
      9,
      10,
      65,
      "rare",
      ["bayou"],
      "night",
      "#a89461",
    ],
    [
      "bluecat",
      "Blue Catfish",
      145,
      30,
      6,
      12,
      85,
      "rare",
      ["bayou", "delta"],
      "rain",
      "#a6b8c2",
    ],
    [
      "paddlefish",
      "Paddlefish",
      210,
      38,
      3,
      20,
      70,
      "epic",
      ["bayou"],
      "dawn",
      "#7da0a8",
    ],
    [
      "redfish",
      "Red Drum",
      95,
      24,
      18,
      4,
      28,
      "uncommon",
      ["delta"],
      "day",
      "#ba835e",
    ],
    [
      "trout",
      "Spotted Seatrout",
      75,
      20,
      22,
      1,
      9,
      "uncommon",
      ["delta"],
      "dawn",
      "#adbfb2",
    ],
    [
      "flounder",
      "Southern Flounder",
      105,
      25,
      14,
      1,
      12,
      "rare",
      ["delta"],
      "rain",
      "#9f9367",
    ],
    [
      "tarpon",
      "Tarpon",
      280,
      45,
      3,
      25,
      130,
      "epic",
      ["delta"],
      "day",
      "#c0d5d5",
    ],
    [
      "koi",
      "Golden Koi",
      350,
      60,
      1,
      4,
      22,
      "legendary",
      ["cypress", "delta"],
      "dawn",
      "#f7c96a",
    ],
  ].map(
    ([
      id,
      name,
      value,
      xp,
      weight,
      min,
      max,
      rarity,
      habitats,
      time,
      color,
    ]) => ({
      id,
      name,
      value,
      xp,
      weight,
      min,
      max,
      rarity,
      habitats,
      time,
      color,
    }),
  );
  const spots = [
    {
      id: "cypress",
      name: "Cypress Landing",
      cost: 0,
      description: "Flooded timber, moss-draped cypress and quiet freshwater.",
      water: "#365e55",
      sky: "#b4c9b3",
      bank: "#536841",
    },
    {
      id: "marsh",
      name: "Whispering Marsh",
      cost: 350,
      description: "Sunlit reed beds and shallow channels. Pickerel country.",
      water: "#477263",
      sky: "#c6d5bd",
      bank: "#83935a",
    },
    {
      id: "bayou",
      name: "Blackwater Bayou",
      cost: 1200,
      description: "Deep, dark water. Giant catfish and ancient gar lurk here.",
      water: "#263f43",
      sky: "#9bafad",
      bank: "#354c3e",
    },
    {
      id: "delta",
      name: "Golden Delta",
      cost: 3000,
      description: "Wide brackish water, salt grass and silver trophy fish.",
      water: "#3c7978",
      sky: "#b9d5d3",
      bank: "#a09b65",
    },
  ];
  spots[0].city = "cypress";
  spots[1].city = "cypress";
  spots[2].city = "belle";
  spots[3].city = "gulf";
  spots.push(
    {
      id: "riverfront",
      name: "Belle Rive Riverfront",
      city: "belle",
      habitat: "marsh",
      cost: 0,
      description: "Public fishing below the city bridges.",
      water: "#4b6c65",
      sky: "#b6c7c0",
      bank: "#647e58",
    },
    {
      id: "harbor",
      name: "Soleil Harbor",
      city: "gulf",
      habitat: "delta",
      cost: 0,
      description: "Coastal fishing alongside the working docks.",
      water: "#387478",
      sky: "#c3d6d4",
      bank: "#939766",
    },
  );
  const ports = {
    cypress: { point: [9700, 4700], market: 1, spot: "cypress" },
    belle: { point: [12200, 7900], market: 1.15, spot: "riverfront" },
    gulf: { point: [10500, 12600], market: 1.3, spot: "harbor" },
  };
  function fareTo(s, id) {
    if (!ports[id]) return Infinity;
    const from = ports[s.city] || ports.cypress;
    return Math.ceil(
      (Math.hypot(
        ports[id].point[0] - from.point[0],
        ports[id].point[1] - from.point[1],
      ) /
        1000) *
        4,
    );
  }
  function marketValue(s, f) {
    return Math.round(f.worth * (ports[s.city]?.market || 1));
  }
  const upgrades = [
    {
      id: "rod",
      name: "Carbon rod",
      base: 100,
      max: 10,
      description: "More rare bites and easier reeling.",
    },
    {
      id: "boat",
      name: "Skiff motor",
      base: 180,
      max: 8,
      description: "Explore the water faster.",
    },
    {
      id: "net",
      name: "Livewell",
      base: 250,
      max: 10,
      description: "Keep fish fresh: +25% sale value per level.",
    },
    {
      id: "crew",
      name: "Local guide",
      base: 350,
      max: 10,
      description:
        "Earn $18 per minute per guide, including up to 10 minutes away.",
    },
  ];
  const contracts = [
    {
      id: "first",
      name: "Supper at the landing",
      description: "Land 3 fish.",
      target: 3,
      reward: 120,
      progress: (s) => s.caught,
    },
    {
      id: "explore",
      name: "Beyond the landing",
      description: "Visit 2 different fishing regions.",
      target: 2,
      reward: 200,
      progress: (s) => s.visited.length,
    },
    {
      id: "collector",
      name: "Bayou naturalist",
      description: "Discover 5 different species.",
      target: 5,
      reward: 300,
      progress: (s) => Object.keys(s.journal).length,
    },
    {
      id: "angler",
      name: "A proper fishing story",
      description: "Land 20 fish.",
      target: 20,
      reward: 500,
      progress: (s) => s.caught,
    },
    {
      id: "trophy",
      name: "Something extraordinary",
      description: "Land a rare, epic or legendary fish.",
      target: 1,
      reward: 250,
      progress: (s) =>
        Object.values(s.journal).filter((j) =>
          ["rare", "epic", "legendary"].includes(j.rarity),
        ).length,
    },
  ];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function createState(saved = {}, now = Date.now()) {
    const s = {
      city: "cypress",
      contract: null,
      deliveries: 0,
      cash: 150,
      caught: 0,
      xp: 0,
      level: 1,
      rod: 1,
      boat: 1,
      net: 1,
      crew: 0,
      spot: "cypress",
      unlocked: ["cypress"],
      inventory: [],
      journal: {},
      claimed: [],
      visited: ["cypress"],
      bait: "worm",
      lures: 0,
      lastDaily: "",
      lastTick: now,
      hour: 7.5,
      weather: "Clear",
      position: { x: 0, z: 40 },
      ...saved,
    };
    for (const key of [
      "cash",
      "caught",
      "xp",
      "level",
      "rod",
      "boat",
      "net",
      "crew",
      "lures",
    ])
      if (!Number.isFinite(s[key]) || s[key] < 0)
        s[key] = key === "level" ? 1 : 0;
    for (const u of upgrades)
      s[u.id] = clamp(Math.floor(s[u.id]), u.id === "crew" ? 0 : 1, u.max);
    s.level = Math.max(1, Math.floor(s.level));
    s.deliveries = Number.isFinite(s.deliveries)
      ? Math.max(0, Math.floor(s.deliveries))
      : 0;
    s.unlocked = Array.isArray(s.unlocked)
      ? s.unlocked.filter((id) => spots.some((p) => p.id === id))
      : ["cypress"];
    if (!s.unlocked.includes("cypress")) s.unlocked.unshift("cypress");
    if (
      spots.some((p) => p.id === s.spot && p.cost === 0) &&
      !s.unlocked.includes(s.spot)
    )
      s.unlocked.push(s.spot);
    if (!s.unlocked.includes(s.spot)) s.spot = "cypress";
    s.city = spots.find((p) => p.id === s.spot).city;
    s.visited = Array.isArray(s.visited)
      ? s.visited.filter((id) => s.unlocked.includes(id))
      : ["cypress"];
    if (!s.visited.includes(s.spot)) s.visited.push(s.spot);
    s.inventory = Array.isArray(s.inventory)
      ? s.inventory.filter(
          (f) =>
            f &&
            typeof f.name === "string" &&
            Number.isFinite(f.worth) &&
            f.worth >= 0,
        )
      : [];
    s.journal =
      s.journal && typeof s.journal === "object" && !Array.isArray(s.journal)
        ? s.journal
        : {};
    // The original game saved names rather than species IDs. Keep their sale values intact.
    for (const f of s.inventory) {
      const type = fish.find(
        (t) =>
          t.id === f.id ||
          t.name === f.name ||
          (f.name === "Catfish" && t.id === "catfish") ||
          (f.name === "Bass" && t.id === "bass"),
      );
      if (type && !s.journal[type.id])
        s.journal[type.id] = {
          count: 1,
          best: f.lbs || 0,
          rarity: type.rarity,
        };
    }
    s.claimed = Array.isArray(s.claimed) ? s.claimed : [];
    s.position =
      s.position &&
      Number.isFinite(s.position.x) &&
      Number.isFinite(s.position.z)
        ? s.position
        : { x: 0, z: 40 };
    s.hour = Number.isFinite(s.hour) ? ((s.hour % 24) + 24) % 24 : 7.5;
    if (!["Clear", "Overcast", "Rain", "Mist"].includes(s.weather))
      s.weather = "Clear";
    if (!["worm", "lure"].includes(s.bait) || !s.lures) s.bait = "worm";
    s.lastTick = Number.isFinite(s.lastTick) ? s.lastTick : now;
    tick(s, now);
    return s;
  }
  function tick(s, now) {
    const elapsed = clamp((now - s.lastTick) / 60000, 0, 10);
    const earned = s.crew * 18 * elapsed;
    s.cash += earned;
    s.lastTick = now;
    return earned;
  }
  function price(s, u) {
    return Math.round(u.base * Math.pow(1.62, s[u.id]));
  }
  function buyUpgrade(s, id) {
    const u = upgrades.find((u) => u.id === id);
    if (!u || s[id] >= u.max || s.cash < price(s, u)) return false;
    s.cash -= price(s, u);
    s[id]++;
    return true;
  }
  function travel(s, id) {
    const spot = spots.find((p) => p.id === id);
    if (!spot) return false;
    const cost =
      (s.unlocked.includes(id) ? 0 : spot.cost) + fareTo(s, spot.city);
    if (s.cash < cost) return false;
    s.cash -= cost;
    if (!s.unlocked.includes(id)) s.unlocked.push(id);
    s.city = spot.city;
    s.spot = id;
    if (!s.visited.includes(id)) s.visited.push(id);
    s.position = { x: 0, z: 40 };
    return true;
  }
  function period(hour) {
    return hour < 6 || hour >= 19
      ? "night"
      : hour < 9 || hour >= 16
        ? "dawn"
        : "day";
  }
  function candidates(s, hotspot = false) {
    return fish
      .filter((f) =>
        f.habitats.includes(
          spots.find((p) => p.id === s.spot).habitat || s.spot,
        ),
      )
      .map((f) => ({
        fish: f,
        weight:
          f.weight *
          (f.time === period(s.hour) ? 2 : 1) *
          (f.time === "rain" && s.weather === "Rain" ? 3 : 1) *
          (f.rarity !== "common"
            ? 1 +
              (s.rod - 1) * 0.16 +
              (s.bait === "lure" && s.lures ? 1.2 : 0) +
              (hotspot ? 0.65 : 0)
            : 1),
      }));
  }
  function chooseFish(s, random = Math.random, hotspot = false) {
    const pool = candidates(s, hotspot);
    let roll = random() * pool.reduce((n, f) => n + f.weight, 0);
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) return entry.fish;
    }
    return pool[pool.length - 1].fish;
  }
  function landFish(s, type, random = Math.random) {
    const lbs =
      Math.round((type.min + random() * (type.max - type.min)) * 10) / 10;
    const size = 0.7 + (0.8 * (lbs - type.min)) / (type.max - type.min);
    const worth = Math.round(
      type.value *
        size *
        (1 + (s.net - 1) * 0.25) *
        (1 + (s.level - 1) * 0.025),
    );
    const catchData = {
      id: type.id,
      name: type.name,
      lbs,
      worth,
      rarity: type.rarity,
      color: type.color,
    };
    s.inventory.push(catchData);
    s.caught++;
    s.xp += type.xp;
    while (s.xp >= s.level * 60) {
      s.xp -= s.level * 60;
      s.level++;
    }
    const j = s.journal[type.id] || { count: 0, best: 0, rarity: type.rarity };
    j.count++;
    j.best = Math.max(j.best, lbs);
    s.journal[type.id] = j;
    return catchData;
  }
  function sell(s) {
    const value = s.inventory.reduce((n, f) => n + marketValue(s, f), 0);
    s.cash += value;
    s.inventory = [];
    return value;
  }
  function claim(s, id) {
    const c = contracts.find((c) => c.id === id);
    if (!c || s.claimed.includes(id) || c.progress(s) < c.target) return 0;
    s.claimed.push(id);
    s.cash += c.reward;
    return c.reward;
  }
  function daily(s, date = new Date().toISOString().slice(0, 10)) {
    if (s.lastDaily === date) return false;
    s.lastDaily = date;
    s.cash += 100;
    return true;
  }
  function buyBait(s) {
    if (s.cash < 40) return false;
    s.cash -= 40;
    s.lures += 5;
    s.bait = "lure";
    return true;
  }
  function startCast(s, random = Math.random, hotspot = false) {
    const type = chooseFish(s, random, hotspot);
    if (s.bait === "lure" && s.lures > 0) {
      s.lures--;
      if (!s.lures) s.bait = "worm";
    }
    return { type, hits: 0, tension: 25 };
  }
  function reel(fight, position, rod) {
    const good = position >= 0.17 && position <= 0.83;
    if (good) {
      fight.hits++;
      fight.tension = Math.max(5, fight.tension - 12);
    } else fight.tension += Math.max(14, 30 - rod * 2);
    return fight.hits >= 3
      ? "caught"
      : fight.tension >= 100
        ? "escaped"
        : good
          ? "good"
          : "miss";
  }
  root.Bayou = {
    fish,
    spots,
    ports,
    fareTo,
    marketValue,
    upgrades,
    contracts,
    clamp,
    createState,
    tick,
    price,
    buyUpgrade,
    travel,
    period,
    candidates,
    chooseFish,
    landFish,
    sell,
    claim,
    daily,
    buyBait,
    startCast,
    reel,
  };
  if (typeof module !== "undefined") module.exports = root.Bayou;
})(globalThis);
