export default function ConfirmModal({ title, onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          minWidth: 320,
        }}
      >
        <h3>{title}</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button onClick={onCancel} style={{ padding: "8px 12px" }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 12px",
              background: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: 6,
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}
