import { TYPE_LABELS } from "../utils/translations";
import { EditProcedureProvider, useEditProcedure } from "../context/EditProcedureContext";

function EditProcedureContent() {
  const { form, errors, loading, today, TYPES, animalName, procedure, handleChange, handleSubmit, onClose } = useEditProcedure();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit procedure – {procedure.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: "block", padding: "20px" }}>
          {errors.length > 0 && (
            <div className="error-box">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
          )}

          <div className="form-row">
            <div className="form-group full">
              <label>Animal</label>
              <input value={animalName} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
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
              <input name="title" value={form.title} onChange={handleChange} maxLength={50} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full">
              <label>Notes <span style={{ fontWeight: 400, color: "#8a6020" }}>(optional)</span></label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} maxLength={50} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit} disabled={loading || !form.title}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProcedureModal({ procedure, animalName, onClose, onSave }) {
  return (
    <EditProcedureProvider procedure={procedure} animalName={animalName} onClose={onClose} onSave={onSave}>
      <EditProcedureContent />
    </EditProcedureProvider>
  );
}

export default EditProcedureModal;
