import { useEffect, useRef, useState } from "react";
const ROLES = [
  "Manager",
  "Assistant Manager",
  "Senior Developer",
  "Junior Developer",
];
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
export default function Home() {
  const tableRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [rows, setRows] = useState([]);
  const dtRef = useRef(null);
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/employees");
        const json = await res.json();
        if (res.ok && json.success) {
          setRows(json.data || []);
        } else {
          console.error("Failed to fetch employees", json);
        }
      } catch (err) {
        console.error("Network error fetching employees", err);
      }
    }
    load();
  }, []);
  useEffect(() => {
    if (!window.$ || !tableRef.current || !window.$.fn.dataTable) return;
    if (rows.length === 0) return;

    const $table = window.$(tableRef.current);
    if ($table.hasClass("dataTable")) {
      try {
        $table.DataTable().clear().destroy();
      } catch (e) {}
    }
    const dt = $table.DataTable({
      pageLength: 5,
      lengthChange: true,
      info: false,
      lengthMenu: [
        [5, 10, 25, -1],
        [5, 10, 25, "All"],
      ],
    });
    dtRef.current = dt;
    window.employeeDT = dt;
    const $dtWrapper = $table.closest(".dataTables_wrapper");
    const $globalSearchInput = $dtWrapper.find("div.dataTables_filter input");
    if ($globalSearchInput && $globalSearchInput.length) {
      $globalSearchInput.off();
      const nameColIndex = 2;
      const handleSearch = debounce(() => {
        const val = $globalSearchInput.val() || "";
        dt.column(nameColIndex).search(val, false, true).draw();
      }, 250);
      $globalSearchInput.on("keyup input", handleSearch);
    }
    return () => {
      try {
        $globalSearchInput.off();
      } catch (e) {}
      try {
        dt.destroy();
      } catch (e) {}
      dtRef.current = null;
      window.employeeDT = null;
    };
  }, [rows]);
  const handleRoleClick = (role) => {
    const next = activeFilter === role ? null : role;
    setActiveFilter(next);
    const dt = dtRef.current;
    if (!dt) return;
    if (!next) dt.column(4).search("").draw();
    else
      dt.column(4)
        .search("^" + next + "$", true, false, true)
        .draw();
  };
  const renderImageCell = (imgPath) => {
    if (!imgPath) return <span style={{ color: "#777" }}>—</span>;
    const src = imgPath.startsWith("http")
      ? imgPath
      : `http://localhost:5000${imgPath}`;
    return (
      <img
        src={src}
        alt="emp"
        style={{ width: 50, height: 40, objectFit: "cover", borderRadius: 6 }}
      />
    );
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/employees/${deleteTarget}`,
        {
          method: "DELETE",
        }
      );
      const json = await res.json();

      if (res.ok && json.success) {
        setRows((prev) => prev.filter((r) => r.Id !== deleteTarget));
      } else {
        alert(json.message || "Failed to delete employee");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Server error while deleting");
    } finally {
      setShowConfirm(false);
      setDeleteTarget(null);
    }
  };
  const handleEditSave = async () => {
    if (!editTarget) return;
    const { Id, Name, Age, Details } = editTarget;
    if (!Name || Name.trim() === "") {
      alert("Name is required");
      return;
    }
    if (!Age || isNaN(parseInt(Age, 10))) {
      alert("Valid age is required");
      return;
    }
    setIsSavingEdit(true);
    try {
      const res = await fetch(`http://localhost:5000/api/employees/${Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: Name.trim(),
          age: parseInt(Age, 10),
          details: Details,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error("Edit failed response:", json);
        alert(json.message || "Failed to update employee");
        return;
      }
      const updated = json.data || { Id, Name, Age, Details };
      setRows((prev) =>
        prev.map((r) =>
          r.Id === updated.Id
            ? {
                Id: updated.Id,
                Image: updated.Image,
                Name: updated.Name,
                Age: updated.Age,
                Designation: updated.Designation,
                Details: updated.Details,
              }
            : r
        )
      );
      setEditTarget(null);
    } catch (err) {
      console.error("Edit error:", err);
      alert("Network or server error while updating");
    } finally {
      setIsSavingEdit(false);
    }
  };
  return (
    <div>
      <h2>Employee List</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
        {ROLES.map((role) => {
          const active = activeFilter === role;
          return (
            <button
              key={role}
              onClick={() => handleRoleClick(role)}
              style={{
                padding: "8px 14px",
                border: "1px solid #007bff",
                backgroundColor: active ? "#007bff" : "white",
                color: active ? "white" : "#007bff",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {role}
            </button>
          );
        })}
      </div>
      <table ref={tableRef} className="display" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Id</th>
            <th>Image</th>
            <th>Name</th>
            <th>Age</th>
            <th>Designation</th>
            <th>Details</th>
            <th>Edit</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.Id}-${idx}`}>
              <td>{r.Id}</td>
              <td>{renderImageCell(r.Image)}</td>
              <td>{r.Name}</td>
              <td>{r.Age}</td>
              <td>{r.Designation}</td>
              <td>{r.Details}</td>
              <td>
                <button
                  className="small-btn"
                  onClick={() => {
                    setEditTarget({
                      Id: r.Id,
                      Name: r.Name,
                      Age: r.Age,
                      Details: r.Details || "",
                    });
                  }}
                >
                  Edit
                </button>
              </td>
              <td>
                <button
                  className="small-btn danger"
                  onClick={() => {
                    setDeleteTarget(r.Id);
                    setShowConfirm(true);
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px 30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ marginBottom: "10px" }}>
              Are you sure you want to delete this employee?
            </h3>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "12px" }}
            >
              <button
                onClick={handleDelete}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setDeleteTarget(null);
                }}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "8px 14px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {editTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              width: 420,
              maxWidth: "94%",
              background: "white",
              padding: 20,
              borderRadius: 8,
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Employee</h3>

            <label style={{ display: "block", marginBottom: 8 }}>
              Name
              <input
                value={editTarget.Name}
                onChange={(e) =>
                  setEditTarget((prev) => ({ ...prev, Name: e.target.value }))
                }
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 8 }}>
              Age
              <input
                type="number"
                value={editTarget.Age}
                onChange={(e) =>
                  setEditTarget((prev) => ({ ...prev, Age: e.target.value }))
                }
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Details
              <textarea
                rows={4}
                value={editTarget.Details}
                onChange={(e) =>
                  setEditTarget((prev) => ({
                    ...prev,
                    Details: e.target.value,
                  }))
                }
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <button
                onClick={() => setEditTarget(null)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                }}
                disabled={isSavingEdit}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleEditSave();
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#007bff",
                  color: "white",
                  cursor: "pointer",
                }}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
