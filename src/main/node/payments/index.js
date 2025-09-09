const express = require('express');
const router = express.Router();
const paymentRoutes = require('./routes/paymentRoutes');

router.use('/', paymentRoutes);

module.exports = router;
