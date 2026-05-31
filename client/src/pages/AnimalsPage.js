import { useState, useEffect } from "react";
import "./AnimalsPage.css";
import AddAnimalModal from "../components/AddAnimalModal";
import EditAnimalModal from "../components/EditAnimalModal";
import { SPECIES_LABELS, BREED_LABELS, GENDER_LABELS, TYPE_LABELS, TYPE_EMOJI, STATUS_LABELS } from "../utils/translations";
import { useAppContext } from "../context/AppContext";

const SPECIES_EMOJI = {
  dog: "🐕", cat: "🐈", rabbit: "🐇", bird: "🐦", other: "🐾",
};

function statusLabel(s) {
  return STATUS_LABELS[s] || s;
}

function statusCls(s) {
  return { UPCOMING: "upcoming", DUE_SOON: "due-soon", DUE_TODAY: "due-today", COMPLETED: "completed", SNOOZED: "snoozed", CANCELLED: "cancelled" }[s] || "";
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} mes.`;
  return `${Math.floor(months / 12)} r.`;
}

function AnimalsPage() {
  const { handleAnimalRegistered: onAnimalRegistered, refreshGlobalState } = useAppContext();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [animalProcedures, setAnimalProcedures] = useState([]);
  const [procsLoading, setProcsLoading] = useState(false);
  const [confirmReactivate, setConfirmReactivate] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/animal/list")
      .then((res) => res.json())
      .then((data) => setAnimals(data.itemList || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectAnimal = (a) => {
    if (selectedAnimal?.animal_id === a.animal_id) {
      setSelectedAnimal(null);
      setAnimalProcedures([]);
      return;
    }
    setSelectedAnimal(a);
    setProcsLoading(true);
    fetch(`http://localhost:3001/procedure/animal/${a.animal_id}`)
      .then((res) => res.json())
      .then((data) => {
        const procs = Array.isArray(data) ? data : (data.itemList || []);
        procs.sort((x, y) => new Date(y.scheduled_at) - new Date(x.scheduled_at));
        setAnimalProcedures(procs);
      })
      .catch(() => setAnimalProcedures([]))
      .finally(() => setProcsLoading(false));
  };

  const handleAnimalSaved = (animal) => { setAnimals((prev) => [...prev, animal]); onAnimalRegistered?.(); };

  const handleAnimalUpdated = (updated) => {
    setAnimals((prev) => prev.map((a) => a.animal_id === updated.animal_id ? { ...a, ...updated } : a));
    if (selectedAnimal?.animal_id === updated.animal_id) setSelectedAnimal((prev) => ({ ...prev, ...updated }));
  };

  const handleAnimalDeactivated = (updated) => {
    setAnimals((prev) => prev.map((a) => a.animal_id === updated.animal_id ? { ...a, ...updated } : a));
    refreshGlobalState();
    if (selectedAnimal?.animal_id === updated.animal_id) {
      setSelectedAnimal((prev) => ({ ...prev, ...updated }));
      setProcsLoading(true);
      fetch(`http://localhost:3001/procedure/animal/${updated.animal_id}`)
        .then((res) => res.json())
        .then((data) => {
          const procs = Array.isArray(data) ? data : (data.itemList || []);
          procs.sort((x, y) => new Date(y.scheduled_at) - new Date(x.scheduled_at));
          setAnimalProcedures(procs);
        })
        .catch(() => setAnimalProcedures([]))
        .finally(() => setProcsLoading(false));
    }
  };

  const handleReactivate = async (an) => {
    setConfirmReactivate(null);
    try {
      const res = await fetch(`http://localhost:3001/animal/${an.animal_id}/reactivate`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) {
        setAnimals((prev) => prev.map((a) => a.animal_id === data.animal.animal_id ? { ...a, ...data.animal } : a));
        if (selectedAnimal?.animal_id === data.animal.animal_id) setSelectedAnimal((prev) => ({ ...prev, ...data.animal }));
      }
    } catch {}
  };

  const a = selectedAnimal;

  return (
    <>
      <div className={`animals-page ${selectedAnimal ? "animals-page--split" : ""}`}>

        {/* ── LEFT: zoznam zvierat ── */}
        <div className="animals-main">
          <div className="animals-header">
            <h2>Animals</h2>
            <button className="add-animal-btn" onClick={() => setShowAddAnimal(true)}>+ Add Animal</button>
          </div>

          {loading && <p className="animals-loading">Loading...</p>}

          {!loading && animals.length === 0 && (
            <div className="animals-empty">
              <div className="empty-icon">🐾</div>
              <h3>No animals yet</h3>
              <p>Register your first pet to get started.</p>
              <button className="add-animal-btn" onClick={() => setShowAddAnimal(true)}>+ Register first animal</button>
            </div>
          )}

          <div className="animal-cards">
            {[...animals].sort((a, b) => b.is_active - a.is_active).map((an) => (
              <div
                key={an.animal_id}
                className={`animal-detail-card ${selectedAnimal?.animal_id === an.animal_id ? "animal-detail-card--active" : ""}`}
                onClick={() => handleSelectAnimal(an)}
              >
                <div className="adc-avatar">
                  <span className="adc-emoji">{SPECIES_EMOJI[an.species?.toLowerCase()] || "🐾"}</span>
                </div>
                <div className="adc-body">
                  <div className="adc-name-row">
                    <span className="adc-name">{an.name}</span>
                    <span className={`adc-status ${an.is_active ? "active" : "inactive"}`}>
                      {an.is_active ? "Active" : "Inactive"}
                    </span>
                    {an.is_active && (
                      <button className="adc-edit-btn" onClick={(e) => { e.stopPropagation(); setEditAnimal(an); }}>
                        Edit
                      </button>
                    )}
                    {!an.is_active && (
                      <button className="adc-reactivate-btn" onClick={(e) => { e.stopPropagation(); setConfirmReactivate(an); }}>
                        Reactivate
                      </button>
                    )}
                  </div>
                  <div className="adc-meta">
                    <span>{SPECIES_LABELS[an.species?.toUpperCase()] || an.species}</span>
                    {an.breed && <><span className="adc-sep">·</span><span>{BREED_LABELS[an.breed?.toUpperCase()] || an.breed}</span></>}
                    <span className="adc-sep">·</span>
                    <span>{GENDER_LABELS[an.gender?.toUpperCase()] || an.gender}</span>
                    {an.date_of_birth && <><span className="adc-sep">·</span><span>{calcAge(an.date_of_birth)}</span></>}
                  </div>
                  <div className="adc-details">
                    {an.weight && <div className="adc-detail-item"><span className="adc-detail-label">Weight</span><span className="adc-detail-value">{an.weight} kg</span></div>}
                    {an.microchip_number && <div className="adc-detail-item"><span className="adc-detail-label">Chip</span><span className="adc-detail-value">{an.microchip_number}</span></div>}
                    {an.owner && <div className="adc-detail-item"><span className="adc-detail-label">Owner</span><span className="adc-detail-value">{an.owner}</span></div>}
                    {an.date_of_birth && <div className="adc-detail-item"><span className="adc-detail-label">Born</span><span className="adc-detail-value">{an.date_of_birth}</span></div>}
                  </div>
                  {an.notes && <p className="adc-notes">{an.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: detail panel ── */}
        {selectedAnimal && (
          <div className="animal-side-panel">
            <div className="asp-close-row">
              <button className="asp-close" onClick={() => { setSelectedAnimal(null); setAnimalProcedures([]); }}>×</button>
            </div>

            {/* Animal info */}
            <div className="asp-animal-info">
              <div className="asp-avatar">
                <span>{SPECIES_EMOJI[a.species?.toLowerCase()] || "🐾"}</span>
              </div>
              <div className="asp-name-block">
                <span className="asp-name">{a.name}</span>
                <span className={`adc-status ${a.is_active ? "active" : "inactive"}`}>{a.is_active ? "Active" : "Inactive"}</span>
              </div>
            </div>

            <div className="asp-info-grid">
              {a.species && <div className="asp-info-item"><span className="asp-info-label">Druh</span><span className="asp-info-value">{SPECIES_LABELS[a.species?.toUpperCase()] || a.species}</span></div>}
              {a.breed && <div className="asp-info-item"><span className="asp-info-label">Plemeno</span><span className="asp-info-value">{BREED_LABELS[a.breed?.toUpperCase()] || a.breed}</span></div>}
              {a.gender && <div className="asp-info-item"><span className="asp-info-label">Pohlavie</span><span className="asp-info-value">{GENDER_LABELS[a.gender?.toUpperCase()] || a.gender}</span></div>}
              {a.date_of_birth && <div className="asp-info-item"><span className="asp-info-label">Age</span><span className="asp-info-value">{calcAge(a.date_of_birth)} ({a.date_of_birth})</span></div>}
              {a.weight && <div className="asp-info-item"><span className="asp-info-label">Weight</span><span className="asp-info-value">{a.weight} kg</span></div>}
              {a.microchip_number && <div className="asp-info-item"><span className="asp-info-label">Chip</span><span className="asp-info-value">{a.microchip_number}</span></div>}
              {a.owner && <div className="asp-info-item asp-info-item--full"><span className="asp-info-label">Owner</span><span className="asp-info-value">{a.owner}</span></div>}
              {a.notes && <div className="asp-info-item asp-info-item--full"><span className="asp-info-label">Notes</span><span className="asp-info-value asp-notes">{a.notes}</span></div>}
            </div>

            {/* Divider */}
            <div className="asp-divider">
              <span>Procedures</span>
            </div>

            {/* Procedures list */}
            <div className="asp-procedures">
              {procsLoading && <p className="asp-loading">Loading...</p>}

              {!procsLoading && animalProcedures.length === 0 && (
                <p className="asp-no-procs">No procedures yet.</p>
              )}

              {animalProcedures.map((p) => (
                <div key={p.procedure_id} className="asp-proc-row">
                  <span className="asp-proc-emoji">{TYPE_EMOJI[p.type] || "📋"}</span>
                  <div className="asp-proc-info">
                    <span className="asp-proc-title">{p.title}</span>
                    <span className="asp-proc-meta">{TYPE_LABELS[p.type] || p.type} · {p.scheduled_at?.split("T")[0]}</span>
                  </div>
                  <span className={`asp-proc-status status-${statusCls(p.status)}`}>{statusLabel(p.status)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddAnimal && (
        <AddAnimalModal onClose={() => setShowAddAnimal(false)} onSave={handleAnimalSaved} />
      )}
      {editAnimal && (
        <EditAnimalModal
          animal={editAnimal}
          onClose={() => setEditAnimal(null)}
          onSave={handleAnimalUpdated}
          onDeactivate={handleAnimalDeactivated}
        />
      )}

      {confirmReactivate && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p className="confirm-text">Naozaj chceš reaktivovať zviera <strong>{confirmReactivate.name}</strong>?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmReactivate(null)}>Zrušiť</button>
              <button className="btn-save" onClick={() => handleReactivate(confirmReactivate)}>Reaktivovať</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnimalsPage;
