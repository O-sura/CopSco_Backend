const express = require('express');
const router  = express.Router();
const roleChecker = require('../middleware/roleChecker');
const finePaymentController = require('../controllers/finePaymentController');

router.get('/payfine_online', finePaymentController.payfineOnline);

router.post('/notify_payment', finePaymentController.updatePaymentStatus);

router.post('/payfine_manual', finePaymentController.payfineOffline);


