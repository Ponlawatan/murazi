const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const cors = require('cors');


// โหลดตัวแปรจากไฟล์ .env
dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(cors());



// เชื่อมต่อ MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));

// Routes
app.use('/api/auth', authRoutes);

app.use('/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
