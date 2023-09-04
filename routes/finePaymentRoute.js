const express = require('express');
const router  = express.Router();
const roleChecker = require('../middleware/roleChecker');
const finePaymentController = require('../controllers/finePaymentController');

router.get('/payfine_online', finePaymentController.payfineOnline);

router.get('/payfine_manual', finePaymentController.payfineOffline);


