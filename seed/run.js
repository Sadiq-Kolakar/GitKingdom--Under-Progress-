require('dotenv').config({ path: '../server/.env' });
const mongoose = require('mongoose');
const Kingdom = require('../server/models/Kingdom');
const { CLASSMATES, LEGENDARY_NPCS } = require('./classmates');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/realm-of-code';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

// Custom specialized placement engine for seeds explicitly enforcing the 700px heartland
// jitter and 120px overlap blocks the user requested
async function placeSeededClassmate(existingPositions) {
  const center = { x: 2000, y: 2000 };
  const radius = 700;
  
  let valid = false;
  let pos;
  let attempts = 0;

  while (!valid && attempts < 100) {
    // Generate inside a circle or box with 700 radius
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    
    // Add slight jitter (+-80)
    const jitterX = (Math.random() - 0.5) * 160;
    const jitterY = (Math.random() - 0.5) * 160;

    pos = {
      x: Math.round(center.x + (r * Math.cos(angle)) + jitterX),
      y: Math.round(center.y + (r * Math.sin(angle)) + jitterY),
    };

    // Clamp inside world bounds
    pos.x = Math.max(50, Math.min(3950, pos.x));
    pos.y = Math.max(50, Math.min(3950, pos.y));

    // Minimum 120 unit gap check
    valid = true;
    for (const ep of existingPositions) {
      const dist = Math.hypot(ep.x - pos.x, ep.y - pos.y);
      if (dist < 120) {
        valid = false;
        break;
      }
    }
    attempts++;
  }
  
  return pos; // Fallback to last attempt if we somehow fail 100 times
}

async function runSeed() {
  try {
    await connectDB();
    
    // Pull all existing positions for overlap detection
    const allKingdoms = await Kingdom.find({}).select('position');
    const existingPositions = allKingdoms.map(k => k.position);

    console.log(`Starting Seed Process...`);

    // 1. Seed Classmates (Heartland Fog)
    let classSeeded = 0;
    for (const username of CLASSMATES) {
      const exists = await Kingdom.findOne({ username });
      if (!exists) {
        const position = await placeSeededClassmate(existingPositions);
        existingPositions.push(position); // Update tracking

        await new Kingdom({
          username,
          isClaimed: false,
          isSeeded: true,
          isNPC: false,
          position,
          activityState: 'dormant'
        }).save();
        classSeeded++;
      }
    }
    console.log(`Seeded ${classSeeded} classmates.`);

    // 2. Seed Legendary NPCs
    let npcsSeeded = 0;
    for (const npc of LEGENDARY_NPCS) {
      const exists = await Kingdom.findOne({ username: npc.username });
      if (!exists) {
        // Enforce the overlap list too just in case 
        existingPositions.push(npc.position);
        
        await new Kingdom({
          username: npc.username,
          isClaimed: false, // Never "claimed" by auth 
          isSeeded: true,
          isNPC: true,      // Lockout flag
          position: npc.position,
          activityState: 'active',
          characterClass: 'Ancient Entity',
          lore: npc.label,
          size: 90, // Massive sizes
          terrain: 'legendary'
        }).save();
        npcsSeeded++;
      }
    }
    console.log(`Seeded ${npcsSeeded} Legendary NPCs.`);

    console.log('Environment seeded successfully.');
  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

runSeed();
