require("dotenv").config(); // MUST be first

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize Cloudinary
require('./config/cloudinary');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skinImageRoutes = require('./routes/skinImageRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const labRequestRoutes = require('./routes/labRequestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cleaningTaskRoutes = require('./routes/cleaningTaskRoutes');
const supplyRequestRoutes = require('./routes/supplyRequestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const patientRoutes = require('./routes/patientRoutes'); // ✅ NEW

const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();

// ===============================
// CORS (MUST BE FIRST)
// ===============================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ===============================
// Middleware
// ===============================
app.use(express.json());

// ===============================
// Database Connection
// ===============================
connectDB();

// ===============================
// Seed Super Admin
// ===============================
const seedSuperAdmin = async () => {
  try {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@gmail.com';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Kokulan2003';

    const exists = await User.findOne({ email: SUPER_ADMIN_EMAIL });

    if (!exists) {
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

      await User.create({
        name: 'Super Admin',
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        status: 'approved'
      });

      console.log('Super admin created');
    } else {
      console.log('Super admin already exists');
    }

  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

// Run after DB connection
seedSuperAdmin();

// ===============================
// Routes
// ===============================

// Root route
app.get("/", (req, res) => {
  res.send("Hospital Management Backend Running...");
});

// API test route
app.get("/api", (req, res) => {
  res.json({ message: "API is working" });
});

// Main APIs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skin-images', skinImageRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/lab-requests', labRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cleaning-tasks', cleaningTaskRoutes);
app.use('/api/supply-requests', supplyRequestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/patient', patientRoutes); // ✅ NEW

// ===============================
// Server Start
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});