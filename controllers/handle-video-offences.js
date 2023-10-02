const {pool} = require('../db.config');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

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

const viewVerifiedVideos = async (req, res) => {
    
        const {police_username} = req.query;
    
        try{
            
            const videos = [];
    
            const query = "SELECT * FROM reported_violations INNER JOIN police_divisions ON reported_violations.division_id = police_divisions.division_id WHERE status = \'accepted\' AND police_divisions.police_username = $1";
            const result = await pool.query(query, [police_username]);
            // console.log(query);
    
            if(result.rows.length === 0){
                return res.json({
                    message: "No videos found"
                });
            }
            else
            {
                for (const video of result.rows) {
                    videos.push({ caseID : video.caseid, location : video.location, date : video.reportdate, thumbnail : video.thumbnail});
                }
                return res.json({
                    videos
                });
            }
        }
        catch(err){
            console.log("Error: ",err);
            return res.status(500).json({ message: 'Internal server error' });
            
        }
        
};

const viewVerifiedVideoDetails = async (req, res) => {

    const {caseID} = req.query;
    // console.log(caseID);

    try{

        const query = "SELECT * FROM reported_violations INNER JOIN police_divisions ON reported_violations.division_id = police_divisions.division_id WHERE caseid = $1";
        const result = await pool.query(query, [caseID]);
        // console.log(query);

        if(result.rows.length === 0){
            return res.json({
                message: "Incorrect case ID"
            });
        }
        else
        {
            const video = result.rows[0];

            //get the video link
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: video.videokey,
            });

            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

            return res.json({
                caseID : video.caseid, location : video.location, date : video.reportdate, thumbnail : video.thumbnail, description : video.description, violations : video.verified_violations, remarks : video.remarks,
                videoLink : url
            });


        }
    }
    catch(err){
        console.log("Error: ",err);
        return res.status(500).json({ message: 'Internal server error' });
        
    }
};

module.exports = {viewVerifiedVideos,viewVerifiedVideoDetails}