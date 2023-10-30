const express = require('express');
const router  = express.Router()
const profileController = require('../controllers/profileController');
const  roleChecker  = require('../middleware/roleChecker');


//get profile details
router.get('/profile/:id', roleChecker('general-user'), profileController.getProfileData);

//download QR
router.get('/download-qr', roleChecker('general-user'), profileController.downloadQR);

//add bank info
router.post('/bank-info', roleChecker('general-user'), profileController.addBankInfo);

//update bank info
router.put('/bank-bank', roleChecker('general-user'), profileController.updateBankInfo);

//change password
router.put('/update-password', roleChecker('general-user'), profileController.updatePassword);

//delete profile
router.post('/profile/:id', roleChecker('general-user'), profileController.deleteProfile);

//withdraw rewards
router.post('/withdraw-rewards', roleChecker('general-user'), profileController.withdrawRewards);


module.exports = router;
