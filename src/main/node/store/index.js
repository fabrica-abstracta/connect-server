const express = require('express');
const router = express.Router();

router.use('/', require('./routes/store'));

module.exports = router;
