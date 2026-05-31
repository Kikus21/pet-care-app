import { SPECIES_LABELS, BREED_LABELS, GENDER_LABELS } from "../utils/translations";
import { AddAnimalProvider, useAddAnimal } from "../context/AddAnimalContext";

function AddAnimalContent() {
  const { form, errors, loading, SPECIES_OPTIONS, BREEDS, handleChange, handlePhotoChange, handleSubmit, onClose } = useAddAnimal();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Register new animal</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <div className="animal-photo-placeholder">🐕</div>
            <label className="file-btn">
              Choose File
              <input type="file" accept=".jpg" hidden onChange={handlePhotoChange} />
            </label>
            <span className="file-name">{form.photo_url || "No file chosen"}</span>
          </div>

          <div className="modal-right">
            {errors.length > 0 && (
              <div className="error-box">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}

            <div className="form-row">
              <div className="form-group full">
                <label>Owner</label>
                <input name="owner" value={form.owner} onChange={handleChange} placeholder="Lukas Homza" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ruby" />
              </div>
              <div className="form-group">
                <label>Species</label>
                <select name="species" value={form.species} onChange={handleChange}>
                  <option value="">Select...</option>
                  {SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Breed</label>
                <select name="breed" value={form.breed} onChange={handleChange} disabled={!form.species}>
                  <option value="">Select...</option>
                  {form.species && BREEDS[form.species]?.map((b) => (
                    <option key={b} value={b}>{BREED_LABELS[b] || b}</option>
                  ))}
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
                <input name="weight" value={form.weight} onChange={handleChange} placeholder="25" type="number" step="0.01" />
              </div>
              <div className="form-group">
                <label>Chip</label>
                <input name="microchip_number" value={form.microchip_number} onChange={handleChange} placeholder="TRE-1-A" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Alergic on fish." rows={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={loading || !form.name}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAnimalModal({ onClose, onSave }) {
  return (
    <AddAnimalProvider onClose={onClose} onSave={onSave}>
      <AddAnimalContent />
    </AddAnimalProvider>
  );
}

export default AddAnimalModal;
