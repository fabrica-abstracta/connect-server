const express = require('express');
const router = express.Router();
const permissionRoutes = require('./routes/accessRoutes');

router.use('/', permissionRoutes);

module.exports = router;
