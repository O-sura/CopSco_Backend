const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config()
const cookieParser = require('cookie-parser');
const sessionMiddleware = require('./middleware/sessionMiddleware');
const verifyJWT = require('./middleware/verifyJWT');
const credentials = require('./middleware/credentials');
const corsOptions = require('./config/corsOptions');
const path = require('path');
const {generateQRCode} = require('./utils/authHelper')

let PORT = process.env.PORT | 8000

//Handling server side session
app.use(sessionMiddleware);

//Handle options credentials check - before CORS!
//and fetch cookies credentials requirement
app.use(credentials);

//Cross origin resource sharing
app.use(cors(corsOptions))

//in-built middleware for json
app.use(bodyParser.json())

//in-built middleware to handle urlencoded data
app.use(express.urlencoded({extended:false}));

app.use(cookieParser());


app.get('/', (req,res) => {
    const {secret, nic} = req.body;
    if(generateQRCode(nic,secret)){
        res.send("QR successfully generated")
    }
})

app.use('/auth', require('./routes/authRoutes'));

app.use('/upload', require('./routes/uploadRoutes'));

app.use('/copsco', require('./routes/policeAuthRoute'));

app.get('/protected', verifyJWT, (req,res) =>{
    res.send("This is a protected route")
})


//Server configs
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})