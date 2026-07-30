import { Cloud, SwayingFlower, FlowerStamp, TouchRipple } from '../types';

// Color Palette matching the exact reference artwork
export const PALETTE = {
  skyTop: '#9BBFC9',
  skyMid: '#C1DFDD',
  skyHorizon: '#FFEEC9',
  cloudBack: '#FAF2EA',
  cloudMid: '#F2DEC8',
  cloudFront: '#FFFFFF',
  mountainBack: '#7284AC',
  mountainMid: '#A1B3D7',
  mountainFront: '#5B6C93',
  fieldYellow: '#E4AD38',
  fieldYellowDark: '#D49B2A',
  fieldYellowLight: '#F3C552',
  fieldGreen: '#95B341',
  fieldGreenDark: '#809D2D',
  fieldGreenLight: '#A8C74D',
  houseRoof: '#CA513D',
  houseWall: '#E6C387',
  barnRoof: '#D55442',
  barnWall: '#EDB04E',
  barnWood: '#462319',
  orangePine: '#D36725',
  greenPine: '#34763B',
  goldenTree: '#E2A020',
  daisyPetal: '#FFFFFF',
  daisyCenter: '#EE9E20',
  coralPetal: '#EF5E40',
  coralPetalDark: '#D64A2F',
  coralCore: '#4B2117',
  coralSeed: '#F2AB31',
  poppyRed: '#E34127',
  stemGreen: '#2B582C',
  leafGreen: '#3C7C3E',
  leafGreenLight: '#6AA341',
};

/**
 * Main Landscape Renderer Function
 */
export function drawLandscape(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  clouds: Cloud[],
  swayingFlowers: SwayingFlower[],
  stamps: FlowerStamp[],
  ripples: TouchRipple[],
  bgImage: HTMLImageElement | null,
  handPositions: { x: number; y: number }[] = [],
  flowerImages: HTMLImageElement[] = []
) {
  ctx.clearRect(0, 0, width, height);

  // 1. Render Original Artwork Image Background
  if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;
    let renderW = width;
    let renderH = height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderW = width;
      renderH = width / imgRatio;
      offsetY = (height - renderH) / 2;
    } else {
      renderH = height;
      renderW = height * imgRatio;
      offsetX = (width - renderW) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, renderW, renderH);
  } else {
    // Fallback sky fill while image is loading
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, PALETTE.skyTop);
    skyGradient.addColorStop(0.6, PALETTE.skyMid);
    skyGradient.addColorStop(1, PALETTE.fieldYellow);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Interactive Touch Ripples
  drawRipples(ctx, ripples);

  // 3. Stamped Interactive Flowers on Touch (Appears on touch, sways, disappears after delay)
  drawFlowerStamps(ctx, stamps, time, flowerImages);

  // 4. Camera Hand Tracking Glowing Light Pointer Cursors
  if (handPositions && handPositions.length > 0) {
    drawHandCursors(ctx, handPositions, time);
  }
}

/**
 * Camera Hand Tracking Light Cursors
 */
