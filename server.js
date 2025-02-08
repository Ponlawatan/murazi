// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import routes and controllers
const authRoutes = require('./routes/authRoutes');
const { resetPassword } = require('./controllers/authController');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Middleware setup
app.use(bodyParser.json());  // To parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));  // To parse URL-encoded bodies (from forms)
app.use(cors());  // Enable Cross-Origin Resource Sharing
app.set('view engine', 'ejs');
app.set('views', './views');

// MongoDB connection
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log('MongoDB connection error:', err));

// Routes for authentication
app.use('/api/auth', authRoutes); // API endpoints for login, register
app.use('/auth', authRoutes);     // Alternate route for auth

// Route to display the reset password form
app.get('/reset-password', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('Invalid or expired token');
    }

    res.render('reset-password', { token });
});

// Route to handle password reset request
app.post('/reset-password', resetPassword);  // Use resetPassword function from controller

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
