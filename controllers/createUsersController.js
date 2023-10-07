const { pool } = require("../db.config");
const { sendOTP, sendMail } = require("../utils/authMessenger");
const {
  generateOTP,
  generateRandomString,
  generateQRCode,
} = require("../utils/authHelper");
const bcrypt = require("bcrypt");

const createUsers = async (request, response) => {
  try {
    const { policeid, userrole } = request.body;

    const user = await pool.query(
      "SELECT * FROM police_user WHERE username = $1",
      [policeid]
    );

    if (user.rows.length > 0) {
      return response.status(400).json({
        message: "User already exists",
      });
    } else {
      const password = await pool.query(
        "SELECT nic FROM police_officer WHERE officerid = $1",
        [policeid]
      );
      // console.log(password.rows[0].nic)

      // Encrypt the password using bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        password.rows[0].nic,
        saltRounds
      );

      // Insert user data into the database
      const newUser = await pool.query(
        "INSERT INTO police_user (username, password,  userrole) VALUES ($1, $2, $3) RETURNING *",
        [policeid, hashedPassword, userrole]
      );

      if (newUser.rows.length === 0) {
        return response.status(400).json({
          message: "User creation failed",
        });
      } else {
        return response.status(200).json({
          message: "User successfully created",
        });
      }
    }
  } catch (error) {
    console.error(error);
    return response.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = createUsers;
