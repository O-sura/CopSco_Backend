const express = require('express');
const router = express.Router();
const verifyDocuments = require('../controllers/verify-documents');
const addPoliceOfficer = require('../controllers/add-officer');


router.get('/viewDocuments', verifyDocuments.viewDocuments);

router.post('/verifyDocuments', verifyDocuments.verifyDocuments);

router.post('/addPoliceOfficers', addPoliceOfficer.addPoliceOfficers);

router.get('/viewPoliceOfficers', addPoliceOfficer.viewPoliceOfficers);

module.exports = router;