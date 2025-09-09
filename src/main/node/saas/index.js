const express = require('express');
const router = express.Router();

router.use('/', require('./routes/manualRoutes'));

module.exports = router;
