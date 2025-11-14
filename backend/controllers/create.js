const fs = require("fs");
const util = require("util");
const { sql, getConnection } = require("../configuration/db");

async function createEmployee(req, res) {
  let pool;
  try {
    const { name, age, designation, details } = req.body;

    if (!name || !age || !designation) {
      (req.files || []).forEach((f) => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {}
      });
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const uploadedPaths = (req.files || []).map(
      (f) => `/uploads/${f.filename}`
    );
    const imagePath = uploadedPaths.length > 0 ? uploadedPaths[0] : null;

    pool = await getConnection();
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
    return res.json({
      success: true,
      id: insertedId,
      imagePath,
      allImages: uploadedPaths,
    });
  } catch (err) {
    console.error("createEmployee error:", util.inspect(err, { depth: null }));
    (req.files || []).forEach((f) => {
      try {
        fs.unlinkSync(f.path);
      } catch (e) {}
    });
    return res
      .status(500)
      .json({ success: false, message: "Server error", detail: err.message });
  } finally {
    if (pool)
      try {
        await pool.close();
      } catch (e) {}
  }
}

module.exports = createEmployee;