export function drawHandCursors(
  ctx: CanvasRenderingContext2D,
  hands: { x: number; y: number }[],
  time: number
) {
  hands.forEach((h, idx) => {
    ctx.save();

    // Outer radial light glow aura
    const pulse = Math.sin(time * 0.008 + idx * 1.5) * 6;
    const radius = 32 + pulse;
    const gradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, radius * 2.2);
    gradient.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
    gradient.addColorStop(0.35, 'rgba(255, 170, 70, 0.6)');
    gradient.addColorStop(0.7, 'rgba(235, 90, 50, 0.25)');
    gradient.addColorStop(1, 'rgba(235, 90, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(h.x, h.y, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core point
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FF9D25';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Glowing ring boundary around hand cursor position
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(h.x, h.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  });
}

/**
 * Sky Birds (3 floating minimalist birds)
 */
function drawBirds(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = Math.max(1.5, w * 0.0015);
  ctx.lineCap = 'round';

  const birdPositions = [
    { x: w * 0.88, y: h * 0.19, scale: 1 },
    { x: w * 0.92, y: h * 0.20, scale: 0.8 },
    { x: w * 0.96, y: h * 0.215, scale: 0.7 },
  ];

  birdPositions.forEach((b, i) => {
    const wingFlap = Math.sin(time * 0.003 + i) * 3;
    const bx = b.x;
    const by = b.y + Math.sin(time * 0.001 + i) * 4;
    const sz = w * 0.008 * b.scale;

    ctx.beginPath();
    ctx.moveTo(bx - sz, by - wingFlap);
    ctx.quadraticCurveTo(bx - sz * 0.4, by + sz * 0.2, bx, by);
    ctx.quadraticCurveTo(bx + sz * 0.4, by + sz * 0.2, bx + sz, by - wingFlap);
    ctx.stroke();
  });
}

/**
 * Heavy background cloud banks near horizon
 */
function drawBackgroundCloudBanks(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Left cloud mass
  ctx.fillStyle = PALETTE.cloudBack;
  drawCloudBlob(ctx, w * 0.05, h * 0.25, w * 0.25, h * 0.22);
  ctx.fillStyle = PALETTE.cloudMid;
  drawCloudBlob(ctx, w * 0.12, h * 0.28, w * 0.2, h * 0.18);

  // Right cloud mass
  ctx.fillStyle = PALETTE.cloudBack;
  drawCloudBlob(ctx, w * 0.85, h * 0.28, w * 0.25, h * 0.22);
  ctx.fillStyle = PALETTE.cloudMid;
  drawCloudBlob(ctx, w * 0.8, h * 0.32, w * 0.2, h * 0.18);
}

function drawCloudBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(cx - rx * 0.4, cy + ry * 0.2, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + rx * 0.4, cy + ry * 0.2, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Distant Mountains Layer
 */
function drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const horizonY = h * 0.45;

  // Back Mountain Ridge
  ctx.fillStyle = PALETTE.mountainBack;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(w * 0.05, horizonY - h * 0.12);
  ctx.lineTo(w * 0.2, horizonY - h * 0.06);
  ctx.lineTo(w * 0.38, horizonY - h * 0.15);
  ctx.lineTo(w * 0.55, horizonY - h * 0.08);
  ctx.lineTo(w * 0.75, horizonY - h * 0.14);
  ctx.lineTo(w * 0.92, horizonY - h * 0.09);
  ctx.lineTo(w, horizonY - h * 0.04);
  ctx.lineTo(w, horizonY + 50);
  ctx.lineTo(0, horizonY + 50);
  ctx.closePath();
  ctx.fill();

  // Middle Purple Mountain Ridge
  ctx.fillStyle = PALETTE.mountainMid;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.quadraticCurveTo(w * 0.15, horizonY - h * 0.09, w * 0.32, horizonY - h * 0.04);
  ctx.quadraticCurveTo(w * 0.5, horizonY - h * 0.12, w * 0.68, horizonY - h * 0.05);
  ctx.quadraticCurveTo(w * 0.85, horizonY - h * 0.1, w, horizonY - h * 0.06);
  ctx.lineTo(w, horizonY + 50);
  ctx.lineTo(0, horizonY + 50);
  ctx.closePath();
  ctx.fill();

  // Front Blue Mountain Ridge
  ctx.fillStyle = PALETTE.mountainFront;
  ctx.beginPath();
  ctx.moveTo(0, horizonY - h * 0.04);
  ctx.quadraticCurveTo(w * 0.18, horizonY - h * 0.08, w * 0.35, horizonY - h * 0.03);
  ctx.quadraticCurveTo(w * 0.65, horizonY - h * 0.07, w * 0.82, horizonY - h * 0.02);
  ctx.lineTo(w, horizonY - h * 0.05);
  ctx.lineTo(w, horizonY + 50);
  ctx.lineTo(0, horizonY + 50);
  ctx.closePath();
  ctx.fill();
}

/**
 * Sun Glow / Center Horizon
 */
function drawSunGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#FFF8E7';
  ctx.beginPath();
  ctx.ellipse(w * 0.42, h * 0.42, w * 0.18, h * 0.15, 0, Math.PI, 0);
  ctx.fill();
}

/**
 * Rolling Hills & Golden Harvest Fields
 */
