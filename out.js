(() => {
  // helpers.js
  var CIRCLE = Math.PI * 2;
  var MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

  // Controls.js
  var Controls = class {
    codes = {65: "left", 68: "right", 87: "forward", 83: "backward"};
    states = {"left": false, "right": false, "forward": false, "backward": false};
    constructor() {
      document.addEventListener("keydown", this.onKey.bind(this, true), false);
      document.addEventListener("keyup", this.onKey.bind(this, false), false);
      document.addEventListener("touchstart", this.onTouch.bind(this), false);
      document.addEventListener("touchmove", this.onTouch.bind(this), false);
      document.addEventListener("touchend", this.onTouchEnd.bind(this), false);
    }
    onTouch(e) {
      const t = e.touches[0];
      this.onTouchEnd(e);
      if (t.pageY < window.innerHeight * 0.5)
        this.onKey(true, {keyCode: 38});
      else if (t.pageX < window.innerWidth * 0.5)
        this.onKey(true, {keyCode: 37});
      else if (t.pageY > window.innerWidth * 0.5)
        this.onKey(true, {keyCode: 39});
    }
    onTouchEnd(e) {
      this.states = {"left": false, "right": false, "forward": false, "backward": false};
      e.preventDefault();
      e.stopPropagation();
    }
    onKey(val, e) {
      const state = this.codes[e.keyCode];
      if (typeof state === "undefined")
        return;
      this.states[state] = val;
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
    }
  };
  var Controls_default = Controls;

  // Bitmap.js
  var Bitmap = class {
    constructor(src, width, height) {
      this.image = new Image();
      this.image.src = src;
      this.width = width;
      this.height = height;
    }
  };
  var Bitmap_default = Bitmap;

  // Player.js
  var Player = class {
    constructor(x, y, direction) {
      this.x = x;
      this.y = y;
      this.direction = direction;
      this.weapon = new Bitmap_default("assets/knife_hand.png", 319, 320);
      this.paces = 0;
    }
    rotate(angle) {
      this.direction = (this.direction + angle + CIRCLE) % CIRCLE;
    }
    walk(distance, map2) {
      var dx = Math.cos(this.direction) * distance;
      var dy = Math.sin(this.direction) * distance;
      if (map2.get(this.x + dx, this.y) <= 0)
        this.x += dx;
      if (map2.get(this.x, this.y + dy) <= 0)
        this.y += dy;
      this.paces += distance;
    }
    update(controls2, map2, seconds) {
      if (controls2.left)
        this.rotate(-Math.PI * seconds);
      if (controls2.right)
        this.rotate(Math.PI * seconds);
      if (controls2.forward)
        this.walk(3 * seconds, map2);
      if (controls2.backward)
        this.walk(-3 * seconds, map2);
    }
  };
  var Player_default = Player;

  // Map.js
  var Map = class {
    constructor(size) {
      this.size = size;
      this.wallGrid = new Uint8Array(size * size);
      this.skybox = new Bitmap_default("assets/deathvalley_panorama.jpg", 2e3, 750);
      this.wallTexture = new Bitmap_default("assets/wall_texture.jpg", 1024, 1024);
      this.light = 0;
      this.noWall = {length2: Infinity};
    }
    get(x, y) {
      x = Math.floor(x);
      y = Math.floor(y);
      if (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1)
        return -1;
      return this.wallGrid[y * this.size + x];
    }
    randomize() {
      for (var i = 0; i < this.size * this.size; i++) {
        this.wallGrid[i] = Math.random() < 0.3 ? 1 : 0;
      }
    }
    update(seconds) {
      if (this.light > 0)
        this.light = Math.max(this.light - 10 * seconds, 0);
      else if (Math.random() * 5 < seconds)
        this.light = 2;
    }
    cast(point, angle, range) {
      var self = this;
      var sin = Math.sin(angle);
      var cos = Math.cos(angle);
      var noWall = {length2: Infinity};
      return ray({x: point.x, y: point.y, height: 0, distance: 0});
      function ray(origin) {
        var stepX = step(sin, cos, origin.x, origin.y);
        var stepY = step(cos, sin, origin.y, origin.x, true);
        var nextStep = stepX.length2 < stepY.length2 ? inspect(stepX, 1, 0, origin.distance, stepX.y) : inspect(stepY, 0, 1, origin.distance, stepY.x);
        if (nextStep.distance > range)
          return [origin];
        return [origin].concat(ray(nextStep));
      }
      function step(rise, run, x, y, inverted) {
        if (run === 0)
          return noWall;
        var dx = run > 0 ? Math.floor(x + 1) - x : Math.ceil(x - 1) - x;
        var dy = dx * (rise / run);
        return {
          x: inverted ? y + dy : x + dx,
          y: inverted ? x + dx : y + dy,
          length2: dx * dx + dy * dy
        };
      }
      function inspect(step2, shiftX, shiftY, distance, offset) {
        var dx = cos < 0 ? shiftX : 0;
        var dy = sin < 0 ? shiftY : 0;
        step2.height = self.get(step2.x - dx, step2.y - dy);
        step2.distance = distance + Math.sqrt(step2.length2);
        if (shiftX)
          step2.shading = cos < 0 ? 2 : 0;
        else
          step2.shading = sin < 0 ? 2 : 1;
        step2.offset = offset - Math.floor(offset);
        return step2;
      }
    }
  };
  var Map_default = Map;

  // Camera.js
  var Camera = class {
    constructor(canvas, resolution, focalLength) {
      this.ctx = canvas.getContext("2d");
      this.width = canvas.width = window.innerWidth * 0.5;
      this.height = canvas.height = window.innerHeight * 0.5;
      this.resolution = resolution;
      this.spacing = this.width / resolution;
      this.focalLength = focalLength || 0.8;
      this.range = MOBILE ? 8 : 14;
      this.lightRange = 5;
      this.scale = (this.width + this.height) / 1200;
    }
    render(player2, map2) {
      this.drawSky(player2.direction, map2.skybox, map2.light);
      this.drawColumns(player2, map2);
      this.drawWeapon(player2.weapon, player2.paces);
    }
    drawSky(direction, sky, ambient) {
      const width = sky.width * (this.height / sky.height) * 2;
      const left = direction / CIRCLE * -width;
      this.ctx.save();
      this.ctx.drawImage(sky.image, left, 0, width, this.height);
      if (left < width - this.width) {
        this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
      }
      if (ambient > 0) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.globalAlpha = ambient * 0.1;
        this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
      }
      this.ctx.restore();
    }
    drawColumns(player2, map2) {
      this.ctx.save();
      for (var column = 0; column < this.resolution; column++) {
        let x = column / this.resolution - 0.5;
        let angle = Math.atan2(x, this.focalLength);
        let ray = map2.cast(player2, player2.direction + angle, this.range);
        this.drawColumn(column, ray, angle, map2);
      }
      this.ctx.restore();
    }
    drawWeapon(weapon, paces) {
      const bobX = Math.cos(paces * 2) * this.scale * 6;
      const bobY = Math.sin(paces * 4) * this.scale * 6;
      const left = this.width * 0.66 + bobX;
      const top = this.height * 0.6 + bobY;
      this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
    }
    drawColumn(column, ray, angle, map2) {
      const ctx = this.ctx;
      const texture = map2.wallTexture;
      const left = Math.floor(column * this.spacing);
      const width = Math.ceil(this.spacing);
      let hit = -1;
      while (++hit < ray.length && ray[hit].height <= 0)
        ;
      for (let s = ray.length - 1; s >= 0; s--) {
        let step = ray[s];
        let rainDrops = Math.pow(Math.random(), 3) * s;
        let rain = rainDrops > 0 && this.project(0.1, angle, step.distance);
        if (s === hit) {
          let textureX = Math.floor(texture.width * step.offset);
          let wall = this.project(step.height, angle, step.distance);
          ctx.globalAlpha = 1;
          ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);
          ctx.fillStyle = "#000000";
          ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map2.light, 0);
          ctx.fillRect(left, wall.top, width, wall.height);
        }
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.15;
        while (--rainDrops > 0)
          ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
      }
    }
    project(height, angle, distance) {
      const z = distance * Math.cos(angle);
      const wallHeight = this.height * height / z;
      const bottom = this.height / 2 * (1 + 1 / z);
      return {
        top: bottom - wallHeight,
        height: wallHeight
      };
    }
  };
  var Camera_default = Camera;

  // GameLoop.js
  var GameLoop = class {
    constructor() {
      this.frame = this.frame.bind(this);
      this.lastTime = 0;
      this.callback = function() {
      };
    }
    start(callback) {
      this.callback = callback;
      requestAnimationFrame(this.frame);
    }
    frame(time) {
      const seconds = (time - this.lastTime) / 1e3;
      this.lastTime = time;
      if (seconds < 0.2)
        this.callback(seconds);
      requestAnimationFrame(this.frame);
    }
  };
  var GameLoop_default = GameLoop;

  // index.js
  var display = document.getElementById("display");
  var player = new Player_default(15.3, -1.2, Math.PI * 0.3);
  var map = new Map_default(32);
  var controls = new Controls_default();
  var camera = new Camera_default(display, MOBILE ? 160 : 320, 0.8);
  var loop = new GameLoop_default();
  map.randomize();
  loop.start(function frame(seconds) {
    map.update(seconds);
    player.update(controls.states, map, seconds);
    camera.render(player, map);
  });
  window.faudio = null;
  function playMusic() {
    window.faudio = new Audio("assets/rain_thunder_1.wav");
    window.faudio.volume = 0.65;
    window.faudio.preload = "auto";
    window.faudio.loop = true;
    window.faudio.play();
  }
  window.addEventListener("DOMContentLoaded", playMusic);
  window.addEventListener("keydown", playMusic);
  window.addEventListener("click", playMusic);
})();
