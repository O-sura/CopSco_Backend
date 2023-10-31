const express = require('express');
const router = express.Router();
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const verifyUploads = require('../controllers/verifyUploads');
const fileUpload = require('express-fileupload');
const { filePayloadExists } = require('../middleware/filePayloadExists');
// const { filePayloadExists } = require('../middleware/filePayloadExists');
// const fileExtLimiter = require('../middleware/fileExtLimiter');

router.get('/viewUploadedViolations', verifyUploads.viewUploadedViolations);

// router.post('/verifyUploads', verifyUploads.verifyUploads);

router.get('/getPastViolations', verifyUploads.getPastViolations);

router.post('/getPastViolations/verifyUploads',fileUpload({createParentPath: true}),filePayloadExists, verifyUploads.verifyUploads);

module.exports = router;