const {md5} = require('crypto-js/md5');
const crypto = require('crypto');
const { pool } = require('../db.config');

//controller function for handling the online fine payment process
const payfineOnline = async(req,res) => {

    let {fineID} = req.body;

    try {
        const query = 'SELECT * FROM fine WHERE reference_id = $1'; //Must select only the appropriate columns
        const result = await pool.query(query, [fineID]);
        if(result){
            let merchantSecret  = process.env.MERCHANT_SECRET;
            let merchantId      = process.env.MERCHANT_ID;
        
            let fineAmount      = result.rows[0].amount;
            let hashedSecret    = md5(merchantSecret).toString().toUpperCase();
            let amountFormated  = parseFloat( fineAmount ).toLocaleString( 'en-us', { minimumFractionDigits : 2 } ).replaceAll(',', '');
            let currency        = 'LKR';
            let generatedHash   = md5(merchantId + fineID + amountFormated + currency + hashedSecret).toString().toUpperCase();

            
            // Convert the result rows to JSON
            const fineDetails = result.rows.map(row => {
                // Extract row data into a new object
                const rowData = {
                    ...row,
                    hash: generatedHash // Add the external key-value pair
                };
                
                return rowData;
            });

            console.log(fineDetails);
            // Send the video data to the frontend
            //res.status(200).json(fineDetails);
            
        }
    } catch (error) {
        console.error('Error processing fine data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}    


//controller function for handling the manual fine payment process
const payfineOffline = async(req,res) => {
    const { fineID } = req.body
    try {
        
    } catch (error) {
        
    }
}    

//controller function for updating the payment status upon the server callback
const updatePaymentStatus = async(req,res) => {
    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = req.body;

    const merchant_secret = process.env.MERCHANT_SECRET; // Replace with your Merchant Secret

    const local_md5sig = crypto
        .createHash('md5')
        .update(
            merchant_id +
            order_id +
            payhere_amount +
            payhere_currency +
            status_code +
            merchant_secret.toUpperCase()
        )
        .digest('hex')
        .toUpperCase();

    if (local_md5sig === md5sig && status_code === '2') {
        // TODO: Update your database as payment success
    }

    res.status(200).send('OK');
}


module.exports = {
    payfineOnline,
    payfineOffline
}