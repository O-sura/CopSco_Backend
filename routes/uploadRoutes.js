const express = require('express');
const router  = express.Router()
const fileUpload = require('express-fileupload');
const path = require('path');
const fileExtLimiter = require('../middleware/fileExtLimiter');
const { imageFileSizeLimiter } = require('../middleware/fileSizeLimiter');
const { filePayloadExists } = require('../middleware/filePayloadExists');
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto');
const uploadController = require('../controllers/uploadController');
const  roleChecker  = require('../middleware/roleChecker');

const randomBytes = util.promisify(crypto.randomBytes);

//upload video to the s3
const region = "ap-south-1"
const bucketName = "copsco-video-bucket"
const accessKeyID = process.env.ACCESS_KEY
const secretKeyID = process.env.SECRET_ACCESS_KEY

//get a secure connection url to get connected into the S3-bucket
const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyID,
        secretAccessKey: secretKeyID,
    },
});

router.post('/verify-doc', 
        fileUpload({createParentPath: true}),
        filePayloadExists,
        fileExtLimiter([".jpg", ".png", ".jpeg"]),
        imageFileSizeLimiter,
        uploadController.imageUploader
)

router.post('/upload-video', roleChecker('general-user'), fileUpload({createParentPath: true}), uploadController.videoUploadController)

router.get('/view-video/:key', roleChecker('general-user'), uploadController.viewVideo)

//getting all videos uploaded by a particular user
router.get('/get-uploads', roleChecker('general-user'), uploadController.getUserUploads)

//mark as remove from view
router.put('/hide-upload', roleChecker('general-user'), uploadController.toggleHideVideo)

//get hidden videos
router.get('/hidden-videos', roleChecker('general-user'), uploadController.getHiddenVideos)

//delete the submitted video
router.delete('/delete-video/:id', roleChecker('general-user'), uploadController.deleteVideo)

//get video fine details
router.get('/video-fines', roleChecker('general-user'), uploadController.getUserVideoFines)

router.get('/getAppealedFines', roleChecker('general-user'), uploadController.getAppealedFines)

module.exports = router;