function drawRollingFields(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Left Golden Harvest Field
  ctx.fillStyle = PALETTE.fieldYellow;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.44);
  ctx.bezierCurveTo(w * 0.25, h * 0.42, w * 0.45, h * 0.52, w * 0.6, h * 0.65);
  ctx.lineTo(0, h * 0.85);
  ctx.closePath();
  ctx.fill();

  // Field Stripes on Left Harvest Hill
  ctx.strokeStyle = PALETTE.fieldYellowDark;
  ctx.lineWidth = Math.max(2, w * 0.003);
  const stripeLines = [
    { x1: 0, y1: h * 0.52, x2: w * 0.35, y2: h * 0.60 },
    { x1: 0, y1: h * 0.58, x2: w * 0.42, y2: h * 0.66 },
    { x1: 0, y1: h * 0.65, x2: w * 0.48, y2: h * 0.72 },
    { x1: 0, y1: h * 0.72, x2: w * 0.55, y2: h * 0.78 },
  ];
  stripeLines.forEach((line) => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.quadraticCurveTo(line.x2 * 0.6, line.y2 - 10, line.x2, line.y2);
    ctx.stroke();
  });

  // Right Soft Green Pasture Hill
  ctx.fillStyle = PALETTE.fieldGreen;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.58);
  ctx.bezierCurveTo(w * 0.55, h * 0.50, w * 0.85, h * 0.54, w, h * 0.58);
  ctx.lineTo(w, h * 0.95);
  ctx.lineTo(0, h * 0.95);
  ctx.closePath();
  ctx.fill();

  // Foreground Green Pasture Layer
  ctx.fillStyle = PALETTE.fieldGreenLight;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.bezierCurveTo(w * 0.35, h * 0.72, w * 0.65, h * 0.68, w, h * 0.72);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
}

/**
 * Houses, Barn, and Evergreen/Golden Trees
 */
