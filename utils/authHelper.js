const crypto = require('crypto');

const generateOTP = () => {
    let otp = Math.floor(100000 + Math.random() * 900000);
    let otpExpiration  = new Date(Date.now() + 3 * 60 * 1000);
    return {otp, otpExpiration }
}

const generateRandomString = (len) => { 
    let string = crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
    return string;
}



module.exports = {generateOTP, generateRandomString}