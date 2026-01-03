
import React, { useEffect, useRef } from 'react';
import { ShipState } from '../types';

interface GameCanvasProps {
  onUpdateState: (state: ShipState) => void;
}

const PIXEL_SIZE = 4;
const SHIP_PIXELS = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1],
];

const GameCanvas: React.FC<GameCanvasProps> = ({ onUpdateState }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);

  useEffect(() => {
    const sketch = (p: any) => {
      let ship: ShipState = {
        x: p.windowWidth / 2,
        y: p.windowHeight / 2,
        rotation: -Math.PI / 2,
        velocity: { x: 0, y: 0 },
        fuel: 100,
        health: 100
      };

      let stars: { x: number, y: number, size: number, speed: number }[] = [];
      const friction = 0.98;
      const thrustPower = 0.15;
      const rotationSpeed = 0.08;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight).parent(containerRef.current!);
        for (let i = 0; i < 200; i++) {
          stars.push({
            x: p.random(p.width),
            y: p.random(p.height),
            size: p.random(1, 3),
            speed: p.random(0.5, 2)
          });
        }
      };

      p.draw = () => {
        p.background(5, 5, 15);

        // Draw Stars
        p.noStroke();
        p.fill(200, 200, 255, 150);
        stars.forEach(s => {
          p.circle(s.x, s.y, s.size);
          // Parallax movement based on ship velocity
          s.x -= ship.velocity.x * s.speed * 0.5;
          s.y -= ship.velocity.y * s.speed * 0.5;

          // Wrap stars
          if (s.x < 0) s.x = p.width;
          if (s.x > p.width) s.x = 0;
          if (s.y < 0) s.y = p.height;
          if (s.y > p.height) s.y = 0;
        });

        // Input Handling
        if (p.keyIsDown(p.LEFT_ARROW)) {
          ship.rotation -= rotationSpeed;
        }
        if (p.keyIsDown(p.RIGHT_ARROW)) {
          ship.rotation += rotationSpeed;
        }
        if (p.keyIsDown(p.UP_ARROW)) {
          ship.velocity.x += Math.cos(ship.rotation) * thrustPower;
          ship.velocity.y += Math.sin(ship.rotation) * thrustPower;
          ship.fuel = Math.max(0, ship.fuel - 0.05);
          drawThruster(p, ship);
        }

        // Apply Physics
        ship.velocity.x *= friction;
        ship.velocity.y *= friction;
        ship.x += ship.velocity.x;
        ship.y += ship.velocity.y;

        // Screen Wrap
        if (ship.x < 0) ship.x = p.width;
        if (ship.x > p.width) ship.x = 0;
        if (ship.y < 0) ship.y = p.height;
        if (ship.y > p.height) ship.y = 0;

        // Render Ship (Pixel Art Style)
        p.push();
        p.translate(ship.x, ship.y);
        p.rotate(ship.rotation + Math.PI / 2);
        
        // Shadow/Glow
        p.noStroke();
        p.fill(0, 255, 255, 30);
        p.rect(-12, -12, 24, 24);

        // Actual Ship Body
        for (let i = 0; i < SHIP_PIXELS.length; i++) {
          for (let j = 0; j < SHIP_PIXELS[i].length; j++) {
            if (SHIP_PIXELS[i][j] === 1) {
              p.fill(200, 255, 255);
              p.rect(
                (j - 2) * PIXEL_SIZE,
                (i - 2) * PIXEL_SIZE,
                PIXEL_SIZE,
                PIXEL_SIZE
              );
            }
          }
        }
        p.pop();

        onUpdateState({ ...ship });
      };

      const drawThruster = (p: any, ship: ShipState) => {
        p.push();
        p.translate(ship.x, ship.y);
        p.rotate(ship.rotation + Math.PI / 2);
        p.fill(255, 100, 0, p.random(100, 255));
        p.rect(-PIXEL_SIZE, 8, PIXEL_SIZE * 2, p.random(4, 12));
        p.pop();
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    // Initialize p5
    const p5InstanceGenerated = new (window as any).p5(sketch);
    p5Instance.current = p5InstanceGenerated;

    return () => {
      p5InstanceGenerated.remove();
    };
  }, []); // Only once on mount

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-0 cursor-none"
    />
  );
};

export default GameCanvas;
