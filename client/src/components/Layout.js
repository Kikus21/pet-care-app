import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const menuItems = [
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "animals",   label: "Animals",   path: "/animals" },
  { id: "procedures",label: "Procedures",path: "/procedures" },
  { id: "history",   label: "History",   path: "/history" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAnimals } = useAppContext();

  const activePage = location.pathname === "/" ? "dashboard"
    : location.pathname.replace("/", "");

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">Darling & Care</span>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const locked = !hasAnimals && item.id !== "dashboard";
            return (
              <button
                key={item.id}
                className={`nav-btn ${activePage === item.id ? "active" : ""} ${locked ? "nav-btn--locked" : ""}`}
                onClick={() => { if (!locked) navigate(item.path); }}
                disabled={locked}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="main">
        <div className="main-header">
          <div>
            <h1>Welcome to Darling & Care</h1>
            <p className="breadcrumb">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </p>
          </div>
          <p className="header-date">
            {new Date().toLocaleDateString("sk-SK", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}