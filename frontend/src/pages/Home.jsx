import { useState, useEffect } from "react";
import useEmployees from "../hooks/useEmployees";
import ConfirmModal from "../components/confirmModel";
import EditModal from "../components/editModel";
import debounce from "../utils/debounce";

const ROLES = [
  "Manager",
  "Assistant Manager",
  "Senior Developer",
  "Junior Developer",
];

export default function Home() {
  const {
    rows,
    loading,
    page,
    limit,
    total,
    totalPages,
    sortBy,
    order,
    search,
    designation,
    changePage,
    changeLimit,
    changeSort,
    changeSearch,
    changeDesignation,
    remove,
    update,
  } = useEmployees({ page: 1, limit: 5, sortBy: "Id", order: "asc" });
  const [activeFilter, setActiveFilter] = useState(designation || null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState(search || "");
  const debouncedSearch = debounce((val) => {
    changeSearch(val);
  }, 300);

  useEffect(() => {
    setActiveFilter(designation || null);
  }, [designation]);

  const onHeaderClick = (colKey) => {
    changeSort(colKey);
  };

  const onEntriesChange = (e) => {
    const val = e.target.value;
    // value "-1" means all
    const parsed = parseInt(val, 10);
    changeLimit(isNaN(parsed) ? -1 : parsed);
  };

  const onRoleClick = (role) => {
    const next = activeFilter === role ? null : role;
    setActiveFilter(next);
    changeDesignation(next);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const r = await remove(deleteTarget);
    if (!r.ok) alert(r.error || "Failed to delete");
    setShowConfirm(false);
    setDeleteTarget(null);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setIsSavingEdit(true);
    const payload = {
      name: editTarget.Name.trim(),
      age: parseInt(editTarget.Age, 10),
      details: editTarget.Details,
    };
    const r = await update(editTarget.Id, payload);
    if (!r.ok) alert(r.error || "Failed to update employee");
    setIsSavingEdit(false);
    setEditTarget(null);
  };

  const renderImage = (img) => {
    if (!img) return <span style={{ color: "#777" }}>—</span>;
    const src = img.startsWith("http") ? img : `http://localhost:5000${img}`;
    return (
      <img
        src={src}
        alt="emp"
        style={{ width: 50, height: 40, objectFit: "cover", borderRadius: 6 }}
      />
    );
  };

  const pagesToShow = () => {
    const maxButtons = 7;
    const current = page;
    const totalP = totalPages;
    if (totalP <= maxButtons)
      return Array.from({ length: totalP }, (_, i) => i + 1);

    const arr = [];
    const left = Math.max(1, current - 2);
    const right = Math.min(totalP, current + 2);
    if (left > 1) arr.push(1);
    if (left > 2) arr.push("...");

    for (let i = left; i <= right; i++) arr.push(i);

    if (right < totalP - 1) arr.push("...");
    if (right < totalP) arr.push(totalP);
    return arr;
  };

  return (
    <div>
      <h2>Employee List</h2>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {ROLES.map((r) => {
            const active = activeFilter === r;
            return (
              <button
                key={r}
                onClick={() => onRoleClick(r)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: active ? "#007bff" : "#fff",
                  color: active ? "#fff" : "#007bff",
                  border: "1px solid #007bff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {r}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Show
            <select
              value={String(limit)}
              onChange={onEntriesChange}
              style={{ padding: 6 }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="-1">All</option>
            </select>
            entries
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Search:
            <input
              type="search"
              placeholder="Search name or details"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                debouncedSearch(e.target.value);
              }}
              style={{ padding: 6 }}
            />
          </label>
        </div>
      </div>
      <table
        className="display"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => onHeaderClick("Id")}
            >
              ID {sortBy === "Id" ? (order === "asc" ? "▲" : "▼") : ""}
            </th>
            <th>Image</th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => onHeaderClick("Name")}
            >
              Name {sortBy === "Name" ? (order === "asc" ? "▲" : "▼") : ""}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => onHeaderClick("Age")}
            >
              Age {sortBy === "Age" ? (order === "asc" ? "▲" : "▼") : ""}
            </th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => onHeaderClick("Designation")}
            >
              Designation{" "}
              {sortBy === "Designation" ? (order === "asc" ? "▲" : "▼") : ""}
            </th>
            <th>Details</th>
            <th>Edit</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 12 }}>
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: 12 }}>
                No records
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.Id}>
                <td>{r.Id}</td>
                <td>{renderImage(r.Image)}</td>
                <td>{r.Name}</td>
                <td>{r.Age}</td>
                <td>{r.Designation}</td>
                <td>{r.Details}</td>
                <td>
                  <button
                    className="small-btn"
                    onClick={() =>
                      setEditTarget({
                        Id: r.Id,
                        Name: r.Name,
                        Age: r.Age,
                        Details: r.Details || "",
                      })
                    }
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
            ))
          )}
        </tbody>
      </table>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <div>
          Showing{" "}
          {rows.length === 0 ? 0 : limit > 0 ? (page - 1) * limit + 1 : 1} to{" "}
          {limit > 0 ? Math.min(page * limit, total) : total} of {total} entries
        </div>

        <ul
          className="pagination"
          style={{
            display: "flex",
            gap: 6,
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          <li>
            <button
              disabled={page <= 1}
              onClick={() => changePage(Math.max(1, page - 1))}
              style={{ padding: "6px 10px" }}
            >
              &laquo;
            </button>
          </li>

          {pagesToShow().map((p, idx) => (
            <li key={idx}>
              {p === "..." ? (
                <span style={{ padding: "6px 10px" }}>...</span>
              ) : (
                <button
                  onClick={() => changePage(p)}
                  className={p === page ? "active" : ""}
                  style={{
                    padding: "6px 10px",
                    background: p === page ? "#4CAF50" : undefined,
                    color: p === page ? "#fff" : undefined,
                  }}
                >
                  {p}
                </button>
              )}
            </li>
          ))}

          <li>
            <button
              disabled={page >= totalPages}
              onClick={() => changePage(Math.min(totalPages, page + 1))}
              style={{ padding: "6px 10px" }}
            >
              &raquo;
            </button>
          </li>
        </ul>
      </div>
      {showConfirm && (
        <ConfirmModal
          title="Are you sure you want to delete this employee?"
          onCancel={() => {
            setShowConfirm(false);
            setDeleteTarget(null);
          }}
          onConfirm={handleDeleteConfirmed}
        />
      )}
      <EditModal
        target={editTarget}
        onChange={setEditTarget}
        onCancel={() => setEditTarget(null)}
        onSave={handleEditSave}
        saving={isSavingEdit}
      />
    </div>
  );
}
