const express = require('express');
const accountRoutes = require('./routes/account');

const router = express.Router();

router.use('/', accountRoutes);

module.exports = router;
