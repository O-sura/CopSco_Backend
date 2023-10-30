const express = require('express');
const router = express.Router();
const verifyDocuments = require('../controllers/verify-documents');

router.get('/viewDocuments', verifyDocuments.viewDocuments);

module.exports = router;