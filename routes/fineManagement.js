const express = require('express');
const router = express.Router();

const issueFines = require('../controllers/issue-fines.js');

router.post('/issueFines', issueFines.issueFines);

router.get('/getFines', issueFines.getFines);

router.post('/getFineDetails', issueFines.getFineDetails)


module.exports = router;
