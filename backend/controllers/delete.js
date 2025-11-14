const fs = require("fs");
const path = require("path");
const util = require("util");
const { sql, getConnection } = require("../configuration/db");
async function deleteEmployee(req, res) {
  let pool;
  try {
    const empId = parseInt(req.params.id, 10);
    if (isNaN(empId))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    pool = await getConnection();
    const imgRes = await pool
      .request()
      .input("Id", sql.Int, empId)
      .query("SELECT Image FROM EmployeeTable WHERE Id = @Id");
    const imagePath = imgRes.recordset?.[0]?.Image || null;

    const delRes = await pool
      .request()
      .input("Id", sql.Int, empId)
      .query("DELETE FROM EmployeeTable WHERE Id = @Id");
    const rowsAffected = Array.isArray(delRes.rowsAffected)
      ? delRes.rowsAffected[0]
      : delRes.rowsAffected;

    if (!rowsAffected || rowsAffected === 0)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });

    if (imagePath) {
      const abs = path.join(
        __dirname,
        "..",
        imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
      );
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }
    return res.json({
      success: true,
      message: "Employee deleted successfully",
      rowsAffected,
    });
  } catch (err) {
    console.error("deleteEmployee error:", util.inspect(err, { depth: null }));
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error deleting employee",
        detail: err.message,
      });
  } finally {
    if (pool)
      try {
        await pool.close();
      } catch (e) {}
  }
}
module.exports = deleteEmployee;
