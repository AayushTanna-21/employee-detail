export default function NavBar({ route, onNavigate }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-brand">Employee App</div>
        <div className="nav-links">
          <button
            className={`nav-btn ${route === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            Home
          </button>
          <button
            className={`nav-btn ${route === "form" ? "active" : ""}`}
            onClick={() => onNavigate("form")}
          >
            Form
          </button>
        </div>
      </div>
    </nav>
  );
}
