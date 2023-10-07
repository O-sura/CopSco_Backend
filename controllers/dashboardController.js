const { DataSync } = require("aws-sdk");
const { pool } = require("../db.config");

const viewDashboard = async (request, response) => {
  try {
    const dashboardData = {};

    const usersCountResult = await pool.query(
      "SELECT COUNT(*) as userCount FROM users"
    );
    const fineSumResult = await pool.query(
      "SELECT SUM(amount) as fineSum FROM fine"
    );
    const finecountResult = await pool.query(
      "SELECT status, COUNT(*) as fineCount FROM fine GROUP BY status"
    );

    const videoCountResult = await pool.query(
      "SELECT COUNT(*) as videoCount FROM reported_violations"
    );
    const videoCountResults = await pool.query(
      "SELECT status, COUNT(*) as VideoCount FROM reported_violations GROUP BY status"
    );
    const violationCountByMonthResult = await pool.query(
      "SELECT EXTRACT(MONTH FROM date) AS month_number,CASE EXTRACT(MONTH FROM date) WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March' WHEN 4 THEN 'April' WHEN 5 THEN 'May' WHEN 6 THEN 'June' WHEN 7 THEN 'July' WHEN 8 THEN 'August' WHEN 9 THEN 'September' WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December' ELSE 'Invalid Month' END AS month_name, COUNT(*) AS violationCount FROM fine GROUP BY EXTRACT(MONTH FROM date) ORDER BY month_number;"
    );
    const violationCountByDistrictResult = await pool.query(
      "SELECT police_divisionid, COUNT(*) AS violationCount FROM fine GROUP BY police_divisionid ORDER BY police_divisionid"
    );

    dashboardData.usersCount = usersCountResult.rows[0];
    dashboardData.fineSum = fineSumResult.rows[0];
    dashboardData.videoCount = videoCountResult.rows[0];
    dashboardData.videoCounts = videoCountResults.rows;
    dashboardData.violationCount = violationCountByMonthResult.rows;
    dashboardData.violationCountByDistrict = violationCountByDistrictResult.rows;
    dashboardData.fineCounts = finecountResult.rows;
    return response.status(200).json(dashboardData);
  } catch (error) {
    // Handle any database query errors here
    console.error("Database query error:", error);
    return response.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { viewDashboard };
