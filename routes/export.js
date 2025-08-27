const express = require('express');
const router = express.Router();

// middleware
const { auth, requireAuth } = require('../middleware');

const { exportData } = require('../controllers/export');

router
  .route('/:format')
  .get(auth, requireAuth, exportData);

module.exports = router;