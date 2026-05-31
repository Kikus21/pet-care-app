import { createContext, useContext, useState, useEffect } from "react";

const TYPES = ["VACCINATION", "VET_VISIT", "DEWORMING", "ANTIPARASITIC", "MEDICATION", "GROOMING", "CUSTOM"];
const today = new Date().toISOString().split("T")[0];

const AddProcedureContext = createContext(null);

export function AddProcedureProvider({ children, onClose, onSave }) {
  const [animals, setAnimals] = useState([]);
  const [form, setForm] = useState({
    animal_id: "",
    type: "",
    title: "",
    scheduled_at: today,
    notes: "",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/animal/list")
      .then((res) => res.json())
      .then((data) => setAnimals(data.itemList?.filter((a) => a.is_active) || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors([]);

    const body = {
      animal_id: form.animal_id,
      type: form.type,
      title: form.title,
      scheduled_at: form.scheduled_at,
    };
    if (form.notes.trim()) body.notes = form.notes.trim();

    try {
      const res = await fetch("http://localhost:3001/procedure/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Nastala chyba"]);
      } else {
        onSave(data.procedure);
        onClose();
      }
    } catch {
      setErrors(["Nepodarilo sa pripojiť k serveru"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddProcedureContext.Provider value={{
      animals,
      form,
      errors,
      loading,
      today,
      TYPES,
      handleChange,
      handleSubmit,
      onClose,
    }}>
      {children}
    </AddProcedureContext.Provider>
  );
}

export function useAddProcedure() {
  return useContext(AddProcedureContext);
}
