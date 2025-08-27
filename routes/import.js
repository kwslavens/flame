const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const { importData } = require('../controllers/import');

router
  .route('/')
  .post(auth, requireAuth, importData);

module.exports = router;