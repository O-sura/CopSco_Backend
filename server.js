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
const axios = require('axios');

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


app.get('/', async (req,res) => {
    res.sendFile(path.join(__dirname,'index.html'))
    //console.log(response)
})

app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/images', express.static(path.join(__dirname, 'uploads')));

app.use('/api/upload', require('./routes/uploadRoutes'));

app.use('/api/copsco', require('./routes/policeAuthRoute'));

app.use('/api/fines', require('./routes/fineManagement.js'));

app.use('/api/payfine', require('./routes/finePaymentRoute.js'));

app.use('/api/driver', require('./routes/getDriver.js'));

app.use('/api/admin', require('./routes/adminRoute.js'));

app.use('/api/violations', require('./routes/handleVideosRoutes'));

app.use('/api/police-division', require('./routes/police-division-routes'));


app.use('/api/profile-info', require('./routes/profileRoutes'));

app.get('/api/protected', verifyJWT, (req,res) =>{
    res.send("This is a protected route")
})


//Server configs
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

