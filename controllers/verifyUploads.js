const queueHandler = require('../utils/queueHandler');
const { pool } = require('../db.config');
const util = require('util');
const axios = require('axios');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { type } = require('os');

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

        queueHandler.createConnectionAndChannel();

        const videoUrls = [];
        // Assuming queueHandler receives messages with violation details
        const violationMessage = await queueHandler.getFromQueue('evidence-uploaded'); 

        if (!violationMessage) {
            return res.json({
                message: "No violation message received"
            });
        }

        // const violationData = violationMessage.map(string => JSON.parse(string));
        // console.log(violationData); 
        console.log(violationMessage);

        for (const video of violationMessage) {
            // Query the DB to get details about the uploads based on the violationData
            const query = 'SELECT * FROM reported_violations WHERE videokey = $1 AND status = \'Pending Review\'';
            const result = await pool.query(query, [video.videokey]);

            if (result.rows.length > 0) {
                // Creating a PutObject command
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: video.videokey,
                };

                const command = new GetObjectCommand(getObjectParams);

                // Getting the URL of the object
                const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

                videoUrls.push({ url ,deleveryTag: video.deliveryTag, videokey: video.videokey,violationtype: video.violationtype,city:video.city,date:video.reportdate,description:video.description,thumbnail:video.thumbnail,caseID : video.caseid});
            }
        }

        if (videoUrls.length === 0) {
            return res.json({
                message: "No violations found"
            });
        }

        return res.json({
            videoUrls
        });
        
    } catch (error) {
        console.error('Error while viewing uploaded violations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



// const verifyUploads = async (req,res) => {

//     const { videokey, verified,deliveryTag } = req.body;

//     try {
//         const query = 'UPDATE reported_violations SET status = $1 WHERE videokey = $2';
//         const result = await pool.query(query, [verified, videokey]);

//         if (result.rowCount === 0) {
//             return res.json({
//                 message: "No such video found"
//             });
//         }
//         ;
//         {
//             //sending acknowledgement to the queue
//             queueHandler.sendAck(deliveryTag);

//             return res.json({
//                 message: "Video Verified Sucessfully and Acknowledgement sent to the queue"
//             });

//         }

//     }
//     catch (error) {
//         console.error('Error verifying violation:', error);
//     }
// };

const getPastViolations = async (req,res) => {
    
        const { violations,vehicle_no } = req.query;

        // console.log(violations)
        let pastViolations = []

        try{
            for (const listViolations of violations) {
                const query =
                  'SELECT * FROM reported_violations INNER JOIN police_divisions ON reported_violations.division_id = police_divisions.division_id WHERE vehicleno = $1 AND $2 = ANY(verified_violations)';
                const result = await pool.query(query, [vehicle_no, listViolations]);
            
                for (const row of result.rows) {
                  pastViolations.push({ image: row.thumbnail, description: row.description, location: row.location, date: row.reportdate});
                }
              }
            
              if (pastViolations.length > 0) {
                return res.json({
                  pastViolations: pastViolations,
                });
              } else {
                return res.json({
                  message: "No such video found",
                });
              }

    
        }
        catch(error){
            console.error('Error verifying violation:', error);
        }
    
};

const verifyUploads = async (req,res) => {

    const { caseID,offences,divisionCode,violationStatus,remarks,deliveryTag } = req.body;
    const priviewImage = req.files.priviewImage;

    try {

        //get previous thumbnail_name
        const query = 'SELECT thumbnail FROM reported_violations WHERE caseid = $1';
        result = await pool.query(query, [caseID]);

        thumbnail_name = result.rows[0].thumbnail;

        if(!priviewImage){
            return res.json({
                message: "No priview image found"
            });
        }

        // Specify the destination path where the preview should be updated - Locally
        const parentDir = path.resolve(__dirname, '..');
        const filepath = path.join(parentDir, '/uploads/previews', thumbnail_name);

        //delete previous thumbnail
        fs.unlink(filepath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting file' });
            }
        })

        //upload new thumbnail
        priviewImage.mv(filepath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error replacing file' });
            }
        })

        //updating the reported_violations table
        const query2 = 'UPDATE reported_violations SET verified_violations = $1, division_id = $2, status = $3,remarks = $4 WHERE caseid = $5';
        const result2 = await pool.query(query2, [offences, divisionCode, violationStatus,remarks, caseID]);

        if(result2.rowCount === 0){
            return res.status(500).json({ message: 'Error updating the table' });
        }
        else{
            return res.json({
                message: "Video Verified Sucessfully"
            });
        }

        //sending acknowledgement to the queue
        queueHandler.sendAck(deliveryTag);


    }
    catch (error) {
        console.error('Error verifying violation:', error);
    }
};

module.exports = {
    viewUploadedViolations,
    verifyUploads,
    getPastViolations
};