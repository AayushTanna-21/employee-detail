require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const sql = require("mssql");
const util = require("util");
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: "http://localhost:3000" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-")),
});
const upload = multer({ storage });
const serverConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "EmployeeDB",
  options: {
    port: 1433,
    trustServerCertificate: true,
  },
};
app.get("/", (req, res) => res.send("Backend running"));

app.post("/api/employees", upload.array("files", 10), async (req, res) => {
  console.log(
    "POST /api/employees received (files count):",
    (req.files || []).length
  );
  let pool;
  try {
    const { name, age, designation, details } = req.body;

    if (!name || !age || !designation) {
      if (req.files) {
        for (const f of req.files) {
          try {
            fs.unlinkSync(f.path);
          } catch (e) {}
        }
      }
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const uploadedPaths = (req.files || []).map(
      (f) => `/uploads/${f.filename}`
    );
    const imagePath = uploadedPaths.length > 0 ? uploadedPaths[0] : null;
    pool = await sql.connect(serverConfig);
    const result = await pool
      .request()
      .input("Image", sql.NVarChar(500), imagePath)
      .input("Name", sql.NVarChar(200), name)
      .input("Age", sql.Int, parseInt(age, 10))
      .input("Designation", sql.NVarChar(100), designation)
      .input("Details", sql.NVarChar(sql.MAX), details || null).query(`
        INSERT INTO EmployeeTable (Image, Name, Age, Designation, Details)
        VALUES (@Image, @Name, @Age, @Designation, @Details);
        SELECT SCOPE_IDENTITY() AS Id;
      `);
    const insertedId = result.recordset?.[0]?.Id ?? null;
    await pool.close();
    return res.json({
      success: true,
      id: insertedId,
      imagePath,
      allImages: uploadedPaths,
    });
  } catch (err) {
    console.error(
      "Error in /api/employees:",
      util.inspect(err, { depth: null })
    );
    if (req.files) {
      for (const f of req.files) {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {}
      }
    }
    return res
      .status(500)
      .json({ success: false, message: "Server error", detail: err.message });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {}
    }
    try {
      sql.close();
    } catch (e) {}
  }
});
app.get("/api/employees", async (req, res) => {
  let pool;
  try {
    pool = await sql.connect(serverConfig);
    const r = await pool.request()
      .query(`SELECT Id, Image, Name, Age, Designation, Details
        FROM EmployeeTable
       `);
    res.json({ success: true, data: r.recordset });
  } catch (err) {
    console.error(
      "Error in GET /api/employees:",
      util.inspect(err, { depth: null })
    );
    res
      .status(500)
      .json({ success: false, message: "Server error", detail: err.message });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {}
    }
    try {
      sql.close();
    } catch (e) {}
  }
});
app.delete("/api/employees/:id", async (req, res) => {
  let pool;
  try {
    const empId = parseInt(req.params.id, 10);
    if (isNaN(empId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    pool = await sql.connect(serverConfig);
    const imgRes = await pool
      .request()
      .input("Id", sql.Int, empId)
      .query("SELECT Image FROM EmployeeTable WHERE Id = @Id");
    if (!imgRes || !imgRes.recordset) {
      console.warn("DELETE: couldn't read image row result for Id", empId);
    }
    const imagePath = imgRes.recordset?.[0]?.Image || null;
    const delRes = await pool
      .request()
      .input("Id", sql.Int, empId)
      .query("DELETE FROM EmployeeTable WHERE Id = @Id");
    const rowsAffected = Array.isArray(delRes.rowsAffected)
      ? delRes.rowsAffected[0]
      : delRes.rowsAffected;
    if (!rowsAffected || rowsAffected === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    if (imagePath) {
      try {
        const abs = path.join(
          __dirname,
          imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
        );
        if (fs.existsSync(abs)) {
          fs.unlinkSync(abs);
        } else {
          console.warn("DELETE: image file not found for deletion:", abs);
        }
      } catch (fileErr) {
        console.error(
          "DELETE: failed to unlink image:",
          fileErr && fileErr.message ? fileErr.message : fileErr
        );
      }
    }
    res.json({
      success: true,
      message: "Employee deleted successfully",
      rowsAffected,
    });
  } catch (err) {
    console.error(
      "Error deleting employee:",
      util.inspect(err, { depth: null })
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Server error deleting employee",
        detail: err.message,
      });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {}
    }
    try {
      sql.close();
    } catch (e) {}
  }
});
app.put("/api/employees/:id", async (req, res) => {
  let pool;
  try {
    const empId = parseInt(req.params.id, 10);
    if (isNaN(empId))
      return res.status(400).json({ success: false, message: "Invalid ID" });
    const { name, age, details } = req.body || {};
    console.log(`PUT /api/employees/${empId} payload:`, { name, age, details });
    if (!name || name.toString().trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    if (age === undefined || age === null || isNaN(parseInt(age, 10))) {
      return res
        .status(400)
        .json({ success: false, message: "Valid age is required" });
    }
    pool = await sql.connect(serverConfig);
    const updateQuery = `
      SET NOCOUNT ON;
      UPDATE EmployeeTable
      SET Name = @Name,
          Age = @Age,
          Details = @Details
      OUTPUT inserted.Id, inserted.Image, inserted.Name, inserted.Age, inserted.Designation, inserted.Details
      WHERE Id = @Id;
    `;
    const request = pool
      .request()
      .input("Id", sql.Int, empId)
      .input("Name", sql.NVarChar(200), name.toString().trim())
      .input("Age", sql.Int, parseInt(age, 10))
      .input("Details", sql.NVarChar(sql.MAX), details || null);
    const result = await request.query(updateQuery);
    const updatedRow =
      result.recordset && result.recordset[0] ? result.recordset[0] : null;
    if (!updatedRow) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    await pool.close();
    return res.json({ success: true, data: updatedRow });
  } catch (err) {
    console.error(
      "PUT /api/employees/:id error:",
      util.inspect(err, { depth: null })
    );
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error updating employee",
        detail: err.message,
      });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (e) {}
    }
    try {
      sql.close();
    } catch (e) {}
  }
});
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