function drawArchitectureAndTrees(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Left Golden Tree
  ctx.fillStyle = PALETTE.goldenTree;
  ctx.beginPath();
  ctx.ellipse(w * 0.01, h * 0.38, w * 0.06, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.strokeStyle = '#A86211';
  ctx.lineWidth = Math.max(3, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(w * 0.015, h * 0.48);
  ctx.lineTo(w * 0.015, h * 0.58);
  ctx.stroke();

  // Left Houses
  // House 1 (Far left red house)
  const h1x = w * 0.08;
  const h1y = h * 0.48;
  const h1w = w * 0.08;
  const h1h = h * 0.08;
  // Wall
  ctx.fillStyle = PALETTE.houseWall;
  ctx.fillRect(h1x, h1y, h1w, h1h);
  // Roof
  ctx.fillStyle = PALETTE.houseRoof;
  ctx.beginPath();
  ctx.moveTo(h1x - h1w * 0.1, h1y);
  ctx.lineTo(h1x + h1w * 0.5, h1y - h1h * 0.5);
  ctx.lineTo(h1x + h1w * 1.1, h1y);
  ctx.closePath();
  ctx.fill();

  // House 2 (Middle left house)
  const h2x = w * 0.20;
  const h2y = h * 0.47;
  const h2w = w * 0.07;
  const h2h = h * 0.09;
  ctx.fillStyle = PALETTE.houseWall;
  ctx.fillRect(h2x, h2y, h2w, h2h);
  ctx.fillStyle = PALETTE.houseRoof;
  ctx.beginPath();
  ctx.moveTo(h2x - h2w * 0.1, h2y);
  ctx.lineTo(h2x + h2w * 0.5, h2y - h2h * 0.6);
  ctx.lineTo(h2x + h2w * 1.1, h2y);
  ctx.closePath();
  ctx.fill();

  // Orange Tall Pine Trees (Center left)
  const treePines = [
    { x: w * 0.32, y: h * 0.44, w: w * 0.022, h: h * 0.14, color: PALETTE.orangePine },
    { x: w * 0.36, y: h * 0.47, w: w * 0.018, h: h * 0.12, color: PALETTE.orangePine },
  ];
  treePines.forEach((t) => {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + t.w, t.y + t.h);
    ctx.lineTo(t.x - t.w, t.y + t.h);
    ctx.closePath();
    ctx.fill();
  });

  // Right Barn
  const bx = w * 0.79;
  const by = h * 0.48;
  const bw = w * 0.14;
  const bh = h * 0.12;
  // Wall
  ctx.fillStyle = PALETTE.barnWall;
  ctx.fillRect(bx, by, bw, bh);
  // Roof
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(bx - bw * 0.08, by);
  ctx.lineTo(bx + bw * 0.5, by - bh * 0.5);
  ctx.lineTo(bx + bw * 1.08, by);
  ctx.closePath();
  ctx.fill();
  // Doorway
  ctx.fillStyle = PALETTE.barnWood;
  ctx.fillRect(bx + bw * 0.22, by + bh * 0.35, bw * 0.3, bh * 0.65);

  // Green Pine Trees (Right near Barn)
  const greenPines = [
    { x: w * 0.68, y: h * 0.55, w: w * 0.018, h: h * 0.1, color: PALETTE.greenPine },
    { x: w * 0.71, y: h * 0.54, w: w * 0.02, h: h * 0.11, color: PALETTE.greenPine },
  ];
  greenPines.forEach((t) => {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(t.x + t.w, t.y + t.h);
    ctx.lineTo(t.x - t.w, t.y + t.h);
    ctx.closePath();
    ctx.fill();
  });

  // Right Large Golden Tree
  ctx.fillStyle = PALETTE.goldenTree;
  ctx.beginPath();
  ctx.ellipse(w * 0.98, h * 0.42, w * 0.08, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Drifting Clouds in Sky
 */
function drawMovingClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  clouds: Cloud[],
  time: number
) {
  clouds.forEach((cloud) => {
    // Calculate current X position based on speed and time
    const cx = ((cloud.x + (time * cloud.speed) / 1000) % 1.3) * w - w * 0.15;
    const cy = cloud.y * h + Math.sin(time * 0.0008 + cloud.x * 10) * 5;
    const baseScale = (w * 0.08) * cloud.scale;

    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.fillStyle = PALETTE.cloudFront;

    // Soft organic cloud shape
    ctx.beginPath();
    ctx.arc(cx, cy, baseScale * 0.6, 0, Math.PI * 2);
    ctx.arc(cx - baseScale * 0.5, cy + baseScale * 0.1, baseScale * 0.45, 0, Math.PI * 2);
    ctx.arc(cx + baseScale * 0.5, cy + baseScale * 0.1, baseScale * 0.45, 0, Math.PI * 2);
    ctx.arc(cx - baseScale * 0.25, cy - baseScale * 0.35, baseScale * 0.4, 0, Math.PI * 2);
    ctx.arc(cx + baseScale * 0.25, cy - baseScale * 0.35, baseScale * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Subtle cloud shadow/depth
    ctx.fillStyle = 'rgba(230, 215, 205, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy + baseScale * 0.1, baseScale * 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

/**
 * Foreground Swaying Flowers (Base scene)
 */
function drawForegroundFlowers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  flowers: SwayingFlower[],
  time: number
) {
  flowers.forEach((flower) => {
    const fx = flower.x * w;
    const fy = flower.y * h;
    const sz = Math.max(16, w * 0.035 * flower.scale);

    // Calculate natural wind sway angle using sine wave oscillation
    const swayAngle = Math.sin(time * flower.swaySpeed + flower.swayPhase) * flower.swayAmplitude;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(swayAngle);

    // Draw stem
    ctx.strokeStyle = PALETTE.stemGreen;
    ctx.lineWidth = Math.max(2, sz * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(swayAngle * 10, flower.height * 0.5, 0, flower.height);
    ctx.stroke();

    // Draw leaves attached to stem
    ctx.fillStyle = PALETTE.leafGreen;
    ctx.beginPath();
    ctx.ellipse(-sz * 0.2, flower.height * 0.4, sz * 0.3, sz * 0.12, -0.5, 0, Math.PI * 2);
    ctx.ellipse(sz * 0.2, flower.height * 0.6, sz * 0.3, sz * 0.12, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Flower Head based on type
    switch (flower.flowerType) {
      case 'whiteDaisy':
      case 'smallDaisy':
        drawWhiteDaisyHead(ctx, 0, 0, sz);
        break;
      case 'coralDaisy':
        drawCoralDaisyHead(ctx, 0, 0, sz);
        break;
      case 'redPoppy':
      case 'tallPoppy':
        drawRedPoppyHead(ctx, 0, 0, sz);
        break;
    }

    ctx.restore();
  });
}

/**
 * Render White Daisy Flower Head
 */
export function drawWhiteDaisyHead(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const numPetals = 14;
  ctx.fillStyle = PALETTE.daisyPetal;

  // Draw Petals
  for (let i = 0; i < numPetals; i++) {
    const angle = (i * Math.PI * 2) / numPetals;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.18, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Yellow Center Core
  ctx.fillStyle = PALETTE.daisyCenter;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Subtle core texture ring
  ctx.strokeStyle = '#D48113';
  ctx.lineWidth = Math.max(1, radius * 0.05);
  ctx.stroke();
}

/**
 * Render Coral Daisy Flower Head
 */
export function drawCoralDaisyHead(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const numPetals = 16;

  // Layer 1: Darker underlying petals
  ctx.fillStyle = PALETTE.coralPetalDark;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i * Math.PI * 2) / numPetals + 0.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.6, radius * 0.2, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Layer 2: Main Vibrant Coral Petals
  ctx.fillStyle = PALETTE.coralPetal;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i * Math.PI * 2) / numPetals;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.18, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dark Brown Core Center
  ctx.fillStyle = PALETTE.coralCore;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Dotted Seed Pattern inside Core
  ctx.fillStyle = PALETTE.coralSeed;
  const numDots = 8;
  for (let d = 0; d < numDots; d++) {
    const dAngle = (d * Math.PI * 2) / numDots;
    const dx = x + Math.cos(dAngle) * radius * 0.2;
    const dy = y + Math.sin(dAngle) * radius * 0.2;
    ctx.beginPath();
    ctx.arc(dx, dy, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Render Red Poppy Flower Head
 */
export function drawRedPoppyHead(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const numPetals = 5;
  ctx.fillStyle = PALETTE.poppyRed;

  for (let i = 0; i < numPetals; i++) {
    const angle = (i * Math.PI * 2) / numPetals;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.45, radius * 0.35, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Dark Center
  ctx.fillStyle = '#3A1810';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Render Golden Daisy Flower Head
 */
export function drawGoldenDaisyHead(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  const numPetals = 12;
  ctx.fillStyle = '#E98D25';

  for (let i = 0; i < numPetals; i++) {
    const angle = (i * Math.PI * 2) / numPetals;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.5, radius * 0.2, radius * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.fillStyle = '#7A350E';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Render Interactive Touch Ripples
 */
function drawRipples(ctx: CanvasRenderingContext2D, ripples: TouchRipple[]) {
  ripples.forEach((r) => {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(238, 158, 32, ${r.opacity * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

/**
 * Render Interactive Flower Stamps (Stamped on user touch/click)
 */
function drawFlowerStamps(
  ctx: CanvasRenderingContext2D,
  stamps: FlowerStamp[],
  time: number,
  flowerImages: HTMLImageElement[] = []
) {
  stamps.forEach((stamp) => {
    ctx.save();
    ctx.globalAlpha = stamp.opacity;

    // Apply scale and sway
    const currentScale = stamp.scale;
    const swayAngle = Math.sin(time * 0.003 + stamp.swayPhase) * 0.08;

    ctx.translate(stamp.x, stamp.y);
    ctx.rotate(stamp.rotation + swayAngle);
    ctx.scale(currentScale, currentScale);

    const baseRadius = 38;

    // Draw Stem anchored at ground
    ctx.strokeStyle = PALETTE.stemGreen;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, baseRadius * 1.2);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = PALETTE.leafGreen;
    ctx.beginPath();
    ctx.ellipse(baseRadius * 0.3, baseRadius * 0.7, baseRadius * 0.35, baseRadius * 0.15, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Render Flower Head according to stamp custom flower image or fallback flower type
    const flowerImg =
      stamp.imageIndex !== undefined &&
      flowerImages[stamp.imageIndex] &&
      flowerImages[stamp.imageIndex].complete &&
      flowerImages[stamp.imageIndex].naturalWidth > 0
        ? flowerImages[stamp.imageIndex]
        : null;

    if (flowerImg) {
      const imgWidth = baseRadius * 2.5;
      const imgHeight = (flowerImg.naturalHeight / flowerImg.naturalWidth) * imgWidth;
      ctx.drawImage(flowerImg, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
    } else {
      switch (stamp.flowerType) {
        case 'coralDaisy':
          drawCoralDaisyHead(ctx, 0, 0, baseRadius);
          break;
        case 'whiteDaisy':
          drawWhiteDaisyHead(ctx, 0, 0, baseRadius);
          break;
        case 'redPoppy':
          drawRedPoppyHead(ctx, 0, 0, baseRadius);
          break;
        case 'goldenDaisy':
          drawGoldenDaisyHead(ctx, 0, 0, baseRadius);
          break;
        case 'blossom':
          drawWhiteDaisyHead(ctx, 0, 0, baseRadius * 0.85);
          break;
      }
    }

    ctx.restore();

    // Render bursting petal particles
    stamp.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life * stamp.opacity;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  });
}
