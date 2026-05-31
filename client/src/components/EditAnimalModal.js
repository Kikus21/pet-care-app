import { useState } from "react";
import { SPECIES_LABELS, BREED_LABELS, GENDER_LABELS } from "../utils/translations";

const SPECIES_OPTIONS = ["DOG", "CAT", "RABBIT", "BIRD", "OTHER"];
const BREEDS = {
  DOG: ["LABRADOR", "GOLDEN_RETRIEVER", "GERMAN_SHEPHERD", "AUSTRALIAN_SHEPHERD", "BULLDOG", "POODLE", "BEAGLE", "OTHER"],
  CAT: ["PERSIAN", "SIAMESE", "MAINE_COON", "BENGAL", "BRITISH_SHORTHAIR", "OTHER"],
  RABBIT: ["HOLLAND_LOP", "MINI_REX", "LIONHEAD", "DUTCH", "OTHER"],
  BIRD: ["PARROT", "CANARY", "COCKATIEL", "BUDGERIGAR", "OTHER"],
  OTHER: ["OTHER"],
};

function EditAnimalModal({ animal, onClose, onSave, onDeactivate }) {
  const [form, setForm] = useState({
    name: animal.name || "",
    owner: animal.owner || "",
    species: animal.species?.toUpperCase() || "",
    breed: animal.breed?.toUpperCase().replace(/ /g, "_") || "",
    gender: animal.gender?.toUpperCase() || "",
    date_of_birth: animal.date_of_birth || "",
    weight: animal.weight?.toString() || "",
    microchip_number: animal.microchip_number || "",
    notes: animal.notes || "",
    photo_url: "",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeactivate = async () => {
    setShowConfirm(false);
    setDeactivating(true);
    try {
      const res = await fetch(`http://localhost:3001/animal/${animal.animal_id}/deactivate`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Nastala chyba"]);
      } else {
        onDeactivate?.(data.animal);
        onClose();
      }
    } catch {
      setErrors(["Nepodarilo sa pripojiť k serveru"]);
    } finally {
      setDeactivating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "species" ? { breed: "" } : {}),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);

    const body = {
      name: form.name,
      owner: form.owner,
      species: form.species,
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      weight: parseFloat(form.weight),
    };

    if (form.breed) body.breed = form.breed;
    if (form.microchip_number) body.microchip_number = form.microchip_number;
    if (form.notes) body.notes = form.notes;
    if (form.photo_url) body.photo_url = form.photo_url;

    try {
      const res = await fetch(`http://localhost:3001/animal/${animal.animal_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Nastala chyba"]);
      } else {
        onSave(data);
        onClose();
      }
    } catch {
      setErrors(["Nepodarilo sa pripojiť k serveru"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p className="confirm-text">Naozaj chceš deaktivovať zviera <strong>{animal.name}</strong>?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Zrušiť</button>
              <button className="btn-deactivate" onClick={handleDeactivate}>Deaktivovať</button>
            </div>
          </div>
        </div>
      )}
      <div className="modal">
        <div className="modal-header">
          <h2>Edit animal – {animal.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <div className="animal-photo-placeholder">🐕</div>
            <label className="file-btn">
              Choose File
              <input type="file" accept=".jpg" hidden onChange={(e) => {
                if (e.target.files[0]) setForm((p) => ({ ...p, photo_url: e.target.files[0].name }));
              }} />
            </label>
            <span className="file-name">{form.photo_url || "No file chosen"}</span>
          </div>

          <div className="modal-right">
            {errors.length > 0 && (
              <div className="error-box">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
            )}

            <div className="form-row">
              <div className="form-group full">
                <label>Owner</label>
                <input name="owner" value={form.owner} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Species</label>
                <select name="species" value={form.species} onChange={handleChange}>
                  <option value="">Select...</option>
                  {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{SPECIES_LABELS[s]}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Breed</label>
                <select name="breed" value={form.breed} onChange={handleChange} disabled={!form.species}>
                  <option value="">Select...</option>
                  {form.species && BREEDS[form.species]?.map((b) => <option key={b} value={b}>{BREED_LABELS[b] || b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="radio-group">
                  {["MALE", "FEMALE", "UNKNOWN"].map((g) => (
                    <label key={g} className="radio-label">
                      <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={handleChange} />
                      {GENDER_LABELS[g]}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of birth</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input name="weight" value={form.weight} onChange={handleChange} type="number" step="0.01" />
              </div>
              <div className="form-group">
                <label>Chip</label>
                <input name="microchip_number" value={form.microchip_number} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-deactivate" onClick={() => setShowConfirm(true)} disabled={deactivating || loading}>
            {deactivating ? "Deactivating..." : "Deactivate animal"}
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={loading || deactivating}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAnimalModal;
