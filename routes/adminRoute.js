const express = require('express');
const router = express.Router();
const getPoliceUsersController = require('../controllers/getPoliceUsersController'); 
const dashboardController = require('../controllers/dashboardController');
const getUsersController = require('../controllers/getUsersController');
const createUsersController = require('../controllers/createUsersController');


router.get('/getUsers', getPoliceUsersController.getAllUsers);

router.post('/createUsers', createUsersController.createUsers);

router.get('/',dashboardController.viewDashboard);

router.get('/getAllUsers', getUsersController.getAllUsers);

module.exports = router; 
