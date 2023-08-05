const express = require('express');
const router  = express.Router()
const fileUpload = require('express-fileupload');
const path = require('path');
const fileExtLimiter = require('../middleware/fileExtLimiter');
const { imageFileSizeLimiter } = require('../middleware/fileSizeLimiter');
const { filePayloadExists } = require('../middleware/filePayloadExists');
const pool = require('../db.config');

router.post('/verify-doc', 
        fileUpload({createParentPath: true}),
        filePayloadExists,
        fileExtLimiter([".jpg", ".png", ".jpeg"]),
        imageFileSizeLimiter,
        async (req,res) => {
            const files = req.files;
            const nic = req.nic_num;
            //const nic = "200020902030";
            //console.log("NIC:" + nic)
            let idFront = idBack = verifyImage = null;
            //console.log(files)

            //Assign the file names to the correct variables

            Object.keys(files).forEach(key => {
                const filepath = path.join(__dirname, 'uploads/img', files[key].name);
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

router.post('/video-evidence', (req,res) => {

})

module.exports = router;