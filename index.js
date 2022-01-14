import {MOBILE} from './helpers'
import Controls from './Controls'
import Player from './Player'
import Map from './Map'
import Camera from './Camera'
import GameLoop from './GameLoop'

const display = document.getElementById('display');
const player = new Player(15.3, -1.2, Math.PI * 0.3);
const map = new Map(32);
const controls = new Controls();
const camera = new Camera(display, MOBILE ? 160 : 320, 0.8);
const loop = new GameLoop();

map.randomize();

loop.start(function frame(seconds) {
  map.update(seconds);
  player.update(controls.states, map, seconds);
  camera.render(player, map);
});

window.faudio = null;
function playMusic() {
  window.faudio = new Audio('assets/rain_thunder_1.wav');
  window.faudio.volume = 0.65;
  window.faudio.preload = "auto";
  window.faudio.loop = true;
  window.faudio.play();
}

// window.addEventListener('DOMContentLoaded', playMusic);
// window.addEventListener('keydown', playMusic);
// window.addEventListener('click', playMusic);

