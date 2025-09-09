const express = require('express');
const router = express.Router();
const authentication = require('./routes/authentication');

router.use('/', authentication);

module.exports = router;
