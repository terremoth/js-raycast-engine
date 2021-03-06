import {MOBILE} from './helpers'
import {CIRCLE} from './helpers'

export default class Camera 
{
    constructor(canvas, resolution, focalLength) {
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width = window.innerWidth * 0.5;
        this.height = canvas.height = window.innerHeight * 0.5;
        this.resolution = resolution;
        this.spacing = this.width / resolution;
        this.focalLength = focalLength || 0.8;
        this.range = MOBILE ? 8 : 14;
        this.lightRange = 5;
        this.scale = (this.width + this.height) / 1200;
    }

    render(player, map) {
        this.drawSky(player.direction, map.skybox, map.light);
        this.drawColumns(player, map);
        this.drawWeapon(player.weapon, player.paces);
    };

    drawSky(direction, sky, ambient) {
        const width = sky.width * (this.height / sky.height) * 2;
        const left = (direction / CIRCLE) * -width;
      
        this.ctx.save();
        this.ctx.drawImage(sky.image, left, 0, width, this.height);

        if (left < width - this.width) {
          this.ctx.drawImage(sky.image, left + width, 0, width, this.height);
        }

        if (ambient > 0) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.globalAlpha = ambient * 0.1;
          this.ctx.fillRect(0, this.height * 0.5, this.width, this.height * 0.5);
        }
        this.ctx.restore();
    };

    drawColumns(player, map) {
        this.ctx.save();
        for (var column = 0; column < this.resolution; column++) {
          let x = column / this.resolution - 0.5;
          let angle = Math.atan2(x, this.focalLength);
          let ray = map.cast(player, player.direction + angle, this.range);
          this.drawColumn(column, ray, angle, map);
        }
        this.ctx.restore();
    }

    drawWeapon(weapon, paces) {
        const bobX = Math.cos(paces * 2) * this.scale * 6;
        const bobY = Math.sin(paces * 4) * this.scale * 6;
        const left = this.width * 0.66 + bobX;
        const top = this.height * 0.6 + bobY;
        this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
    };

    drawColumn(column, ray, angle, map) {
        const ctx = this.ctx;
        const texture = map.wallTexture;
        const left = Math.floor(column * this.spacing);
        const width = Math.ceil(this.spacing);
        let hit = -1;
      
        while (++hit < ray.length && ray[hit].height <= 0);
      
        for (let s = ray.length - 1; s >= 0; s--) {
          let step = ray[s];
          let rainDrops = Math.pow(Math.random(), 3) * s;
          let rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
      
          if (s === hit) {
            let textureX = Math.floor(texture.width * step.offset);
            let wall = this.project(step.height, angle, step.distance);
      
            ctx.globalAlpha = 1;
            ctx.drawImage(texture.image, textureX, 0, 1, texture.height, left, wall.top, width, wall.height);
            
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = Math.max((step.distance + step.shading) / this.lightRange - map.light, 0);
            ctx.fillRect(left, wall.top, width, wall.height);
          }
          
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.15;
          while (--rainDrops > 0) ctx.fillRect(left, Math.random() * rain.top, 1, rain.height);
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
    };
}