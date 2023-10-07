const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController'); 

router.get('/',dashboardController.viewDashboard);


module.exports = router; 
