import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ProceduresPage.css";
import AddProcedureModal from "../components/AddProcedureModal";
import EditProcedureModal from "../components/EditProcedureModal";
import { TYPE_LABELS, TYPE_EMOJI, STATUS_LABELS } from "../utils/translations";

function statusClass(status) {
  return { UPCOMING: "upcoming", DUE_SOON: "due-soon", DUE_TODAY: "due-today", COMPLETED: "completed", SNOOZED: "snoozed", CANCELLED: "cancelled" }[status] || "";
}

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function ProceduresPage() {
  const { state } = useLocation();
  const initialProcedureId = state?.procedureId;
  const [procedures, setProcedures] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editProcedure, setEditProcedure] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/procedure/list?pageSize=100").then((r) => r.json()),
      fetch("http://localhost:3001/animal/list").then((r) => r.json()),
    ])
      .then(([procs, anim]) => {
        const STATUS_ORDER = { DUE_TODAY: 0, DUE_SOON: 1, UPCOMING: 2, COMPLETED: 3 };
        const sorted = (procs.itemList || []).sort((a, b) => {
          const oa = STATUS_ORDER[a.status] ?? 99;
          const ob = STATUS_ORDER[b.status] ?? 99;
          if (oa !== ob) return oa - ob;
          return new Date(a.scheduled_at) - new Date(b.scheduled_at);
        });
        setProcedures(sorted);
        setAnimals(anim.itemList || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && initialProcedureId) {
      setExpanded(initialProcedureId);
      setTimeout(() => {
        document.getElementById(`proc-${initialProcedureId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [loading, initialProcedureId]);

  const getAnimalName = (animal_id) =>
    animals.find((a) => a.animal_id === animal_id)?.name || animal_id;

  const handleSaved = (newProc) => {
    fetch(`http://localhost:3001/procedure/${newProc.procedure_id}`)
      .then((r) => r.json())
      .then((full) => setProcedures((prev) => [full, ...prev]))
      .catch(() => setProcedures((prev) => [newProc, ...prev]));
  };

  const handleComplete = async (procedure_id) => {
    setActionLoading(procedure_id + "_complete");
    try {
      const res = await fetch(`http://localhost:3001/procedure/${procedure_id}/complete`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setProcedures((prev) => prev.map((p) => p.procedure_id === procedure_id ? data.procedure : p));
        setExpanded(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdated = (updated) => {
    setProcedures((prev) => prev.map((p) => p.procedure_id === updated.procedure_id ? updated : p));
  };

  const handleDelete = async (procedure_id) => {
    setConfirmDeleteId(null);
    setActionLoading(procedure_id + "_delete");
    try {
      const res = await fetch(`http://localhost:3001/procedure/${procedure_id}`, { method: "DELETE" });
      if (res.ok) {
        setProcedures((prev) => prev.filter((p) => p.procedure_id !== procedure_id));
        setExpanded(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const activeAnimalIds = new Set(animals.filter((a) => a.is_active).map((a) => a.animal_id));
  const active = procedures.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED" && activeAnimalIds.has(p.animal_id));
  const done = procedures.filter((p) => p.status === "COMPLETED" || p.status === "CANCELLED");

  const ProcedureCard = ({ p }) => {
    const isOpen = expanded === p.procedure_id;
    const canComplete = p.status !== "COMPLETED" && p.status !== "CANCELLED";

    return (
      <div id={`proc-${p.procedure_id}`} className={`proc-card ${isOpen ? "proc-card--open" : ""}`}>
        <button className="proc-card-header" onClick={() => setExpanded(isOpen ? null : p.procedure_id)}>
          <span className="proc-type-emoji">{TYPE_EMOJI[p.type] || "📋"}</span>
          <div className="proc-card-info">
            <span className="proc-title">{p.title}</span>
            <span className="proc-meta">{getAnimalName(p.animal_id)} · {TYPE_LABELS[p.type] || p.type}</span>
          </div>
          <div className="proc-card-right">
            <span className={`proc-status status-${statusClass(p.status)}`}>{statusLabel(p.status)}</span>
            <span className="proc-date">{p.scheduled_at?.split("T")[0]}</span>
          </div>
          <span className="proc-chevron">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="proc-detail">
            <div className="proc-detail-grid">
              <div className="proc-detail-item">
                <span className="proc-detail-label">Animal</span>
                <span className="proc-detail-value">{getAnimalName(p.animal_id)}</span>
              </div>
              <div className="proc-detail-item">
                <span className="proc-detail-label">Type</span>
                <span className="proc-detail-value">{TYPE_LABELS[p.type] || p.type}</span>
              </div>
              <div className="proc-detail-item">
                <span className="proc-detail-label">Scheduled</span>
                <span className="proc-detail-value">{p.scheduled_at?.split("T")[0]}</span>
              </div>
              <div className="proc-detail-item">
                <span className="proc-detail-label">Status</span>
                <span className={`proc-status status-${statusClass(p.status)}`}>{statusLabel(p.status)}</span>
              </div>
              {p.completed_at && (
                <div className="proc-detail-item">
                  <span className="proc-detail-label">Completed</span>
                  <span className="proc-detail-value">{p.completed_at?.split("T")[0]}</span>
                </div>
              )}
              {p.notes && (
                <div className="proc-detail-item proc-detail-item--full">
                  <span className="proc-detail-label">Notes</span>
                  <span className="proc-detail-value">{p.notes}</span>
                </div>
              )}
            </div>

            {canComplete && (
              <div className="proc-actions">
                <button
                  className="btn-complete"
                  onClick={() => handleComplete(p.procedure_id)}
                  disabled={actionLoading === p.procedure_id + "_complete"}
                >
                  {actionLoading === p.procedure_id + "_complete" ? "..." : "✓ Mark Complete"}
                </button>
                <button className="btn-edit" onClick={() => setEditProcedure(p)}>
                  Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => setConfirmDeleteId(p.procedure_id)}
                  disabled={actionLoading === p.procedure_id + "_delete"}
                >
                  {actionLoading === p.procedure_id + "_delete" ? "..." : "Delete"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="procedures-page">
        <div className="procedures-header">
          <h2>Procedures</h2>
          {!loading && procedures.length > 0 && (
            <button className="add-proc-btn" onClick={() => setShowModal(true)}>+ Add Procedure</button>
          )}
        </div>

        {loading && <p className="proc-loading">Loading...</p>}

        {!loading && procedures.length === 0 && (
          <div className="proc-empty">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3>No procedures yet</h3>
            <p>Add a procedure to start tracking your pet's health.</p>
            <button className="add-proc-btn" onClick={() => setShowModal(true)}>+ Add Procedure</button>
          </div>
        )}

        {active.length > 0 && (
          <section className="proc-section">
            <h3 className="proc-section-title">Active ({active.length})</h3>
            {active.map((p) => <ProcedureCard key={p.procedure_id} p={p} />)}
          </section>
        )}

        {done.length > 0 && (
          <section className="proc-section">
            <h3 className="proc-section-title">Completed / Cancelled ({done.length})</h3>
            {done.map((p) => <ProcedureCard key={p.procedure_id} p={p} />)}
          </section>
        )}
      </div>

      {showModal && (
        <AddProcedureModal
          onClose={() => setShowModal(false)}
          onSave={handleSaved}
        />
      )}

      {editProcedure && (
        <EditProcedureModal
          procedure={editProcedure}
          animalName={getAnimalName(editProcedure.animal_id)}
          onClose={() => setEditProcedure(null)}
          onSave={handleUpdated}
        />
      )}

      {confirmDeleteId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p className="confirm-text">Naozaj chceš odmazať túto procedúru?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmDeleteId(null)}>Zrušiť</button>
              <button className="btn-deactivate" onClick={() => handleDelete(confirmDeleteId)}>Odmazať</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProceduresPage;
