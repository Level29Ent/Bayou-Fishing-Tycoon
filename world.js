/* A dependency-free perspective landscape. All artwork is drawn locally. */
(function (root) {
  "use strict";
  const bankCenter = (z) => Math.sin(z * 0.004) * 58 + Math.sin(z * 0.009) * 18;
  class BayouWorld {
    constructor(canvas, state) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.state = state;
      this.time = 0;
      this.keys = new Set();
      this.aim = { x: 0.57, y: 0.58 };
      this.casting = false;
      this.biting = false;
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.resize = () => {
        const r = canvas.getBoundingClientRect();
        this.w = r.width;
        this.h = r.height;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(this.w * dpr);
        canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      window.addEventListener("resize", this.resize);
      this.resize();
      this.makeScenery();
    }
    makeScenery() {
      let seed = 821;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      this.trees = [];
      for (let z = -120; z < 3100; z += 22) {
        for (const side of [-1, 1]) {
          this.trees.push({
            x: bankCenter(z) + side * (100 + random() * 115),
            z: z + random() * 22,
            size: 17 + random() * 22,
            shape: random(),
            side,
          });
        }
      }
      this.reeds = [];
      for (let i = 0; i < 180; i++) {
        const z = random() * 3100;
        this.reeds.push({
          x: bankCenter(z) + (i % 2 ? 1 : -1) * (87 + random() * 18),
          z,
          size: 2 + random() * 3,
        });
      }
    }
    setAim(x, y) {
      this.aim = {
        x: Bayou.clamp(x, 0.16, 0.84),
        y: Bayou.clamp(y, 0.46, 0.69),
      };
    }
    move(direction, amount = 9) {
      const s = this.state;
      const oldCenter = bankCenter(s.position.z);
      if (direction === "forward") s.position.z += amount;
      if (direction === "back") s.position.z -= amount;
      if (direction === "left") s.position.x -= amount;
      if (direction === "right") s.position.x += amount;
      s.position.z = Bayou.clamp(s.position.z, 0, 2200);
      s.position.x += bankCenter(s.position.z) - oldCenter;
      s.position.x = Bayou.clamp(
        s.position.x,
        bankCenter(s.position.z) - 65,
        bankCenter(s.position.z) + 65,
      );
    }
    step(dt) {
      this.time += dt;
      if (!this.casting) {
        for (const key of this.keys)
          this.move(key, dt * (20 + this.state.boat * 5));
      }
    }
    project(x, z, height = 0) {
      const d = z - this.state.position.z;
      if (d < 5) return null;
      const scale = (this.w * 0.72) / (d + 35);
      return {
        x: this.w / 2 + (x - this.state.position.x) * scale,
        y: this.h * 0.385 + (26 - height) * scale,
        scale,
        d,
      };
    }
    path(points, fill, stroke, lineWidth = 1) {
      const c = this.ctx;
      c.beginPath();
      points.forEach((p, i) =>
        i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]),
      );
      if (fill) {
        c.closePath();
        c.fillStyle = fill;
        c.fill();
      }
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = lineWidth;
        c.stroke();
      }
    }
    ellipse(x, y, rx, ry, color) {
      const c = this.ctx;
      c.beginPath();
      c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
    }
    draw() {
      const c = this.ctx,
        w = this.w,
        h = this.h,
        t = this.reduced ? 0 : this.time,
        s = this.state;
      const spot = Bayou.spots.find((p) => p.id === s.spot);
      const night = Bayou.period(s.hour) === "night",
        gold = Bayou.period(s.hour) === "dawn";
      const rainy = s.weather === "Rain",
        mist = s.weather === "Mist";
      c.clearRect(0, 0, w, h);
      const sky = c.createLinearGradient(0, 0, 0, h * 0.46);
      sky.addColorStop(
        0,
        night ? "#152b40" : rainy ? "#607c81" : gold ? "#859e9e" : "#7fa9b3",
      );
      sky.addColorStop(0.7, night ? "#52656b" : gold ? "#e2cea4" : spot.sky);
      sky.addColorStop(1, night ? "#77847a" : "#e4dfbf");
      c.fillStyle = sky;
      c.fillRect(0, 0, w, h);
      const sunX = w * 0.67,
        sunY = h * (night ? 0.17 : 0.26);
      const glow = c.createRadialGradient(sunX, sunY, 8, sunX, sunY, w * 0.28);
      glow.addColorStop(0, night ? "#e1eee348" : "#fff0b74a");
      glow.addColorStop(1, "#eedba000");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h * 0.5);
      this.ellipse(
        sunX,
        sunY,
        night ? 13 : 24,
        night ? 13 : 24,
        night ? "#e3ead5" : "#f7e7b8",
      );
      if (night) {
        for (let i = 0; i < 42; i++)
          this.ellipse(
            (i * 137.7) % w,
            (i * 41.3) % (h * 0.3),
            0.7,
            0.7,
            "#f1eac7aa",
          );
      }
      // Wisps and a distant treeline establish a misty horizon.
      for (let layer = 0; layer < 3; layer++) {
        const y = h * (0.37 + layer * 0.014);
        const pts = [[0, h * 0.47]];
        for (let x = 0; x <= w + 20; x += 14)
          pts.push([
            x,
            y -
              Math.sin(x * 0.031 + layer * 9) * 7 -
              Math.sin(x * 0.013 + layer) * 12,
          ]);
        pts.push([w, h * 0.47]);
        this.path(
          pts,
          night
            ? ["#496066", "#3b5657", "#2d4e4c"][layer]
            : ["#859e8a", "#6c8a74", "#4f725f"][layer],
        );
      }
      const water = c.createLinearGradient(0, h * 0.38, 0, h);
      water.addColorStop(0, night ? "#445d5c" : spot.water);
      water.addColorStop(
        0.45,
        night ? "#1a363e" : rainy ? "#34504d" : "#527c6b",
      );
      water.addColorStop(1, night ? "#142f39" : "#244c48");
      c.fillStyle = water;
      c.fillRect(0, h * 0.405, w, h * 0.6);
      // Faint reflected light runs toward the viewer.
      for (let i = 0; i < 50; i++) {
        const y = h * 0.42 + i * i * 0.21;
        const spread = 12 + i * 3.2;
        const x = sunX + Math.sin(i * 7 + t * 0.7) * spread * 0.25;
        this.path(
          [
            [x - spread, y],
            [x + spread, y],
          ],
          null,
          night ? "#d7dfbc0b" : "#f7e7b815",
          1 + i * 0.055,
        );
      }
      // Banks are sampled from the same channel function used by boat collision.
      for (const side of [-1, 1]) {
        const points = [];
        for (let d = 1500; d >= 9; d -= 12) {
          const z = s.position.z + d,
            p = this.project(bankCenter(z) + side * 91, z);
          if (p) points.push([p.x, p.y]);
        }
        points.push(
          [side < 0 ? -w : w * 2, h * 2],
          [side < 0 ? -w : w * 2, h * 0.39],
        );
        this.path(points, night ? "#223c32" : spot.bank);
        const edge = [];
        for (let d = 10; d < 1300; d += 12) {
          const z = s.position.z + d,
            p = this.project(bankCenter(z) + side * 90, z);
          edge.push([p.x, p.y + 2]);
        }
        this.path(edge, null, "#d3c58a38", 2);
      }
      // Moving wavelets and tree reflections.
      for (let i = 0; i < 100; i++) {
        const q = (i * 13.731 + t * 0.7) % 100;
        const depth = 15 + q * q * 0.14;
        const z = s.position.z + depth;
        const x = bankCenter(z) + Math.sin(i * 19.3) * 83;
        const p = this.project(x, z);
        if (p && p.y < h) {
          const len = Math.min(36, p.scale * (3 + Math.sin(i) * 2));
          this.path(
            [
              [p.x - len, p.y],
              [p.x + len, p.y + Math.sin(t + i) * 0.7],
            ],
            null,
            i % 3 === 0 ? "#c5d7b133" : "#102f3430",
            Math.max(0.5, p.scale * 0.16),
          );
        }
      }
      const objects = this.trees
        .filter((o) => o.z > s.position.z + 6 && o.z < s.position.z + 1500)
        .sort((a, b) => b.z - a.z);
      for (const tree of objects) {
        const p = this.project(tree.x, tree.z);
        if (!p || p.x < -w * 0.4 || p.x > w * 1.4) continue;
        this.drawTree(p, tree, spot, night, t);
      }
      for (const reed of this.reeds) {
        const p = this.project(reed.x, reed.z);
        if (!p || p.d > 500 || p.x < 0 || p.x > w || p.y > h) continue;
        for (let j = 0; j < 4; j++) {
          const shift = Math.sin(t + j) * p.scale * 0.5;
          this.path(
            [
              [p.x + j * 2, p.y],
              [
                p.x + j * 2 + shift - 4 * p.scale,
                p.y - reed.size * p.scale * 3,
              ],
            ],
            null,
            night ? "#3b5942" : "#9ba66c",
            Math.max(0.6, p.scale * 0.45),
          );
        }
      }
      // A modest timber landing, visible from the starting position.
      const dock = this.project(-70, 110);
      if (dock && dock.d < 600) {
        const k = dock.scale;
        for (let i = 0; i < 8; i++) {
          this.path(
            [
              [dock.x - i * 7 * k, dock.y - i * k],
              [dock.x + 34 * k - i * 7 * k, dock.y - 6 * k - i * k],
              [dock.x + 34 * k - i * 7 * k, dock.y - 2 * k - i * k],
              [dock.x - i * 7 * k, dock.y + 4 * k - i * k],
            ],
            "#85754f",
            "#3e4938",
            0.7,
          );
        }
        for (const dx of [0, 32])
          this.path(
            [
              [dock.x + dx * k, dock.y - 7 * k],
              [dock.x + dx * k, dock.y + 17 * k],
            ],
            null,
            "#59583b",
            3 * k,
          );
      }
      // Surface feeding rings are useful casting targets, not just decoration.
      for (let i = 0; i < 3; i++) {
        const x = w * (0.32 + i * 0.18) + Math.sin(t * 0.2 + i) * 18,
          y = h * (0.49 + i * 0.035);
        const phase = (t * 0.4 + i * 0.35) % 1;
        c.strokeStyle = "#e1e6b2" + (i === 1 ? "77" : "44");
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(x, y, 9 + phase * 23, 2 + phase * 5, 0, 0, Math.PI * 2);
        c.stroke();
        if (i === 1) {
          this.hotspot = { x: x / w, y: y / h };
        }
      }
      // Herons and distant birds.
      for (let i = 0; i < 4; i++) {
        const x = ((t * 8 + i * w * 0.27) % (w + 80)) - 40,
          y = h * 0.24 + Math.sin(i * 7 + t * 0.13) * 22;
        const flap = Math.sin(t * 3 + i) * 4;
        this.path(
          [
            [x - 7, y - flap],
            [x, y],
            [x + 7, y - flap],
          ],
          null,
          night ? "#9baaa377" : "#314c4ba6",
          1.2,
        );
      }
      if (mist || rainy) {
        for (let i = 0; i < 7; i++) {
          const y = h * (0.37 + i * 0.045);
          const fog = c.createLinearGradient(0, y - 25, 0, y + 25);
          fog.addColorStop(0, "#cad4bf00");
          fog.addColorStop(0.5, mist ? "#cad4bf24" : "#cad4bf0c");
          fog.addColorStop(1, "#cad4bf00");
          c.fillStyle = fog;
          c.fillRect(0, y - 25, w, 50);
        }
      }
      if (rainy && !this.reduced) {
        c.strokeStyle = "#c8d9d24a";
        c.lineWidth = 0.7;
        for (let i = 0; i < 100; i++) {
          const x = (i * 79 + t * 35) % w,
            y = (i * 127 + t * 300) % h;
          this.path(
            [
              [x, y],
              [x - 3, y + 12],
            ],
            null,
            "#c8d9d24a",
            0.7,
          );
        }
      }
      if (night) {
        for (let i = 0; i < 16; i++) {
          const x = (Math.sin(i * 62 + t * 0.2) * 0.5 + 0.5) * w,
            y = h * (0.44 + (Math.cos(i + t * 0.3) * 0.5 + 0.5) * 0.18);
          this.ellipse(x, y, 1.4, 1.4, "#d7e8a477");
        }
      }
      this.drawBoat(t);
      const aim = this.aim;
      const ax = aim.x * w,
        ay = aim.y * h;
      if (this.casting) {
        this.path(
          [
            [w * 0.72, h * 0.96],
            [w * 0.6, h * 0.57],
            [ax, ay],
          ],
          null,
          "#e4d9ad99",
          1,
        );
        this.ellipse(
          ax,
          ay + Math.sin(t * 4) * 2,
          3,
          this.biting ? 7 : 4,
          this.biting ? "#f5ca68" : "#e2b7a1",
        );
        c.strokeStyle = "#f3e6ba77";
        c.beginPath();
        c.ellipse(ax, ay + 4, 10 + Math.sin(t * 5) * 3, 3, 0, 0, Math.PI * 2);
        c.stroke();
      } else {
        c.strokeStyle = "#e6e9cf88";
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(ax, ay, 11, 4, 0, 0, Math.PI * 2);
        c.stroke();
        this.path(
          [
            [ax - 16, ay],
            [ax - 8, ay],
          ],
          null,
          "#e6e9cf99",
        );
        this.path(
          [
            [ax + 8, ay],
            [ax + 16, ay],
          ],
          null,
          "#e6e9cf99",
        );
      }
    }
    drawTree(p, tree, spot, night, t) {
      const c = this.ctx,
        k = p.scale;
      const marsh = ["marsh", "delta"].includes(spot.habitat || spot.id);
      const height = tree.size * (marsh ? 0.7 : 1);
      const x = p.x,
        y = p.y;
      const alpha = Bayou.clamp(1 - p.d / 1900, 0.1, 1);
      c.save();
      c.globalAlpha = alpha;
      this.ellipse(
        x,
        y + height * k * 0.45,
        8 * k,
        height * k * 0.75,
        "#173c3733",
      );
      const trunk = night ? "#293d35" : "#4b5140";
      this.path(
        [
          [x - 2.4 * k, y],
          [x - 1.3 * k, y - height * k],
          [x + 1.3 * k, y - height * k],
          [x + 3 * k, y],
        ],
        trunk,
      );
      for (let j = 0; j < 4; j++) {
        const by = y - height * k * (0.35 + j * 0.15),
          side = j % 2 ? 1 : -1;
        this.path(
          [
            [x, by + 8 * k],
            [x + side * 9 * k, by - 5 * k],
            [x + side * 13 * k, by - 7 * k],
          ],
          null,
          trunk,
          1.5 * k,
        );
      }
      const color = night
        ? "#243e36"
        : tree.shape > 0.5
          ? "#3c6048"
          : "#466a4d";
      for (let j = 0; j < 5; j++) {
        const cy = y - height * k * (0.45 + j * 0.13);
        const spread = (height * 0.36 - j * height * 0.055) * k;
        this.ellipse(
          x + Math.sin(j + tree.shape * 10) * k * 2,
          cy,
          spread,
          spread * 0.45,
          color,
        );
      }
      if (!marsh) {
        for (let j = 0; j < 7; j++) {
          const mx = x + (j - 3) * height * k * 0.065,
            my = y - height * k * (0.48 + (j % 3) * 0.1);
          this.path(
            [
              [mx, my],
              [mx + Math.sin(t * 0.4 + j) * k, my + height * k * 0.28],
            ],
            null,
            night ? "#65776266" : "#a7b39a88",
            Math.max(0.5, k * 0.65),
          );
        }
      }
      c.restore();
    }
    drawBoat(t) {
      const w = this.w,
        h = this.h;
      const bob = Math.sin(t * 1.4) * 2;
      const top = h * 0.71 + bob;
      this.path(
        [
          [w * 0.5, top],
          [w * 0.64, h * 0.93],
          [w * 0.68, h * 1.12],
          [w * 0.32, h * 1.12],
          [w * 0.36, h * 0.93],
        ],
        "#777d61",
        "#a8ac8480",
        2,
      );
      this.path(
        [
          [w * 0.5, top + 12],
          [w * 0.615, h * 0.94],
          [w * 0.64, h * 1.1],
          [w * 0.36, h * 1.1],
          [w * 0.385, h * 0.94],
        ],
        "#394f45",
        "#263e34",
        2,
      );
      this.path(
        [
          [w * 0.5, top + 22],
          [w * 0.5, h],
        ],
        null,
        "#8d917044",
        1,
      );
      this.path(
        [
          [w * 0.365, h * 0.93],
          [w * 0.635, h * 0.93],
          [w * 0.64, h * 0.956],
          [w * 0.36, h * 0.956],
        ],
        "#8c8665",
        "#ada17a66",
      );
      this.path(
        [
          [w * 0.71, h * 1.08],
          [w * 0.62, h * 0.67],
        ],
        null,
        "#242e29",
        5,
      );
      this.path(
        [
          [w * 0.62, h * 0.67],
          [w * 0.59, h * 0.54],
        ],
        null,
        "#c7b88c",
        1.5,
      );
    }
    isHotspot() {
      return (
        this.hotspot &&
        Math.hypot(
          this.aim.x - this.hotspot.x,
          (this.aim.y - this.hotspot.y) * 1.8,
        ) < 0.13
      );
    }
  }
  root.BayouWorld = BayouWorld;
})(globalThis);
