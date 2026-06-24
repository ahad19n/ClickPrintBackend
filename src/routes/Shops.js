const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

const Shop = require('../models/Shop');
const ShopAdmin = require('../models/ShopAdmin');

const { resp } = require('../func/misc');

// -------------------------------------------------------------------------- //

router.get('/', async (req, res) => {
  return resp(res, 200, 'Shops fetched successfully', {
    shops: await Shop.find()
  });
});

// -------------------------------------------------------------------------- //

router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return resp(res, 404, 'Shop not found');
  }

  if (req.token.actor !== 'shop') {
    return resp(res, 403, 'Forbidden');
  }

  const shopAdmin = await ShopAdmin.findOne({ user: req.token.uid, shop: req.params.id });
  if (!shopAdmin) return resp(res, 403, 'You are not authorized to update this shop');

  const { name, address, capabilities } = req.body || {};
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (capabilities !== undefined) updates.capabilities = capabilities;

  const shop = await Shop.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!shop) return resp(res, 404, 'Shop not found');

  return resp(res, 200, 'Shop updated successfully', { shop });
});

// -------------------------------------------------------------------------- //

module.exports = router;
