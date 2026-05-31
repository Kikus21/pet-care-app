import { createContext, useContext, useState } from "react";

const TYPES = ["VACCINATION", "VET_VISIT", "DEWORMING", "ANTIPARASITIC", "MEDICATION", "GROOMING", "CUSTOM"];

const EditProcedureContext = createContext(null);

export function EditProcedureProvider({ children, procedure, animalName, onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    type: procedure.type || "",
    title: procedure.title || "",
    scheduled_at: procedure.scheduled_at?.split("T")[0] || procedure.scheduled_at || "",
    notes: procedure.notes || "",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);

    const body = {
      animal_id: procedure.animal_id,
      type: form.type,
      title: form.title,
      scheduled_at: form.scheduled_at,
    };
    if (form.notes.trim()) body.notes = form.notes.trim();

    try {
      const res = await fetch(`http://localhost:3001/procedure/${procedure.procedure_id}`, {
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
    <EditProcedureContext.Provider value={{
      form,
      errors,
      loading,
      today,
      TYPES,
      animalName,
      procedure,
      handleChange,
      handleSubmit,
      onClose,
    }}>
      {children}
    </EditProcedureContext.Provider>
  );
}

export function useEditProcedure() {
  return useContext(EditProcedureContext);
}
