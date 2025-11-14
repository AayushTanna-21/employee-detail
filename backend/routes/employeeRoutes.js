const express = require("express");
const upload = require("../middleware/upload");
const {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers");

const router = express.Router();

router.post("/", upload.array("files", 10), createEmployee);
router.get("/", getEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
