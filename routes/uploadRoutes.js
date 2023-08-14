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
        async (req,res) => {
            const files = req.files;
            const nic = req.body.nic_num;
            //const nic = "200020902030";
            //console.log("NIC:" + nic)
            let idFront = idBack = verifyImage = null;
            //console.log(files)

            const parentDir = path.resolve(__dirname, '..');

            Object.keys(files).forEach(key => {
                const filepath = path.join(parentDir, '/uploads/img', files[key].name);
                files[key].mv(filepath, (err) => {
                    if(err) return res.status(500).json({status:"error", message:err})
                })

                //assigning the filenames to the correct variables for storing in the DB
                let filename = files[key].name;
                if (filename.includes('_front')) {
                    idFront = filename;
                    //console.log("IDFRONT: " + idFront)
                } else if (filename.includes('_rear')) {
                    idBack = filename;
                    //console.log("IDBACK: " + idBack)
                } else if (filename.includes('_img')) {
                    verifyImage = filename;
                    //console.log("VERIFY: " + verifyImage)
                }
              
            })

            //Update the users table with the uploaded filenames
            const updateDocs = await pool.query(
                'UPDATE users set idfront = $1, idback = $2, verificationimage = $3 WHERE nic = $4',
                [idFront, idBack, verifyImage, nic]
            );
            
            return res.json({status: 200, message: "Images successfully uploaded"});
        }
)

router.post('/upload-video', fileUpload({createParentPath: true}), async(req,res) => {
    if (!req.files || !req.files.video) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    if (!req.files || !req.files.previewImage) {
        return res.status(400).json({ message: 'No preview image found' });
    }
    
    const videoFile = req.files.video;
    const imageFile = req.files.previewImage;

    const {
        vehicleNum,
        type,
        violaton,
        district,
        city,
        description
    } = req.body;


    // Specify the destination path where the preview should be saved - Locally
    const parentDir = path.resolve(__dirname, '..');

    const filepath = path.join(parentDir, '/uploads/previews', imageFile.name);

    imageFile.mv(filepath, (err) => {
        if (err) {
        return res.status(500).json({ message: 'Error uploading file' });
        }
        res.json({ message: 'Image uploaded successfully' });
    });


    //If success
    //Upload the video to the S3 bucket
    const rawBytes = await crypto.randomBytes(16);
    const videoName = rawBytes.toString('hex');

    // Create a PutObject command
    const putObjectParams = {
        Bucket: bucketName,
        Key: videoName,
        ContentType: videoFile.mimetype, // Set the content type according to your use case
    };

    const command = new PutObjectCommand(putObjectParams);

    // Generate pre-signed URL for the PutObject operation
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log(url)

    try {
        const response = await axios.put(url, videoFile.data, {
            headers: {
                'Content-Type':  videoFile.mimetype,
            },
          });

        // const videoUrl = url.split('?')[0]
        // console.log(videoUrl);
        // Check if the response is successful (HTTP status code 2xx)
        if (response.status >= 200 && response.status < 300) {
            try {
                 //Update the users table with the uploaded filenames
                await pool.query(
                    'INSERT INTO reported_violations(videokey,vehicleno, violationtype,district,city,description, reporterid) VALUES($1,$2, $3, $4, $5, $6, $7, $8,$9)',
                    [videoName, vehicleNum, violaton, district, city, description]
                );
                
                res.json({ message: 'Violation added to the database and video successfully uploaded', videoUrl });
                
            } catch (error) {
                console.error('Error uploading video evidence:', error);
            }
        } else {
            console.error('Axios request failed:', response.status, response.statusText);
        }

        // ...
    } catch (error) {
        console.error('Error fetching URL:', error);
    }

    //upload other violation details to the database
})

router.get('/get-video/:key', async(req,res) => {
    
    const videoName = req.params.key;

    // Create a PutObject command
    const getObjectParams = {
        Bucket: bucketName,
        Key: videoName,
    };

    const command = new GetObjectCommand(getObjectParams);

    // Generate pre-signed URL for the PutObject operation
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return res.json({url})
})

//getting all videos uploaded by a particular user
router.get('/get-uploads', async(req,res) => {
    
    const userID = null;

    const result = await pool.query(
        'SELECT * FROM reported_violations WHERE reporterid = $1',
        [userID]
    );

    // Map over the results to generate secure URLs for each file key
    const resultsWithUrls = await Promise.all(result.rows.map(async (row) => {
        const getObjectParams = {
            Bucket: bucketName,
            Key: row.videokey, // Assuming the file key is stored in a column named 'file_key'
        };

        const command = new GetObjectCommand(getObjectParams);

        try {
            // Generate pre-signed URL for the GetObject operation
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            // Return an object containing the original database result and the URL
            return {
                ...row,
                url,
            };
        } catch (error) {
            console.error('Error generating URL for file:', error);
            return {
                ...row,
                url: null, // Or handle the error as needed
            };
        }
    }));
})

module.exports = router;