const { pool } = require('../db.config');

const getAllUsers = async (request, response) => {
    try {
        const users = await pool.query("SELECT po.officerid, CONCAT(po.fname,' ', po.lnmae) AS name, po.contactno, po.email, po.nic, pu.userrole, pd.location FROM police_officer po INNER JOIN police_user pu ON po.officerid = pu.username INNER JOIN police_divisions pd ON po.stationid = pd.division_id");

        if (users.rows.length === 0) {
            return response.status(400).json({
                message: "No users found"
            }); 
        } else {
            return response.status(200).json(users.rows);
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {getAllUsers};
