const { rmvPool,pool } = require('../db.config');
const { v4: uuidv4 } = require('uuid');
const {sendMsgVerification} = require('../utils/authMessenger');

// const pool = db.pool;
// const rmvPool = db.rmvPool;

const issueFines = async(req, res) => {
    const {
        date,
        time,
        vehicleNumber,
        vehicleProvince,
        policeDivisionID,
        description,
        typeOfOffence,
        fineAmount,
        demeritPoints,
        licenseNumber
    } = req.body;

    try
    {
        //check driver details
        const driver = await rmvPool.query(
            'SELECT * FROM rmv_users WHERE license_number = $1', [licenseNumber]);

        if(driver.rows.length === 0)
        {
            return res.status(401).json({error: "Driver not found, please check the license number"});
        }
        else
        {
            //return driver details as json
            const driverDetails = driver.rows[0];
            const NIC = driverDetails.nic;
            const userID = await pool.query(
                'SELECT userid FROM users WHERE nic = $1'
                , [NIC]);
            const contact = await pool.query(
                'SELECT contactno FROM users WHERE nic = $1'
                , [NIC]);


            //check if police division exists
            const police = await pool.query("SELECT * FROM police_divisions WHERE division_id = $1", [policeDivisionID]);

            if(police.rows.length === 0)
            {
                return res.status(401).json({error: "Invalid police division"});
            }
            else
            {
                //generate a uuid for the reference id
                const reference_ID = uuidv4();

                //set due date two weeks after the current date
                const currentDate = new Date();
                currentDate.setDate(currentDate.getDate() + 14);
                const dueDate = currentDate.toISOString().slice(0,10);
                let message = `You have been issued a fine for ${typeOfOffence}. Please pay your fine before ${dueDate} by logging into your CopSco account.`;

                // const fine = await pool.query(
                //     "INSERT INTO fine (reference_id, date, time, vehicle_number, vehicle_province, police_divisionid, type_of_offence, amount, demerit_points, due_date, nic,description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12) RETURNING *",
                //     [reference_ID, date, time, vehicleNumber, vehicleProvince, policeDivisionID, typeOfOffence, fineAmount, demeritPoints, dueDate, NIC,description]
                // );
                const fine = await pool.connect();

                try
                {
                    await fine.query('BEGIN');
                    const queryText = "INSERT INTO fine (reference_id, date, time, vehicle_number, vehicle_province, police_divisionid, type_of_offence, amount, demerit_points, due_date, nic,description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11,$12) RETURNING *";
                    const queryValues = [reference_ID, date, time, vehicleNumber, vehicleProvince, policeDivisionID, typeOfOffence, fineAmount, demeritPoints, dueDate, NIC,description];
                    await fine.query(queryText, queryValues);

                    const queryText2 = "UPDATE license_status SET tot_demerit_points = tot_demerit_points + $1 WHERE user_id = $2";
                    const queryValues2 = [demeritPoints, userID.rows[0].userid];
                    await fine.query(queryText2, queryValues2);

                    await fine.query('COMMIT');

                    const textMsg = await sendMsgVerification(contact,message);
                    
                    if(textMsg)
                    {
                        return res.status(200).json({message: "Fine issued successfully"});
                    }
                    else
                    {
                        return res.status(401).json({error: "Fine issued successfully, text message failed"});
                    }
                }
                catch(err)
                {
                    await fine.query('ROLLBACK');
                    console.error(err.message);
                    return res.status(401).json({error: "Error issuing fine, please try again"});
                }
                finally
                {
                    fine.release();
                }
            }
        }   
    }

    catch(err)
    {
        console.error(err.message);
    }
};

const getFineDetails = async(req, res) => {
    const { referenceID } = req.body;

    try
    {
        const fine = await pool.query("SELECT * FROM fine WHERE reference_id = $1", [referenceID]);

        if(fine.rows.length === 0)
        {
            return res.status(401).json({error: "Fine not found"});
        }
        else
        {
            return res.status(200).json(fine.rows[0]);
        }
    }
    catch(err)
    {
        console.error(err.message);
    }
};

const getFines = async (req, res) => {
    const { nic } = req.query;

    try {
        // Get fines sorted by date
        const fines = await pool.query(
            "SELECT * FROM fine INNER JOIN police_divisions ON fine.police_divisionid = police_divisions.division_id WHERE nic = $1 ORDER BY date DESC",
            [nic]
        );

        if (fines.rows.length === 0) {
            return res.status(401).json({ error: "No fines found" });
        } else {
            // Map through fines and update the status, appealBefore, and location fields
            const updatedFines = fines.rows.map((fine) => {
                const today = new Date();
                const dueDate = new Date(fine.due_date);
                const appealBefore = new Date(fine.date);
                appealBefore.setDate(appealBefore.getDate() + 2); // Adding 2 days

                if (fine.status === 0 && dueDate < today) {
                    fine.status = "Overdue";
                } else if (fine.status === 1) {
                    fine.status = "Paid";
                } else if (fine.status === 0) {
                    fine.status = "Pending";
                }

                // Remove unwanted fields
                delete fine.division_id;
                delete fine.police_divisionid;
                fine.police_division = fine.location;
                delete fine.location;

                // Add the appealBefore field
                fine.appealBefore = appealBefore;

                return fine;
            });

            return res.status(200).json(updatedFines);
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    issueFines,
    getFineDetails,
    getFines
};