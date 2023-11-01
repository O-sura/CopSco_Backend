const { pool } = require("../db.config");

const makeAppeal = async (request, response) => {
    try {
        const { userId, caseId, reason, description } = request.body;

        const userExists = await pool.query("SELECT * FROM users WHERE userid = $1", [userId]);

        if (userExists.rows.length === 0) {
            return response.status(404).json({
                message: "User not found"
            });
        }

        const caseExists = await pool.query("SELECT * FROM fine WHERE reference_id = $1", [caseId]);

        if (caseExists.rows.length === 0) {
            return response.status(404).json({
                message: "Case not found"
            });
        }

        const updateResult = await pool.query("UPDATE fine SET status = 2 WHERE reference_id = $1", [caseId]);

        if (updateResult.rowCount === 1) {
            const insertResult = await pool.query("INSERT INTO appeals (caseid, reason, description) VALUES ($1, $2, $3) RETURNING *", [caseId, reason, description]);

            if (insertResult.rowCount === 1) {
                return response.status(200).json({
                    message: "Appeal details inserted successfully"
                });
            } else {
                return response.status(500).json({
                    message: "Failed to insert appeal details"
                });
            }
        } else {
            return response.status(500).json({
                message: "Failed to update fine status"
            });
        }
    } catch (error) {
        console.error(error);
        return response.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {makeAppeal};