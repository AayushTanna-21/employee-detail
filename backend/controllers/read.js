// backend/controllers/read.js
const util = require("util");
const { sql, getConnection } = require("../configuration/db");

/**
 * GET /api/employees
 * Query params:
 *  - page (1-based)
 *  - limit (rows per page) : use -1 to return all
 *  - sortBy (one of allowed columns)
 *  - order (asc|desc)
 *  - designation (exact match)
 *  - search (partial match across Name and Details)
 *
 * Response:
 *  { success: true, data: [...], total, page, limit, totalPages }
 */
async function getEmployees(req, res) {
  let pool;
  try {
    // Parse and normalize inputs
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    // allow 'all' or -1 -> return all rows
    const rawLimit = req.query.limit;
    const limit = rawLimit === undefined ? 10 : parseInt(rawLimit, 10);
    const sortByRaw = (req.query.sortBy || "Id").toString();
    const orderRaw = (req.query.order || "asc").toString();
    const designation = req.query.designation
      ? req.query.designation.toString()
      : null;
    const searchRaw = req.query.search
      ? req.query.search.toString().trim()
      : "";

    // SANITIZE: allowed columns for sorting (prevents SQL injection)
    const ALLOWED_SORT_COLUMNS = {
      Id: "Id",
      Image: "Image",
      Name: "Name",
      Age: "Age",
      Designation: "Designation",
      Details: "Details",
    };
    const sortBy = ALLOWED_SORT_COLUMNS[sortByRaw] || "Id";
    const order = orderRaw.toLowerCase() === "desc" ? "DESC" : "ASC";

    // calculate offset only when limit > 0
    const offset = limit > 0 ? (page - 1) * limit : 0;

    pool = await getConnection();

    // Build WHERE clause safely using parameterized inputs
    let whereClause = "WHERE 1=1";
    const countReq = pool.request();

    if (designation) {
      whereClause += " AND Designation = @Designation";
      countReq.input("Designation", sql.NVarChar(100), designation);
    }

    if (searchRaw) {
      whereClause += " AND (Name LIKE @Search OR Details LIKE @Search)";
      countReq.input("Search", sql.NVarChar(200), `%${searchRaw}%`);
    }

    // 1) total count
    const countQuery = `SELECT COUNT(*) AS total FROM EmployeeTable ${whereClause}`;
    const totalRes = await countReq.query(countQuery);
    const total = totalRes.recordset?.[0]?.total ?? 0;

    // 2) fetch page (or all)
    const dataReq = pool.request();
    if (designation)
      dataReq.input("Designation", sql.NVarChar(100), designation);
    if (searchRaw) dataReq.input("Search", sql.NVarChar(200), `%${searchRaw}%`);

    let rows;
    if (limit > 0) {
      // SQL Server OFFSET/FETCH paging
      const pagedQuery = `
        SELECT Id, Image, Name, Age, Designation, Details
        FROM EmployeeTable
        ${whereClause}
        ORDER BY ${sortBy} ${order}
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `;
      dataReq.input("Offset", sql.Int, offset);
      dataReq.input("Limit", sql.Int, limit);
      const result = await dataReq.query(pagedQuery);
      rows = result.recordset || [];
    } else {
      // limit <= 0 means "All"
      const allQuery = `
        SELECT Id, Image, Name, Age, Designation, Details
        FROM EmployeeTable
        ${whereClause}
        ORDER BY ${sortBy} ${order}
      `;
      const result = await dataReq.query(allQuery);
      rows = result.recordset || [];
    }

    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    // respond with data + meta
    return res.json({
      success: true,
      data: rows,
      total,
      page: limit > 0 ? page : 1,
      limit: limit > 0 ? limit : -1,
      totalPages,
    });
  } catch (err) {
    console.error("getEmployees error:", util.inspect(err, { depth: null }));
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

module.exports = getEmployees;
