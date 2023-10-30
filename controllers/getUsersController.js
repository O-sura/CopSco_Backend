const { pool } = require('../db.config');

const getAllUsers = async (request, response) => {
    try {
        const users = await pool.query("SELECT CONCAT(fname,' ', lnmae) AS name, contactno, email, nic, datejoined FROM users ");

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
