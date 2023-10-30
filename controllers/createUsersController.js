const { pool } = require("../db.config");
const bcrypt = require("bcrypt");

const createUsers = async (request, response) => {
  try {
    const { policeid, userrole} = request.body;

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

const updateUserRole = async (request, response) => {
  try {
      const { userId, newUserRole } = request.body;

      // Check if the user with the given userId exists
      const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

      if (userExists.rows.length === 0) {
          return response.status(400).json({
              message: "User not found"
          });
      }

      // Update the user's role
      const updateQuery = "UPDATE users SET userrole = $1 WHERE id = $2";
      const values = [newUserRole, userId];

      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 1) {
          return response.status(200).json({
              message: "User role updated successfully"
          });
      } else {
          return response.status(400).json({
              message: "Failed to update user role"
          });
      }
  } catch (error) {
      console.error(error);
      return response.status(500).json({
          message: "Internal server error"
      });
  }
};




module.exports = {createUsers, updateUserRole};
