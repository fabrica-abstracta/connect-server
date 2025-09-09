const express = require('express');
const router = express.Router();
const fileRoutes = require('./routes/file');

router.use('/', fileRoutes);

module.exports = router;