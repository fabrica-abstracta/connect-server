const express = require('express');
const router = express.Router();
const manualRoutes = require('./routes/manual');

router.use('/', manualRoutes);

module.exports = router;
