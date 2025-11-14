export default function EditModal({
  target,
  onChange,
  onCancel,
  onSave,
  saving,
}) {
  if (!target) return null;
  return (
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
        style={{ width: 420, background: "#fff", padding: 20, borderRadius: 8 }}
      >
        <h3>Edit Employee</h3>
        <label>
          Name
          <input
            value={target.Name}
            onChange={(e) => onChange({ ...target, Name: e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label>
          Age
          <input
            type="number"
            value={target.Age}
            onChange={(e) => onChange({ ...target, Age: e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <label>
          Details
          <textarea
            rows={4}
            value={target.Details}
            onChange={(e) => onChange({ ...target, Details: e.target.value })}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
