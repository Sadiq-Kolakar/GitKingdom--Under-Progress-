const Kingdom = require('../models/Kingdom');

// Heartland placement logic
// center = { x: 2000, y: 2000 }
// baseRadius = 700
// jitter: ±80 units
// gap: 120 units

const getDistance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

const isValidPosition = async (position, minGap = 120) => {
  // Rather than query all, find anything within gap radius
  // A simple find query checking bounds
  const existing = await Kingdom.findOne({
    'position.x': { $gte: position.x - minGap, $lte: position.x + minGap },
    'position.y': { $gte: position.y - minGap, $lte: position.y + minGap }
  });

  if (!existing) return true;
  return getDistance(position, existing.position) >= minGap;
};

// Places a single classmate in the heartland
const placeInHeartland = async () => {
  const center = { x: 2000, y: 2000 };
  const baseRadius = 700;
  
  let attempts = 0;
  while (attempts < 1000) {
    const angle = Math.random() * Math.PI * 2;
    // slightly randomize the radius out to baseRadius
    const radius = Math.random() * baseRadius;
    
    // add jitter
    const jitterX = (Math.random() - 0.5) * 160; // ±80
    const jitterY = (Math.random() - 0.5) * 160;

    const testPos = {
      x: center.x + Math.cos(angle) * radius + jitterX,
      y: center.y + Math.sin(angle) * radius + jitterY
    };

    if (await isValidPosition(testPos, 120)) {
      return testPos;
    }
    attempts++;
  }
  return { x: 2000, y: 2000 }; // fallback
};

// Frontier: Search outward from heartland in concentric rings
// concentric rings: starting at radius 1000 (outside heartland), spacing 200 units
// gap: 120
// jitter: ±40 units
const placeInFrontier = async () => {
  const center = { x: 2000, y: 2000 };
  let ringRadius = 1000;
  const ringSpacing = 200;
  
  while (ringRadius < 10000) { // arbitrary cap to avoid infinite loops
    // Circumference of the ring
    const circumference = 2 * Math.PI * ringRadius;
    const numPoints = Math.floor(circumference / 120); // Test points along the ring
    
    for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 * i) / numPoints;
        const jitterX = (Math.random() - 0.5) * 80; // ±40
        const jitterY = (Math.random() - 0.5) * 80;
        
        const testPos = {
            x: center.x + Math.cos(angle) * ringRadius + jitterX,
            y: center.y + Math.sin(angle) * ringRadius + jitterY
        };

        if (await isValidPosition(testPos, 120)) {
            return testPos;
        }
    }
    
    // If no gap found in this ring, move to the next ring
    ringRadius += ringSpacing;
  }
  
  return { x: 2000, y: 2000 }; // fallback
};

module.exports = {
  placeInHeartland,
  placeInFrontier,
  isValidPosition
};
