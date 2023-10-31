const {pool} = require('../db.config');
const { v4: uuidv4 } = require('uuid');
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
                    videos.push({ caseID : video.caseid, district : video.district, date : video.reportdate, thumbnail : video.thumbnail,city : video.city,divisionStatus :video.division_status,remarks:video.remarks,videoKey:video.videokey});
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
                caseID : video.caseid,district : video.district,city : video.city, date : video.reportdate, thumbnail : video.thumbnail, description : video.description, violations : video.verified_violations, remarks : video.remarks,
                videoLink : url,vehicleno:video.vehicleNumber
            });


        }
    }
    catch(err){
        console.log("Error: ",err);
        return res.status(500).json({ message: 'Internal server error' });
        
    }
};

const video_issueFine = async (req, res) => {
    const { 
        date,
        time,
        vehicleNumber,
        // vehicleProvince,
        policeDivisionID,
        description,
        typeOfOffence,
        fineAmount,
        demeritPoints,
        licenseNumber
    } = req.body;

    try {
        const vehicleUser = await pool.query("SELECT * FROM dmv WHERE plate_no = $1", [vehicleNumber]);
        if(vehicleUser.rows.length === 0)
        {
            return res.status(401).json({error: "Vehicle not found"});
        }
        else
        {
            const nic = vehicleUser.rows[0].current_owner_nic;

            //get user tier to calculate reward
            const tier = await pool.query("SELECT tier FROM users WHERE nic = $1", [nic]);
            let reward_percentage = 0;
            
            switch(tier.rows[0].tier)
            {
                case 'bronze':
                    reward_percentage = 0.05;
                    break;
                case 'silver':
                    reward_percentage = 0.07;
                    break;
                case 'gold':
                    reward_percentage = 0.1;
                    break;
                case 'platinum':
                    reward_percentage = 0.12;
                    break;
                case 'diamond':
                    reward_percentage = 0.15;
                    break;
                default:
                    break;
            }


            const reward = [];

            //calculate reward for each violation based on fineAmount
            for (const violation of fineAmount) {
                reward.push(violation * reward_percentage);
            }

            //insert in to the fine table each violation
            for (let i = 0; i < typeOfOffence.length; i++) {
                const fine = await pool.query("INSERT INTO fine (date, time, vehicle_no, division_id, description, type_of_offence, fine_amount, demerit_points, license_no, reward) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", 
                [date, time, vehicleNumber, policeDivisionID, description, typeOfOffence[i], fineAmount[i], demeritPoints[i], licenseNumber, reward[i]]);
            }

        }
    }
    catch(err)
    {
        // await fine.query('ROLLBACK');
        console.error(err.message);
        return res.status(401).json({error: "Error issuing fine, please try again"});
    }
}

module.exports = {viewVerifiedVideos,viewVerifiedVideoDetails, video_issueFine}