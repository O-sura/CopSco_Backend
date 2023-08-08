const crypto = require('crypto');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');


const generateOTP = () => {
    let otp = Math.floor(100000 + Math.random() * 900000);
    let otpExpiration  = new Date(Date.now() + 3 * 60 * 1000);
    return {otp, otpExpiration }
}

const generateRandomString = (len) => { 
    let string = crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
    return string;
}

const generateQRCode = (nic, secret) => {
    const data = nic + "-" + secret;
    const options = {
    type: 'png', // You can use other types like 'svg', 'pdf', etc.
    quality: 0.8, // Image quality (for PNG and JPEG only)
    margin: 1, // Margin around the QR code (default is 4)
    width: 300,
    height: 300,
    };

    const parentDir = path.resolve(__dirname, '..');

    
    // Directory where you want to save the QR code
    const qrDirectory = path.join(parentDir, 'uploads', 'qr');

    // Create the directory if it doesn't exist
    if (!fs.existsSync(qrDirectory)) {
        fs.mkdirSync(qrDirectory, { recursive: true });
    }

    // File path for the QR code
    const qrFilePath = path.join(qrDirectory, `${nic}_qr.png`);

    // Generate the QR code and save it to the file
    qrcode.toFile(qrFilePath, data, options, (err) => {
    if (err) {
        console.error('Error generating QR code:', err);
        return false;
    } else {
        return true;
    }
    });

}

module.exports = {generateOTP, generateRandomString, generateQRCode}