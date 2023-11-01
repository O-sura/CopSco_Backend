const express = require('express');
const router = express.Router();
const getPoliceUsersController = require('../controllers/adminController'); 
const dashboardController = require('../controllers/dashboardController');
const getUsersController = require('../controllers/adminController');
const createUsersController = require('../controllers/adminController');
const updateUserRole = require('../controllers/adminController');
const updateUserStatus = require('../controllers/adminController')


router.get('/getPoliceUsers', getPoliceUsersController.getPoliceUsers);

router.post('/createUsers', createUsersController.createUsers);

router.get('/',dashboardController.viewDashboard);

router.get('/getAllUsers', getUsersController.getAllUsers);

router.post('/updateUserRole', updateUserRole.updateUserRole);

router.post('/updateUserStatus', updateUserStatus.updateUserStatus);

module.exports = router; 
