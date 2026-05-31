import { TYPE_LABELS, SPECIES_LABELS } from "../utils/translations";
import { AddProcedureProvider, useAddProcedure } from "../context/AddProcedureContext";

function AddProcedureContent() {
  const { animals, form, errors, loading, today, TYPES, handleChange, handleSubmit, onClose } = useAddProcedure();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Add Procedure</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: "block", padding: "20px" }}>
          {errors.length > 0 && (
            <div className="error-box">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          <div className="form-row">
            <div className="form-group full">
              <label>Animal</label>
              <select name="animal_id" value={form.animal_id} onChange={handleChange}>
                <option value="">Select animal...</option>
                {animals.map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.name} ({SPECIES_LABELS[a.species?.toUpperCase()] || a.species})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="">Select type...</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Scheduled date</label>
              <input type="date" name="scheduled_at" value={form.scheduled_at} onChange={handleChange} min={today} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>Title</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Annual vaccination" maxLength={50} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>Notes <span style={{ fontWeight: 400, color: "#8a6020" }}>(optional)</span></label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="e.g. Bring previous records." rows={3} maxLength={50} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={loading || !form.animal_id || !form.type || !form.title}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProcedureModal({ onClose, onSave }) {
  return (
    <AddProcedureProvider onClose={onClose} onSave={onSave}>
      <AddProcedureContent />
    </AddProcedureProvider>
  );
}

export default AddProcedureModal;
