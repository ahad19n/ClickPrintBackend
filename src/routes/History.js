const express = require('express');
const router = express.Router();

const { resp } = require('../func');

// -------------------------------------------------------------------------- //

router.get('/', async (req, res) => {
  return resp(res, 501, 'Not Implemented Yet');
});

// -------------------------------------------------------------------------- //

module.exports = router;