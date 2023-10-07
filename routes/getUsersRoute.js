const express = require('express');
const router = express.Router();
const getUsersController = require('../controllers/getUsersController'); 

router.get('/getUsers', getUsersController.getAllUsers);

module.exports = router; 
