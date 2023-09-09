const queueHandler = require('../utils/queueHandler');
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

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

// Function to handle viewing uploaded violations
const viewUploadedViolations = async (req, res) => {
    try {
        // Assuming queueHandler receives messages with violation details
        const violationMessage = await queueHandler.getFromQueue('evidence-uploaded'); 

        if (!violationMessage) {
            return res.json({
                message: "No violation message received"
            });
        }

        const violationData = JSON.parse(violationMessage);
        console.log(violationData); 

        // Query the DB to get details about the uploads based on the violationData
        const query = 'SELECT * FROM reported_violations WHERE videokey = $1';
        const result = await pool.query(query, [violationData.videokey]);

        if (result.rows.length == 0) {
            return res.json({
                message: "No violations found"
            });
        } else {
            
            //creating a PutObject command
            const getObjectParams = {
                Bucket: bucketName,
                Key: violationData.videokey,
            };

            const command = new GetObjectCommand(getObjectParams);

            //getting the url of the object
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return res.json({url: url});
        }
    } catch (error) {
        console.error('Error while viewing uploaded violations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



const verifyUploads = async (req,res) => {

    const { videokey, verified,deleveryTag } = req.body;

    try {
        const query = 'UPDATE reported_violations SET status = $1 WHERE videokey = $2';
        const result = await pool.query(query, [verified, videokey]);

        //sending acknowledgement to the queue
        queueHandler.sendAck(deleveryTag);
        console.log("Acknowledgement sent to the queue");

        return res.json({
            message: "Verified"
        });

    }
    catch (error) {
        console.error('Error verifying violation:', error);
    }
};

module.exports = {
    viewUploadedViolations,
    verifyUploads
};