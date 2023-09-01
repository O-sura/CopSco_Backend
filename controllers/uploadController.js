const path = require('path');
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto');
const queueHandler = require('../utils/queueHandler');

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

const imageUploader = async (req,res) => {
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

const videoUploadController = async(req,res) => {
    if (!req.files || !req.files.video) {
        return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    if (!req.files || !req.files.previewImage) {
        return res.status(400).json({ message: 'No preview image found' });
    }
    
    const videoFile = req.files.video;
    const imageFile = req.files.previewImage;

    const previewImageName = imageFile.name

    // const {
    //     vehicleNum,
    //     type,
    //     violaton,
    //     district,
    //     city,
    //     description
    // } = req.body;

     const vehicleNum = "TestData"
     const type = "TestData"
     const violaton = "TestData"
     const district = "TestData"
     const city = "TestData"
     const description = "TestData"

    const userid = "2a114d7a-7046-481c-bcf3-5dd8aadeb0a0"
    const metadata = null;
    

    // Create a hash object
    const hash = crypto.createHash('sha256'); // You can use other hash algorithms like 'md5', 'sha1', etc.
    // Update the hash object with the video data
    hash.update(videoFile.data);
    // Generate the hash in hexadecimal format
    const videohash = hash.digest('hex');


    // Specify the destination path where the preview should be saved - Locally
    const parentDir = path.resolve(__dirname, '..');

    const filepath = path.join(parentDir, '/uploads/previews', previewImageName);

    imageFile.mv(filepath, (err) => {
        if (err) {
        return res.status(500).json({ message: 'Error uploading image file' });
        }
        //res.json({ message: 'Image uploaded successfully' });
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
                //  //Update the users table with the uploaded filenames
                const violation = await pool.query(
                    'INSERT INTO reported_violations(videokey,vehicleno, vehicletype, violationtype,district,city,description, reporterid,videohash,metadata,thumbnail) VALUES($1,$2, $3, $4, $5, $6, $7, $8,$9, $10, $11) RETURNING *',
                    [videoName, vehicleNum, type, violaton, district, city, description, userid, videohash, metadata, previewImageName]
                );
                if(violation){
                    queueHandler.publishToQueue( "evidence-uploaded", JSON.stringify(violation.rows[0]) )
                    res.json({ message: 'Violation added to the database and video successfully uploaded'});
                }
                
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
}


const getUserUploads = async(req,res) => {
    
    //const userID = req.user;
    const userID = "2a114d7a-7046-481c-bcf3-5dd8aadeb0a0";

    try {
        const query = 'SELECT * FROM reported_violations WHERE reporterid = $1';
        const result = await pool.query(query, [userID]);

        // Extract video data and thumbnails from the result
        const videoData = result.rows

        // Send the video data to the frontend
        res.status(200).json(videoData);
    } catch (error) {
        console.error('Error fetching video data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

const viewVideo = async(req,res) => {
    
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
}

module.exports = {
    imageUploader,
    videoUploadController,
    getUserUploads,
    viewVideo
}