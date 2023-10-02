const express = require('express');
const router = express.Router();
const verifyDocuments = require('../controllers/verify-documents');
const addPoliceOfficer = require('../controllers/add-officer');
const handleVideos = require('../controllers/handle-video-offences');


router.get('/viewDocuments', verifyDocuments.viewDocuments);

router.post('/verifyDocuments', verifyDocuments.verifyDocuments);

router.post('/addPoliceOfficers', addPoliceOfficer.addPoliceOfficers);

router.get('/viewPoliceOfficers', addPoliceOfficer.viewPoliceOfficers);

router.get('/viewVerifiedVideos', handleVideos.viewVerifiedVideos);

router.get('/viewVerifiedVideoDetails', handleVideos.viewVerifiedVideoDetails);

module.exports = router;