const { pool } = require('../db.config');

const viewDocuments = async (req, res) => {

    const {divisionID} = req.query;

    try{
        
        const documents = [];

        const query = "SELECT * FROM users INNER JOIN police_divisions ON users.division_id = police_divisions.division_id WHERE admin_verified = false AND verification_mode = 1::BIT AND police_divisions.police_username = $1";
        const result = await pool.query(query, [divisionID]);
        // console.log(query);

        if(result.rows.length === 0){
            return res.json({
                message: "No documents found"
            });
        }
        else
        {
            for (const document of result.rows) {
                documents.push({ name: document.fname + " " + document.lname, NICfrontview : document.idfront, NICreartview : document.idback, location : document.division_name,
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

module.exports = {
    viewDocuments
};