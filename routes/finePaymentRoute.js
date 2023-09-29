const express = require('express');
const router  = express.Router();
const roleChecker = require('../middleware/roleChecker');
const finePaymentController = require('../controllers/finePaymentController');

router.get('/payfine_online', roleChecker('general-user'), finePaymentController.payfineOnline);

router.post('/notify_payment', roleChecker('general-user'), finePaymentController.updatePaymentStatus);

router.post('/payfine_manual', roleChecker('general-user'), finePaymentController.payfineOffline);


module.exports = router;