const express = require('express');
const router = express.Router();
const db = require('../db.config.js'); 
//const { get } = require('lodash');
const { v4: uuidv4 } = require('uuid');

const pool = db.pool;
const rmvPool = db.rmvPool;


router.post('/issueFines', async(req, res) => {
  
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
                    return res.status(200).json({
                        message: "Fine issued successfully",
                        referenceID: reference_ID
                    });
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

});

router.get('/getFines', async(req, res) => {
    const { nic } = req.body;

    try
    {   
        //get fines sort by date
        const fines = await pool.query(
            "SELECT * FROM fine WHERE nic = $1 ORDER BY date DESC", [nic]);

        if(fines.rows.length === 0)
        {
            return res.status(401).json({error: "No fines found"});
        }
        else
        {
            return res.status(200).json(fines.rows);
        }
    }
    catch(err)
    {
        console.error(err.message);
    }
});




module.exports = router;
