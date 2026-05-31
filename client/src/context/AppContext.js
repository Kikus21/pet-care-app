import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [hasAnimals, setHasAnimals] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(
    () => localStorage.getItem("notifEnabled") !== "false"
  );
  const [notifCount, setNotifCount] = useState(0);

  const refreshGlobalState = () => {
    fetch("http://localhost:3001/animal/stats")
      .then((r) => r.json())
      .then((data) => setHasAnimals((data.animals.active + data.animals.inactive) > 0))
      .catch(() => {});

    fetch("http://localhost:3001/procedure/reminders")
      .then((r) => r.json())
      .then((data) => {
        const urgent = (data.procedures || []).filter(
          (p) => p.status === "DUE_TODAY" || p.status === "DUE_SOON"
        ).length;
        setNotifCount(urgent);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshGlobalState();
  }, []);

  const handleToggleNotif = (val) => {
    localStorage.setItem("notifEnabled", val);
    setNotifEnabled(val);
  };

  const handleAnimalRegistered = () => {
    setHasAnimals(true);
    refreshGlobalState();
  };

  return (
    <AppContext.Provider value={{
      hasAnimals,
      notifEnabled,
      notifCount,
      handleToggleNotif,
      handleAnimalRegistered,
      refreshGlobalState,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}