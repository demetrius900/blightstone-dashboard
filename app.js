const express = require('express');
const app = express();
const path = require('path');
const route = require('./routes/route');
const apiRoutes = require('./routes/api');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const upload = require('express-fileupload');
const dotenv = require('dotenv');
// Load .env first (for secrets), then config.env (for defaults)
dotenv.config({ path: "./.env" });
dotenv.config({ path: "./config.env" });

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(upload());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    resave: false, 
    saveUninitialized: false, 
    secret: process.env.SESSION_SECRET || 'blightstone-super-secret-key-change-in-production',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(cookieParser());

app.set('layout', 'partials/layout-vertical');
app.use(expressLayouts);

app.use(express.static(__dirname + '/public'));

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes.router);

// API routes
app.use('/api', apiRoutes);

// Page routes
app.use('/', route);

app.use((err, req, res, next) => {
    let error = { ...err }
    if (error.name === 'JsonWebTokenError') {
        err.message = "please login again";
        err.statusCode = 401;
        return res.status(401).redirect('view/auth-login');
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'errors';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,

    })
});

const http = require("http").createServer(app);
http.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
    console.log(`http://localhost:${process.env.PORT}`)
});