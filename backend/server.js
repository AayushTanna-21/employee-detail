// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
// CHANGE 1: Use the base 'mssql' package (which uses the pure JS 'tedious' driver)
const sql = require('mssql'); 
const util = require('util');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ensure upload dir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

// CHANGE 2: DB config (SQL Server Authentication)
const serverConfig = {
  // Use SQL Server Credentials
  user: process.env.DB_USER,        // e.g., 'appUser'
  password: process.env.DB_PASSWORD, // e.g., 'YourSecurePasswordHere'
  server: process.env.DB_SERVER || 'localhost', // DESKTOP-T0F7RQL
  database: process.env.DB_NAME || 'EmployeeDB',
  
  // Driver is now implied (tedious)
  options: {
    port: 1433, // Static port
    // trustServerCertificate is needed because 'tedious' defaults to 'encrypt: true' 
    // and we don't have a formal SSL certificate for a local DB.
    trustServerCertificate: true, 
  }
};

// Health check
app.get('/', (req, res) => res.send('Backend running'));

// POST: create employee (image optional)
app.post('/api/employees', upload.single('image'), async (req, res) => {
  console.log('POST /api/employees received');
  let pool;
  try {
    const { name, age, designation, details } = req.body;
    console.log('Form fields:', { name, age, designation, details, file: !!req.file });

    if (!name || !age || !designation) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    pool = await sql.connect(serverConfig);
    const result = await pool.request()
      .input('Image', sql.NVarChar(500), imagePath)
      .input('Name', sql.NVarChar(200), name)
      .input('Age', sql.Int, parseInt(age, 10))
      .input('Designation', sql.NVarChar(100), designation)
      .input('Details', sql.NVarChar(sql.MAX), details || null)
      .query(`
        INSERT INTO EmployeeTable (Image, Name, Age, Designation, Details)
        VALUES (@Image, @Name, @Age, @Designation, @Details);
        SELECT SCOPE_IDENTITY() AS Id;
      `);

    const insertedId = result.recordset?.[0]?.Id ?? null;
    // pool.close() is handled in finally block below
    
    res.json({ success: true, message: 'Employee added successfully', id: insertedId, imagePath });
  } catch (err) {
    console.error('Error in /api/employees:', util.inspect(err, { depth: null }));
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Server error', detail: err.message });
  } finally {
    // Cleanup: Close the pool and the global connection
    if (pool) {
      try { await pool.close(); } catch (e) { /* ignore */ }
    }
    try { sql.close(); } catch (e) { /* ignore */ }
  }
});

// GET: list employees in desired order (Id,Image,Name,Age,Designation,Details)
app.get('/api/employees', async (req, res) => {
  let pool;
  try {
    pool = await sql.connect(serverConfig);
    const r = await pool.request().query(`
      SELECT Id, Image, Name, Age, Designation, Details
      FROM EmployeeTable
      ORDER BY CreatedAt DESC
    `);
    // pool.close() is handled in finally block below
    res.json({ success: true, data: r.recordset });
  } catch (err) {
    console.error('Error in GET /api/employees:', util.inspect(err, { depth: null }));
    res.status(500).json({ success: false, message: 'Server error', detail: err.message });
  } finally {
    // Cleanup: Close the pool and the global connection
    if (pool) {
      try { await pool.close(); } catch (e) { /* ignore */ }
    }
    try { sql.close(); } catch (e) { /* ignore */ }
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));