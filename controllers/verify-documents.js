const { pool } = require('../db.config');
const {sendMsgVerification} = require('../utils/authMessenger');


const viewDocuments = async (req, res) => {

    const {police_username} = req.query;

    try{
        
        const documents = [];

        const query = "SELECT * FROM users INNER JOIN police_divisions ON users.division_id = police_divisions.division_id WHERE admin_verified = false AND verification_mode = 1::BIT AND police_divisions.police_username = $1";
        const result = await pool.query(query, [police_username]);
        // console.log(query);

        if(result.rows.length === 0){
            return res.json({
                message: "No documents found"
            });
        }
        else
        {
            for (const document of result.rows) {
                documents.push({ name: document.fname + " " + document.lname, NICfrontview : document.idfront, NICreartview : document.idback,verificationImage:document.verificationimage, location : document.division_name,
                 fullname : document.fname + " " + document.lname, NIC : document.nic});
            }
            return res.json({
                documents
            });
        }


    }
    catch(err){
        console.log("Error: ",err);
        return res.status(500).json({ message: 'Internal server error' });
        
    }
};

const verifyDocuments = async (req, res) => {

    const {nic,verified,reason} = req.body;

    try{

        const contact = await pool.query("SELECT contactno FROM users WHERE nic = $1", [nic]);

        if(verified === true){
            const query = "UPDATE users SET admin_verified = $1 WHERE nic = $2";
            const result = await pool.query(query, [verified,nic]);
            
            let message = `Your document verification is completed. login to your CopSco account to upload the evidences.`;
            const textMsg = await sendMsgVerification(contact,message);
    
            if(textMsg && result.rowCount === 1){
                return res.json({
                    message: "Successfully verified"
                });
            }
            else
            {
                return res.json({
                    message: "Successfully verified, but failed to send the text message"
                });
            }
        }
        else{
            const query = "DELETE FROM users WHERE nic = $1"
            const result = await pool.query(query, [nic]);
        
            let message = `Your document verification is failed. ${reason}`;
            const textMsg = await sendMsgVerification(contact,message);

            if(textMsg && result.rowCount === 1){
                return res.json({
                    message: "Successfully rejected"
                });
            }
            else
            {
                return res.json({
                    message: "Successfully rejected, but failed to send the text message"
                });
            }
        }
        

    }
    catch(err){
        console.log("Error: ",err);
        return res.status(500).json({ message: 'Internal server error' });
        
    }
};


module.exports = {
    viewDocuments,
    verifyDocuments
};