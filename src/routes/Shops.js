const express = require('express');
const router = express.Router();

const Shop = require('../models/Shop');

const { resp } = require('../func/misc');

// -------------------------------------------------------------------------- //

router.get('/', async (req, res) => {
  return resp(res, 200, 'Shops fetched successfully', {
    shops: await Shop.find()
  });
});

// -------------------------------------------------------------------------- //

module.exports = router;