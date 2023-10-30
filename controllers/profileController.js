const path = require('path');
const { pool } = require('../db.config');
const axios = require('axios');
const bcrypt = require('bcrypt');

const getProfileData = async(req, res) => {
  const userID = req.params.id;
  //const userID = "2a114d7a-7046-481c-bcf3-5dd8aadeb0a0";

  try {
    //Fname + Lname, Demerit Points(from license_status table), Rewards amount, Points, tier, QR, secret
    let query =
      "SELECT fname, lname, nic, secret FROM users WHERE userid = $1";
    const userInfoRes = await pool.query(query, [userID]);

    //Bank, branch, acc no, aacount holder name
    query = "SELECT * FROM user_bank WHERE userid = $1";
    const bankInfoRes = await pool.query(query, [userID]);
    
    //RMV -> use nic to find relevant RMV user and get license no
    //Using license no -> find all registered vehicals under that no.
    //info needed -> plate no, ab owner, engine no, chassis no, category, brand, model, 
    query = "SELECT * FROM dmv WHERE userid = $1";
    const vehicleInfoRes = await pool.query(query, [userID]);


    // Create a combined JSON object
    const combinedInfo = {
      user:userInfoRes.rows,
      bank: bankInfoRes.rows,
      vehicles: vehicleInfoRes.rows,
    };
    
    res.status(200).json(combinedInfo);
  } catch (error) {
    console.error("Error querying the database:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const downloadQR = async(req, res) => {
  const qrImageName = req.query.qrImageName;

  // The filename and path to the QR code image on your server
  const qrCodeImagePath = path.join(__dirname, `../uploads/qr/${qrImageName}`); // Replace with your actual path and filename

  // You can set a custom filename for the downloaded file, or keep the original filename
  const downloadFilename = `qr-code.png`; // Replace with your desired filename

  // Use res.download() to send the file for download
  res.download(qrCodeImagePath, downloadFilename, (err) => {
    if (err) {
      // Handle any errors that occur during download
      console.error('Error while downloading QR code:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
};

const addBankInfo = async(req, res) => {
  //const userID = req.user;
  const { bank, branch, accountno, acc_holder } = req.body;
  const userID = "2a114d7a-7046-481c-bcf3-5dd8aadeb0a0";

  try {
    const query =
      "INSERT INTO user_bank(userid,bank,branch,accountno,acc_holder) VALUES($1,$2,$3,$4,$5) RETURNING *";
    const result = await pool.query(query, [userID, bank, branch, accountno, acc_holder]);

    if(result)
      res.status(200).json({message: "Bank details successfully added"});
    else 
      res.status(404).json({ message: "Error adding new record to database" });
    

  } catch (error) {
    console.error("Error adding bank details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateBankInfo = async(req, res) => {
  // const userID = req.user;
  const { bank, branch, accountno, acc_holder } = req.body;
  const userID = "2a114d7a-7046-481c-bcf3-5dd8aadeb0a0"; 

  try {
    const query =
      "UPDATE user_bank SET bank = $2, branch = $3, accountno = $4, acc_holder = $5 WHERE userid = $1 RETURNING *";
    const result = await pool.query(query, [userID, bank, branch, accountno, acc_holder]);

    if (result) {
      res.status(200).json({ message: "Bank details successfully updated" });
    } else {
      res.status(404).json({ message: "User bank account not found" });
    }
  } catch (error) {
    console.error("Error updating bank details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePassword = async(req, res) => {
  const userID = req.user;
  const {oldpass, newpass, newpassConf} = req.body;

  try {
    const query =
      "SELECT password FROM users WHERE userid = $1";
    const result = await pool.query(query, [userID]);

    if(result){
      //compare whether the old password is correct
      const saltRounds = 10;
      let dbStored_oldpass = result.rows[0].password;
      let isPasswordValid = await bcrypt.compare(oldpass, dbStored_oldpass);

      if(isPasswordValid){
        //compare new passwords match
        if(newpass !== newpassConf){
          return res.status(404).json({ message: "Error: New password and the confirmation do not match" });
        }
        else{
          //update the new password
          const hashedPassword = await bcrypt.hash(newpass, saltRounds);
          const query =
            "UPDATE users SET password = $1 WHERE userid = $2 RETURNING *";
          const updateRes = await pool.query(query, [hashedPassword, userID]);
          
          if(updateRes)
             return res.status(200).json({message: "Password updated successfully."});
          else
            return res.status(404).json({ message: "Error: Could not update the new password." });
        }
      }
      else{
        return res.status(404).json({ message: "Error: Passed old password do not match the existing." });
      }      
    } 
      
  } catch (error) {
    console.error("Error adding bank details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProfile = async(req, res) => {
  const userID = req.params.id;
  try {
    const query =
      "DELETE FROM users WHERE userid = $1";
    const result = await pool.query(query, [userID]);

    if(result)
      return res.status(200).json({message: "User profile deleted successfully"});
  } catch (error) {
    console.error("Error: Cannot delete the user", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const withdrawRewards = async(req, res) => {
  const userID = req.user;
  const amount = req.body.amount;

  //Deduct the amount if available
};


module.exports = {
    getProfileData,
    downloadQR,
    addBankInfo,
    updateBankInfo,
    updatePassword,
    deleteProfile,
    withdrawRewards
  };