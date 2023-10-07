const express = require('express');
const router = express.Router();
const createUsersController = require('../controllers/createUsersController'); 

router.post('/createUsers', createUsersController);

module.exports = router; 
