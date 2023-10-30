const nodemailer = require('nodemailer');
const axios = require('axios');

// Replace these with your actual Gmail credentials or SMTP server details
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'whiteangle654123@gmail.com',
      pass:  process.env.MAILER_APP_PASS,
    },
  });
  

let sendOTP = async (otp, contact) => {
     //Send OTP for verification - phone number and redirect to verification page
     let message = `Thank you for registering in CopSco. Your OTP: ${otp}`;
     let url =  `https://www.textit.biz/sendmsg?id=94710944927&pw=1514&to=${contact}&text=${message}`
     
     try {
       // Make an HTTP POST request using axios
       const response = await axios.post(url)
       // Handle the response from the API
       const responseData = response.data;
       if (response.status === 200) {
        return true; // Return true to indicate success
      } else {
        return false; // Return false to indicate failure
      }
     } catch (error) {
       console.error('Error during API call:', error);
      //res.status(500).json({ error: 'Internal Server Error' });
        return false;
     }
}

let sendMail = async (email, resetToken, userId) => {
    try {
        const mailOptions = {
          from: 'whiteangle654123@gmail.com',
          to: email,
          subject: 'Password Reset',
          html: `<p>Hello,</p><p>Please click the following link to reset your password:</p>
                <a href="http://localhost:8000/auth/reset-link-verify?token=${resetToken}&userid=${userId}">Reset Password</a>`,
        };
    
        const info = await transporter.sendMail(mailOptions);
        // Check if at least one recipient email address was accepted
        const isEmailSent = info.accepted && info.accepted.length > 0;

        // Return true if email was successfully sent, otherwise false
        return isEmailSent;
      
      } catch (error) {
        console.error('Error sending email: ', error);
        res.status(500).json({ error: 'Error in sending the email' });
      }
}

module.exports =  {sendOTP, sendMail}