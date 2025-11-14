const util = require("util");
const { sql, getConnection } = require("../configuration/db");

async function updateEmployee(req, res) {
  let pool;
  try {
    const empId = parseInt(req.params.id, 10);
    if (isNaN(empId))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const { name, age, details } = req.body || {};
    if (!name || name.toString().trim() === "")
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    if (age === undefined || age === null || isNaN(parseInt(age, 10)))
      return res
        .status(400)
        .json({ success: false, message: "Valid age is required" });

    pool = await getConnection();
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
    const updatedRow = result.recordset?.[0] ?? null;
    if (!updatedRow)
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });

    return res.json({ success: true, data: updatedRow });
  } catch (err) {
    console.error("updateEmployee error:", util.inspect(err, { depth: null }));
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

module.exports = updateEmployee;
