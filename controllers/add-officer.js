const bcrypt = require('bcrypt');
const {pool} = require('../db.config');


const addPoliceOfficers = async (req, res) => {

    const {nic,officerID} = req.body;

    try{
            
        const query = "SELECT * FROM police_officer WHERE officer_id = $1 OR nic = $2";
        const police_officer = await pool.query(query, [officerID,nic]);

        if(police_officer.rows.length === 0){
            const query2 = "SELECT * FROM police_user WHERE username = $1";
            const result = await pool.query(query2, [officerID]);

            if(result.rows.length > 0){
                return res.json({
                    message: "Police user already exists"
                });
            }
            else
            {
                // Encrypt the password using bcrypt
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(nic, saltRounds);

                const query3 = "INSERT INTO police_user (username,password,userrole,status) VALUES ($1,$2,$3,$4)";
                const result2 = await pool.query(query3, [officerID,hashedPassword,"traffic-police","Active"]);

                if(result2.rowCount === 1){
                    return res.json({
                        message: "Successfully added"
                    });
                }
                else
                {
                    return res.json({
                        message: "Error occured adding user"
                    });
                }

            }
        }
        else
        {
            return res.json({
                message: "No such Police officer exists, check the NIC or officer ID again"
            });
        }
    }
    catch(err){
        console.log("Error: ",err);
        return res.status(500).json({ message: 'Internal server error' });
        
    }
};

const viewPoliceOfficers = async (req, res) => {
    
        const {stationid} = req.query;
    
        try{

            const policeOfficer = []
                
            const query = "SELECT * FROM police_user INNER JOIN police_officer ON police_user.username = police_officer.officerid WHERE police_officer.stationid = $1";
            const result = await pool.query(query, [stationid]);

            if(result.rows.length === 0){
                return res.json({
                    message: "No police officers found"
                });
            }
            else
            {
                for (const officer of result.rows) {
                    policeOfficer.push({ full_name: officer.fname + " " + officer.lname, officerID : officer.officerid, NIC : officer.nic, status: officer.status});
                }
                return res.json({
                    policeOfficer
                });
            }
        }
        catch(err){
            console.log("Error: ",err);
            return res.status(500).json({ message: 'Internal server error' });
            
        }
};

module.exports = {addPoliceOfficers,viewPoliceOfficers}