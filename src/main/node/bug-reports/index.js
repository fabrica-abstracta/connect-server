const express = require('express');
const router = express.Router();
const bugReportRoutes = require('./routes/bugReportRoutes');

router.use('/', bugReportRoutes);

module.exports = router;
