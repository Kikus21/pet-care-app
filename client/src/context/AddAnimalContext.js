import { createContext, useContext, useState } from "react";

const SPECIES_OPTIONS = ["DOG", "CAT", "RABBIT", "BIRD", "OTHER"];
const BREEDS = {
  DOG: ["LABRADOR", "GOLDEN_RETRIEVER", "GERMAN_SHEPHERD", "AUSTRALIAN_SHEPHERD", "BULLDOG", "POODLE", "BEAGLE", "OTHER"],
  CAT: ["PERSIAN", "SIAMESE", "MAINE_COON", "BENGAL", "BRITISH_SHORTHAIR", "OTHER"],
  RABBIT: ["HOLLAND_LOP", "MINI_REX", "LIONHEAD", "DUTCH", "OTHER"],
  BIRD: ["PARROT", "CANARY", "COCKATIEL", "BUDGERIGAR", "OTHER"],
  OTHER: ["OTHER"],
};

const today = new Date().toISOString().split("T")[0];

const AddAnimalContext = createContext(null);

export function AddAnimalProvider({ children, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    owner: "",
    species: "",
    breed: "",
    gender: "",
    date_of_birth: today,
    weight: "",
    microchip_number: "",
    notes: "",
    photo_url: "",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "species" ? { breed: "" } : {}),
    }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setForm((prev) => ({ ...prev, photo_url: e.target.files[0].name }));
    }
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
      const res = await fetch("http://localhost:3001/animal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ["Nastala chyba"]);
      } else {
        onSave(data.animal);
        onClose();
      }
    } catch {
      setErrors(["Nepodarilo sa pripojiť k serveru"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddAnimalContext.Provider value={{
      form,
      errors,
      loading,
      SPECIES_OPTIONS,
      BREEDS,
      handleChange,
      handlePhotoChange,
      handleSubmit,
      onClose,
    }}>
      {children}
    </AddAnimalContext.Provider>
  );
}

export function useAddAnimal() {
  return useContext(AddAnimalContext);
}
