const express = require('express');
const router = express.Router();

const { jwtAuth } = require('./auth');

// -------------------------------------------------------------------------- //

router.use('/auth', require('./controllers/Auth.controller'));
router.use('/files', require('./controllers/Files.controller'));

router.use('/jobs', jwtAuth, require('./controllers/Jobs.controller'));
router.use('/shops', jwtAuth, require('./controllers/Shops.controller'));
router.use('/history', jwtAuth, require('./controllers/History.controller'));
router.use('/profile', jwtAuth, require('./controllers/Profile.controller'));

// -------------------------------------------------------------------------- //

module.exports = router;
