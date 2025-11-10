// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";

const ROLES = ["Manager", "Assistant Manager", "Senior Developer", "Junior Developer"];

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
  const [rows, setRows] = useState([]); // data from backend
  const dtRef = useRef(null);

  // fetch data from backend on mount (and when needed)
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

  // initialize DataTable once rows are rendered
  useEffect(() => {
    if (!(window.$ && tableRef.current && window.$.fn.dataTable)) return;
    const $table = window.$(tableRef.current);

    // destroy previous instance (if any)
    if ($table.hasClass("dataTable")) {
      try { $table.DataTable().destroy(); } catch (e) {}
    }

    // initialize with page length dropdown, etc.
    const dt = $table.DataTable({
      pageLength: 5,
      lengthChange: true,
      lengthMenu: [
        [5, 10, 25, -1],
        [5, 10, 25, "All"]
      ],
    });

    dtRef.current = dt;
    window.employeeDT = dt; // optional debug

    // override global search to target Name column only (index 2 in new order)
    const $dtWrapper = $table.closest(".dataTables_wrapper");
    const $globalSearchInput = $dtWrapper.find("div.dataTables_filter input");
    if ($globalSearchInput && $globalSearchInput.length) {
      $globalSearchInput.off();
      const nameColIndex = 2; // columns: 0=Id,1=Image,2=Name,3=Age,4=Designation,5=Details
      const handleSearch = debounce(() => {
        const val = $globalSearchInput.val() || "";
        dt.column(nameColIndex).search(val, false, true).draw();
      }, 250);
      $globalSearchInput.on("keyup input", handleSearch);
    }

    // cleanup on unmount or re-init
    return () => {
      try { $globalSearchInput.off(); } catch (e) {}
      try { dt.destroy(); } catch (e) {}
      dtRef.current = null;
      window.employeeDT = null;
    };
  }, [rows]); // re-run when rows change (so table reflects new data)

  // toggle filter button
  const handleRoleClick = (role) => {
    const next = activeFilter === role ? null : role;
    setActiveFilter(next);
    const dt = dtRef.current;
    if (!dt) return;
    if (!next) dt.column(4).search("").draw(); // designation column index 4
    else dt.column(4).search("^" + next + "$", true, false, true).draw();
  };

  // helper: build image element or placeholder
  const renderImageCell = (imgPath) => {
    if (!imgPath) return <span style={{ color: "#777" }}>—</span>;
    // if backend serves /uploads, full URL: http://localhost:5000 + imgPath
    const src = imgPath.startsWith("http") ? imgPath : `http://localhost:5000${imgPath}`;
    return <img src={src} alt="emp" style={{ width: 50, height: 40, objectFit: "cover", borderRadius: 6 }} />;
  };

  return (
    <div>
      <h2>Employee List</h2>

      {/* Toggle buttons */}
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
                <button className="small-btn" onClick={() => alert("Edit not implemented")}>Edit</button>
              </td>
              <td>
                <button className="small-btn danger" onClick={() => alert("Remove not implemented")}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
