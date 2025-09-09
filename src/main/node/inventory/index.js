const express = require('express');
const router = express.Router();

router.use('/', require('./routes/brand'));
// router.use('/', require('./routes/category'));
// router.use('/', require('./routes/contact'));
// router.use('/', require('./routes/product'));

module.exports = router;
