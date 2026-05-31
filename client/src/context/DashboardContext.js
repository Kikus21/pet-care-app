import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { STATUS_LABELS } from "../utils/translations";
import { useAppContext } from "./AppContext";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const navigate = useNavigate();
  const { hasAnimals, notifEnabled, handleToggleNotif: onToggleNotif, handleAnimalRegistered: onAnimalRegistered } = useAppContext();
  const [reminders, setReminders] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, overdue: 0, completed: 0 });
  const [filterAnimal, setFilterAnimal] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editProcedure, setEditProcedure] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [urgentPage, setUrgentPage] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const PAGE_SIZE = 5;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUrgentPage(0);
    setCompletedPage(0);
  }, [filterAnimal, filterFrom, filterTo]);

  const loadData = () => {
    fetch("http://localhost:3001/animal/stats")
      .then((r) => r.json())
      .then((data) => setStats({
        total: data.animals.total,
        upcoming: data.procedures.by_status?.UPCOMING || 0,
        overdue: data.procedures.by_status?.DUE_TODAY || 0,
        completed: data.procedures.by_status?.COMPLETED || 0,
      }))
      .catch(console.error);

    fetch("http://localhost:3001/animal/list")
      .then((r) => r.json())
      .then((data) => setAnimals(data.itemList || []))
      .catch(console.error);

    Promise.all([
      fetch("http://localhost:3001/procedure/reminders").then((r) => r.json()),
      fetch("http://localhost:3001/procedure/list?pageSize=200&status=COMPLETED").then((r) => r.json()),
    ])
      .then(([remData, compData]) => {
        const STATUS_ORDER = { DUE_TODAY: 0, DUE_SOON: 1, UPCOMING: 2, COMPLETED: 3 };
        const all = [
          ...(remData.procedures || []),
          ...(compData.itemList || []),
        ].sort((a, b) => {
          const oa = STATUS_ORDER[a.status] ?? 99;
          const ob = STATUS_ORDER[b.status] ?? 99;
          if (oa !== ob) return oa - ob;
          return new Date(a.scheduled_at) - new Date(b.scheduled_at);
        });
        setReminders(all);
      })
      .catch(console.error);
  };

  const handleAnimalSaved = () => {
    setShowAddAnimal(false);
    loadData();
    onAnimalRegistered?.();
  };

  const handleComplete = async (procedure_id) => {
    setActionLoading(procedure_id);
    try {
      const res = await fetch(`http://localhost:3001/procedure/${procedure_id}/complete`, { method: "PATCH" });
      if (res.ok) { setExpanded(null); loadData(); }
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcedureSaved = () => {
    setShowAddProcedure(false);
    loadData();
  };

  const handleProcedureUpdated = (updated) => {
    setReminders((prev) => prev.map((r) => r.procedure_id === updated.procedure_id ? { ...r, ...updated } : r));
    setEditProcedure(null);
  };

  const handleRowClick = (r) => navigate("/procedures", { state: { procedureId: r.procedure_id } });

  const getAnimalName = (id) => animals.find((a) => a.animal_id === id)?.name || id;
  const getStatusLabel = (status) => STATUS_LABELS[status] || status;

  // computed
  const activeAnimalIds = new Set(animals.filter((a) => a.is_active).map((a) => a.animal_id));

  const filteredReminders = reminders.filter((r) => {
    if (r.status !== "COMPLETED" && !activeAnimalIds.has(r.animal_id)) return false;
    if (filterAnimal && r.animal_id !== filterAnimal) return false;
    if (filterFrom && r.scheduled_at?.split("T")[0] < filterFrom) return false;
    if (filterTo && r.scheduled_at?.split("T")[0] > filterTo) return false;
    return true;
  });

  const notifReminders = reminders.filter((r) => r.status !== "COMPLETED" && activeAnimalIds.has(r.animal_id));
  const notifUrgent = notifReminders.filter((r) => r.status === "DUE_TODAY");
  const notifSoon = notifReminders.filter((r) => r.status === "DUE_SOON");
  const notifUpcoming = notifReminders.filter((r) => r.status === "UPCOMING");

  return (
    <DashboardContext.Provider value={{
      // dáta
      reminders, animals, stats,
      filteredReminders, notifReminders, notifUrgent, notifSoon, notifUpcoming,
      // filtre
      filterAnimal, setFilterAnimal,
      filterFrom, setFilterFrom,
      filterTo, setFilterTo,
      // stránkovanie
      urgentPage, setUrgentPage,
      completedPage, setCompletedPage,
      PAGE_SIZE,
      // UI state
      expanded, setExpanded,
      editProcedure, setEditProcedure,
      actionLoading,
      showAddAnimal, setShowAddAnimal,
      showAddProcedure, setShowAddProcedure,
      // akcie
      loadData,
      handleAnimalSaved,
      handleComplete,
      handleProcedureSaved,
      handleProcedureUpdated,
      handleRowClick,
      getAnimalName,
      getStatusLabel,
      // props z App
      hasAnimals,
      notifEnabled,
      onToggleNotif,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
