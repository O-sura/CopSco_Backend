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
      console.log(userId);
      console.log(newUserRole);

      // Check if the user with the given userId exists
      const userExists = await pool.query("SELECT * FROM police_user WHERE username = $1", [userId]);

      if (userExists.rows.length === 0) {
          return response.status(400).json({
              message: "User not found"
          });
      }

      // Update the user's role
      const updateQuery = "UPDATE police_user SET userrole = $1 WHERE username = $2";
      const values = [newUserRole, userId];
      console.log(values);

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

const updateUserStatus = async (request, response) => {
  try {
      const { userId, newUserStatus } = request.body;
      console.log(userId);
      console.log(newUserStatus);


      // Check if the user with the given userId exists
      const userExists = await pool.query("SELECT * FROM users WHERE userid = $1", [userId]);

      if (userExists.rows.length === 0) {
          return response.status(400).json({
              message: "User not found"
          });
      }

      // Update the user's role
      const updateQuery = "UPDATE users SET status = $1 WHERE userid = $2";
      const values = [newUserStatus, userId];

      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 1) {
          return response.status(200).json({
              message: "User status updated successfully"
          });
      } else {
          return response.status(400).json({
              message: "Failed to update user status"
          });
      }
  } catch (error) {
      console.error(error);
      return response.status(500).json({
          message: "Internal server error"
      });
  }
}

const getPoliceUsers = async (request, response) => {
  try {
      const users = await pool.query("SELECT po.officerid, CONCAT(po.fname,' ', po.lname) AS name, po.contactno, po.email, po.nic, pu.userrole, pd.location FROM police_officer po INNER JOIN police_user pu ON po.officerid = pu.username INNER JOIN police_divisions pd ON po.stationid = pd.division_id");

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

const getAllUsers = async (request, response) => {
  try {
      const users = await pool.query("SELECT userid, CONCAT(fname,' ',lname) AS name, contactno, email, nic, datejoined, status, user_activity From users");

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




module.exports = {createUsers, updateUserRole, getPoliceUsers, getAllUsers, updateUserStatus};
