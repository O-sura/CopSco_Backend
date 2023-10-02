const express = require('express');
const router = express.Router();
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const verifyUploads = require('../controllers/verifyUploads');

router.get('/viewUploadedViolations', verifyUploads.viewUploadedViolations);

// router.post('/verifyUploads', verifyUploads.verifyUploads);

router.post('/getPastViolations', verifyUploads.getPastViolations);

router.post('/getPastViolations/verifyUploads', verifyUploads.verifyUploads);

module.exports = router;