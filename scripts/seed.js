/**
 * Seed script — populates ShopAdmin + Shop + User test records.
 * Run with: node --env-file=.env scripts/seed.js
 */

const mongoose = require('mongoose');

const User = require('../src/models/User');
const Shop = require('../src/models/Shop');
const ShopAdmin = require('../src/models/ShopAdmin');

const SEED_DATA = [
  {
    number: '923431990047',
    shopName: 'Ahad Prints',
    address: '123 Main Street, Gulberg, Lahore',
    capabilities: ['A4', 'A3', 'Color', 'Binding'],
  },
  {
    number: '923002345678',
    shopName: 'City Copy Center',
    address: '45 Model Town, Karachi',
    capabilities: ['A4', 'Color', 'Scanning'],
  },
  {
    number: '923003456789',
    shopName: 'Quick Print Hub',
    address: '67 Johar Town, Islamabad',
    capabilities: ['A4', 'A3', 'Black & White', 'Binding', 'Lamination'],
  },
];

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('[SEED] MONGODB_URI environment variable is required');
    console.error('[SEED] Run with: node --env-file=.env scripts/seed.js');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[SEED] Connected to MongoDB');

  for (const entry of SEED_DATA) {
    const user = await User.findOneAndUpdate(
      { number: entry.number },
      { $setOnInsert: { number: entry.number } },
      { upsert: true, new: true }
    );

    const shop = await Shop.findOneAndUpdate(
      { owner: user._id },
      {
        name: entry.shopName,
        address: entry.address,
        capabilities: entry.capabilities,
        owner: user._id,
      },
      { upsert: true, new: true }
    );

    await ShopAdmin.findOneAndUpdate(
      { user: user._id },
      { user: user._id, shop: shop._id },
      { upsert: true, new: true }
    );

    console.log(`[SEED] ✓ ${entry.shopName} — ${entry.number}`);
  }

  await mongoose.connection.close();
  console.log('[SEED] Done. Shop admins seeded successfully.');
}

seed().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
