import { useState, useEffect } from "react";
import "./NotificationsPage.css";
import EditProcedureModal from "../components/EditProcedureModal";
import { TYPE_LABELS, TYPE_EMOJI } from "../utils/translations";

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / (1000 * 60 * 60 * 24));
}

function dueLabelFor(days) {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`;
  if (days === 0) return "Due today";
  return `In ${days} day${days !== 1 ? "s" : ""}`;
}

const URGENCY = { DUE_TODAY: 0, DUE_SOON: 1, UPCOMING: 2 };

function NotificationsPage({ notifEnabled, onToggleNotif }) {
  const [reminders, setReminders] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [editProcedure, setEditProcedure] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:3001/procedure/reminders").then((r) => r.json()),
      fetch("http://localhost:3001/animal/list").then((r) => r.json()),
    ])
      .then(([rem, anim]) => {
        const sorted = (rem.procedures || []).sort(
          (a, b) => (URGENCY[a.status] ?? 3) - (URGENCY[b.status] ?? 3)
        );
        setReminders(sorted);
        setAnimals(anim.itemList || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getAnimalName = (id) => animals.find((a) => a.animal_id === id)?.name || id;

  const handleComplete = async (procedure_id) => {
    setActionLoading(procedure_id);
    try {
      const res = await fetch(`http://localhost:3001/procedure/${procedure_id}/complete`, { method: "PATCH" });
      if (res.ok) {
        setExpanded(null);
        load();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdated = (updated) => {
    setReminders((prev) => prev.map((r) => r.procedure_id === updated.procedure_id ? { ...r, ...updated } : r));
  };

  const urgent = reminders.filter((r) => r.status === "DUE_TODAY");
  const soon = reminders.filter((r) => r.status === "DUE_SOON");
  const upcoming = reminders.filter((r) => r.status === "UPCOMING");

  const NotifCard = ({ r }) => {
    const days = daysUntil(r.scheduled_at);
    const isOpen = expanded === r.procedure_id;

    return (
      <div className={`notif-card notif-card--${r.status.toLowerCase().replace("_", "-")} ${isOpen ? "notif-card--open" : ""}`}>
        <button className="notif-card-header" onClick={() => setExpanded(isOpen ? null : r.procedure_id)}>
          <span className="notif-emoji">{TYPE_EMOJI[r.type] || "📋"}</span>
          <div className="notif-body">
            <span className="notif-title">{r.title}</span>
            <span className="notif-meta">{getAnimalName(r.animal_id)} · {TYPE_LABELS[r.type] || r.type}</span>
          </div>
          <div className="notif-right">
            <span className="notif-date">{r.scheduled_at?.split("T")[0]}</span>
            <span className={`notif-due notif-due--${r.status.toLowerCase().replace("_", "-")}`}>
              {dueLabelFor(days)}
            </span>
          </div>
          <span className="notif-chevron">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="notif-detail">
            <div className="notif-detail-grid">
              <div className="notif-detail-item">
                <span className="notif-detail-label">Animal</span>
                <span className="notif-detail-value">{getAnimalName(r.animal_id)}</span>
              </div>
              <div className="notif-detail-item">
                <span className="notif-detail-label">Type</span>
                <span className="notif-detail-value">{TYPE_LABELS[r.type] || r.type}</span>
              </div>
              <div className="notif-detail-item">
                <span className="notif-detail-label">Scheduled</span>
                <span className="notif-detail-value">{r.scheduled_at?.split("T")[0]}</span>
              </div>
              {r.notes && (
                <div className="notif-detail-item notif-detail-item--full">
                  <span className="notif-detail-label">Notes</span>
                  <span className="notif-detail-value">{r.notes}</span>
                </div>
              )}
            </div>
            <div className="notif-actions">
              <button
                className="btn-complete"
                onClick={() => handleComplete(r.procedure_id)}
                disabled={actionLoading === r.procedure_id}
              >
                {actionLoading === r.procedure_id ? "..." : "✓ Mark Complete"}
              </button>
              <button className="btn-edit" onClick={() => setEditProcedure(r)}>
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="notifications-page">
        <div className="notif-header">
          <h2>Notifications</h2>
          <div className="notif-header-actions">
            <label className="notif-toggle-label">
              <span className="notif-toggle-text">{notifEnabled ? "Notifikácie zapnuté" : "Notifikácie vypnuté"}</span>
              <button
                className={`notif-toggle ${notifEnabled ? "notif-toggle--on" : "notif-toggle--off"}`}
                onClick={() => onToggleNotif(!notifEnabled)}
              >
                <span className="notif-toggle-knob" />
              </button>
            </label>
            <button className="notif-refresh-btn" onClick={load}>↻ Refresh</button>
          </div>
        </div>

        {loading && <p className="notif-loading">Loading...</p>}

        {!loading && reminders.length === 0 && (
          <div className="notif-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h3>All clear!</h3>
            <p>No upcoming or overdue procedures right now.</p>
          </div>
        )}

        {urgent.length > 0 && (
          <section className="notif-section">
            <h3 className="notif-section-title notif-section-title--urgent">🔴 Overdue / Due Today ({urgent.length})</h3>
            {urgent.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
          </section>
        )}

        {soon.length > 0 && (
          <section className="notif-section">
            <h3 className="notif-section-title notif-section-title--soon">🟡 Due Soon ({soon.length})</h3>
            {soon.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="notif-section">
            <h3 className="notif-section-title notif-section-title--upcoming">🔵 Upcoming ({upcoming.length})</h3>
            {upcoming.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
          </section>
        )}
      </div>

      {editProcedure && (
        <EditProcedureModal
          procedure={editProcedure}
          animalName={getAnimalName(editProcedure.animal_id)}
          onClose={() => setEditProcedure(null)}
          onSave={(updated) => { handleUpdated(updated); setEditProcedure(null); }}
        />
      )}
    </>
  );
}

export default NotificationsPage;
