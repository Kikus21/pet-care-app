import { useState, useEffect } from "react";
import "./HistoryPage.css";
import { TYPE_LABELS, TYPE_EMOJI, STATUS_LABELS } from "../utils/translations";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });
}

function groupByMonth(items) {
  const groups = {};
  items.forEach((item) => {
    const date = new Date(item.deleted_at || item.completed_at || item.updated_at || item.created_at);
    const key = date.toLocaleDateString("sk-SK", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAnimal, setFilterAnimal] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteOne, setConfirmDeleteOne] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:3001/procedure/list?pageSize=200&includeDeleted=true").then((r) => r.json()),
      fetch("http://localhost:3001/animal/list").then((r) => r.json()),
    ])
      .then(([procs, anim]) => {
        const done = (procs.itemList || [])
          .filter((p) => p.status === "COMPLETED" || p.status === "CANCELLED" || p.is_deleted)
          .sort((a, b) => new Date(b.deleted_at || b.completed_at || b.updated_at) - new Date(a.deleted_at || a.completed_at || a.updated_at));
        setHistory(done);
        setAnimals(anim.itemList || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleDeleteOne = async () => {
    const id = confirmDeleteOne.procedure_id;
    setDeletingId(id);
    setConfirmDeleteOne(null);
    try {
      await fetch(`http://localhost:3001/procedure/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((p) => p.procedure_id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await fetch("http://localhost:3001/procedure/history", { method: "DELETE" });
      setShowConfirm(false);
      loadData();
    } finally {
      setClearing(false);
    }
  };

  const getAnimalName = (id) => animals.find((a) => a.animal_id === id)?.name || id;

  const effectiveStatus = (p) => p.is_deleted ? "DELETED" : p.status;

  const filtered = history.filter((p) => {
    if (filterAnimal && p.animal_id !== filterAnimal) return false;
    const date = (p.deleted_at || p.completed_at || p.scheduled_at)?.split("T")[0];
    if (filterFrom && date < filterFrom) return false;
    if (filterTo && date > filterTo) return false;
    if (filterStatus && effectiveStatus(p) !== filterStatus) return false;
    return true;
  });

  const hasFilter = filterAnimal || filterFrom || filterTo || filterStatus;
  const groups = groupByMonth(filtered);

  return (
    <div className="history-page">
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p className="confirm-text">Naozaj chceš vymazať celú históriu procedúr? Táto akcia je nevratná.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Zrušiť</button>
              <button className="btn-delete" onClick={handleClearHistory} disabled={clearing}>
                {clearing ? "Mažem..." : "Vymazať všetko"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteOne && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p className="confirm-text">
              Naozaj chceš trvalo vymazať záznam <strong>„{confirmDeleteOne.title}"</strong>?<br />Táto akcia je nevratná.
            </p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmDeleteOne(null)}>Zrušiť</button>
              <button className="btn-delete" onClick={handleDeleteOne}>Vymazať</button>
            </div>
          </div>
        </div>
      )}

      <div className="history-header">
        <h2>History</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="history-count">{filtered.length} records</span>
          {history.length > 0 && (
            <button className="btn-delete" onClick={() => setShowConfirm(true)}>
              🗑 Vymazať históriu
            </button>
          )}
        </div>
      </div>

      <div className="history-filters">
        <select className="filter-select" value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)}>
          <option value="">All animals</option>
          {animals.map((a) => <option key={a.animal_id} value={a.animal_id}>{a.name}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[...new Set(history.map(effectiveStatus))].map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
          ))}
        </select>
        <input type="date" className="filter-date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="From date" />
        <span className="filter-sep">–</span>
        <input type="date" className="filter-date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="To date" />
        {hasFilter && (
          <button className="filter-clear" onClick={() => { setFilterAnimal(""); setFilterFrom(""); setFilterTo(""); setFilterStatus(""); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {loading && <p className="history-loading">Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="history-empty">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
          <h3>{hasFilter ? "No matching records" : "No history yet"}</h3>
          <p>{hasFilter ? "Try adjusting the filters." : "Completed and cancelled procedures will appear here."}</p>
        </div>
      )}

      {Object.entries(groups).map(([month, items]) => (
        <section key={month} className="history-group">
          <h3 className="history-month">{month}</h3>
          <div className="timeline">
            {items.map((p) => (
              <div key={p.procedure_id} className={`timeline-item ${p.is_deleted ? "timeline-item--deleted" : p.status === "CANCELLED" ? "timeline-item--cancelled" : ""}`}>
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="tlc-top">
                    <span className="tlc-emoji">{TYPE_EMOJI[p.type] || "📋"}</span>
                    <div className="tlc-info">
                      <span className="tlc-title">{p.title}</span>
                      <span className="tlc-meta">{getAnimalName(p.animal_id)} · {TYPE_LABELS[p.type] || p.type}</span>
                    </div>
                    {p.is_deleted ? (
                      <span className="tlc-badge tlc-badge--deleted">Deleted</span>
                    ) : (
                      <span className={`tlc-badge ${p.status === "CANCELLED" ? "tlc-badge--cancelled" : "tlc-badge--completed"}`}>
                        {p.status === "CANCELLED" ? "Cancelled" : "Completed"}
                      </span>
                    )}
                    <button
                      className="tlc-delete-btn"
                      onClick={() => setConfirmDeleteOne(p)}
                      disabled={deletingId === p.procedure_id}
                      title="Vymazať záznam"
                    >
                      {deletingId === p.procedure_id ? "..." : "🗑"}
                    </button>
                  </div>
                  <div className="tlc-dates">
                    <span>Scheduled: {formatDate(p.scheduled_at)}</span>
                    {p.completed_at && <span>Done: {formatDate(p.completed_at)}</span>}
                    {p.deleted_at && <span>Deleted: {formatDate(p.deleted_at)}</span>}
                  </div>
                  {p.notes && <p className="tlc-notes">{p.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default HistoryPage;
