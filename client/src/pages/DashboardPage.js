import React from "react";
import "./DashboardPage.css";
import AddAnimalModal from "../components/AddAnimalModal";
import AddProcedureModal from "../components/AddProcedureModal";
import EditProcedureModal from "../components/EditProcedureModal";
import { DashboardProvider, useDashboard } from "../context/DashboardContext";
import { TYPE_LABELS, TYPE_EMOJI } from "../utils/translations";

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d - today) / (1000 * 60 * 60 * 24));
}

function dueLabelFor(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `In ${days}d`;
}

function NotifCard({ r }) {
  const { expanded, setExpanded, handleComplete, actionLoading, setEditProcedure, getAnimalName } = useDashboard();
  const days = daysUntil(r.scheduled_at);
  const isOpen = expanded === r.procedure_id;
  const statusKey = r.status.toLowerCase().replace("_", "-");
  return (
    <div className={`dnp-card dnp-card--${statusKey} ${isOpen ? "dnp-card--open" : ""}`}>
      <button className="dnp-card-header" onClick={() => setExpanded(isOpen ? null : r.procedure_id)}>
        <span className="dnp-card-emoji">{TYPE_EMOJI[r.type] || "📋"}</span>
        <div className="dnp-card-body">
          <span className="dnp-card-title">{r.title}</span>
          <span className="dnp-card-meta">{getAnimalName(r.animal_id)}</span>
        </div>
        <span className={`dnp-card-due dnp-card-due--${statusKey}`}>{dueLabelFor(days)}</span>
        <span className="dnp-card-chevron">{isOpen ? "▲" : "▼"}</span>
      </button>
      {isOpen && (
        <div className="dnp-card-detail">
          <div className="dnp-detail-row">
            <span className="dnp-detail-label">Scheduled</span>
            <span className="dnp-detail-value">{r.scheduled_at?.split("T")[0]}</span>
          </div>
          <div className="dnp-detail-row">
            <span className="dnp-detail-label">Type</span>
            <span className="dnp-detail-value">{TYPE_LABELS[r.type] || r.type}</span>
          </div>
          {r.notes && (
            <div className="dnp-detail-row">
              <span className="dnp-detail-label">Notes</span>
              <span className="dnp-detail-value">{r.notes}</span>
            </div>
          )}
          <div className="dnp-card-actions">
            <button
              className="btn-complete"
              onClick={() => handleComplete(r.procedure_id)}
              disabled={actionLoading === r.procedure_id}
            >
              {actionLoading === r.procedure_id ? "..." : "✓ Done"}
            </button>
            <button className="btn-edit" onClick={() => setEditProcedure(r)}>Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const {
    reminders, animals, stats,
    filteredReminders, notifReminders, notifUrgent, notifSoon, notifUpcoming,
    filterAnimal, setFilterAnimal,
    filterFrom, setFilterFrom,
    filterTo, setFilterTo,
    urgentPage, setUrgentPage,
    completedPage, setCompletedPage,
    PAGE_SIZE,
    editProcedure, setEditProcedure,
    showAddAnimal, setShowAddAnimal,
    showAddProcedure, setShowAddProcedure,
    handleAnimalSaved, handleProcedureSaved, handleProcedureUpdated,
    handleRowClick, getAnimalName, getStatusLabel,
    hasAnimals, notifEnabled, onToggleNotif,
  } = useDashboard();

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-main">
          {hasAnimals && (
            <div className="dashboard-actions">
              <button className="dashboard-add-btn" onClick={() => setShowAddAnimal(true)}>+ Add Animal</button>
            </div>
          )}

          {hasAnimals && (
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Total animals</p>
                <p className="stat-value">{stats.total}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Upcoming (days)</p>
                <p className="stat-value">{stats.upcoming}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Overdue/Due Today</p>
                <p className="stat-value">{stats.overdue}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Completed</p>
                <p className="stat-value">{stats.completed}</p>
              </div>
            </div>
          )}

          {hasAnimals && reminders.length === 0 && (
            <div className="empty-procedures">
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <h3>Žiadne procedúry</h3>
              <p>Pridaj prvú procedúru pre svoje zviera.</p>
              <button className="dashboard-add-btn dashboard-add-btn--center" onClick={() => setShowAddProcedure(true)}>
                + Add Procedure
              </button>
            </div>
          )}

          {hasAnimals && reminders.length > 0 && (
            <div className="reminders-section">
              <div className="reminders-toolbar">
                <h3>
                  PROCEDURES
                  {notifUrgent.length > 0 && (
                    <span className="proc-heading-badge proc-heading-badge--overdue">
                      {notifUrgent.length} overdue
                    </span>
                  )}
                  {notifSoon.length > 0 && (
                    <span className="proc-heading-badge proc-heading-badge--soon">
                      {notifSoon.length} due soon
                    </span>
                  )}
                </h3>
                <div className="reminders-toolbar-right">
                  <button className="dashboard-add-btn" onClick={() => setShowAddProcedure(true)}>+ Add Procedure</button>
                  <div className="reminders-filters">
                    <select className="filter-select" value={filterAnimal} onChange={(e) => setFilterAnimal(e.target.value)}>
                      <option value="">All animals</option>
                      {animals.map((a) => (
                        <option key={a.animal_id} value={a.animal_id}>{a.name}</option>
                      ))}
                    </select>
                    <input type="date" className="filter-date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="From date" />
                    <span className="filter-sep">–</span>
                    <input type="date" className="filter-date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="To date" />
                    {(filterAnimal || filterFrom || filterTo) && (
                      <button className="filter-clear" onClick={() => { setFilterAnimal(""); setFilterFrom(""); setFilterTo(""); }}>
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <table className="reminders-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>PROCEDURE</th>
                    <th>ANIMAL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const activeItems = filteredReminders.filter(r => r.status !== "COMPLETED");
                    const completedItems = filteredReminders.filter(r => r.status === "COMPLETED");
                    const pagedActive = activeItems.slice(urgentPage * PAGE_SIZE, (urgentPage + 1) * PAGE_SIZE);
                    const pagedCompleted = completedItems.slice(completedPage * PAGE_SIZE, (completedPage + 1) * PAGE_SIZE);
                    const activePages = Math.ceil(activeItems.length / PAGE_SIZE);
                    const completedPages = Math.ceil(completedItems.length / PAGE_SIZE);
                    const hasUrgentAnywhere = activeItems.some(r => r.status === "DUE_TODAY" || r.status === "DUE_SOON");

                    if (filteredReminders.length === 0) return (
                      <tr><td colSpan={4} className="reminders-empty-row">No procedures match the filter.</td></tr>
                    );

                    return (
                      <>
                        {pagedActive.map((r, i) => {
                          const prevIsUrgent = i > 0 ? (pagedActive[i-1].status === "DUE_TODAY" || pagedActive[i-1].status === "DUE_SOON") : null;
                          const showUpcomingSep = r.status === "UPCOMING" && (
                            (i === 0 && hasUrgentAnywhere) || (i > 0 && prevIsUrgent)
                          );
                          return (
                            <React.Fragment key={r.procedure_id}>
                              {showUpcomingSep && (
                                <tr className="reminders-group-label-row"><td colSpan={4}>Nadchádzajúce</td></tr>
                              )}
                              <tr className="reminders-table-row" onClick={() => handleRowClick(r)}>
                                <td>{r.scheduled_at?.split("T")[0]}</td>
                                <td>{r.title}</td>
                                <td>{getAnimalName(r.animal_id)}</td>
                                <td><span className={`status-badge ${r.status.toLowerCase()}`}>{getStatusLabel(r.status)}</span></td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                        {activePages > 1 && (
                          <tr className="reminders-pagination-row">
                            <td colSpan={4}>
                              <div className="reminders-pagination">
                                <button className="rpag-btn" disabled={urgentPage === 0} onClick={() => setUrgentPage(p => p - 1)}>‹</button>
                                <span className="rpag-info">{urgentPage + 1} / {activePages}</span>
                                <button className="rpag-btn" disabled={urgentPage >= activePages - 1} onClick={() => setUrgentPage(p => p + 1)}>›</button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {completedItems.length > 0 && (
                          <tr className="reminders-group-label-row"><td colSpan={4}>Hotové procedúry</td></tr>
                        )}
                        {pagedCompleted.map((r) => (
                          <tr key={r.procedure_id} className="reminders-table-row reminders-table-row--completed" onClick={() => handleRowClick(r)}>
                            <td>{r.scheduled_at?.split("T")[0]}</td>
                            <td>{r.title}</td>
                            <td>{getAnimalName(r.animal_id)}</td>
                            <td><span className={`status-badge ${r.status.toLowerCase()}`}>{getStatusLabel(r.status)}</span></td>
                          </tr>
                        ))}
                        {completedPages > 1 && (
                          <tr className="reminders-pagination-row">
                            <td colSpan={4}>
                              <div className="reminders-pagination">
                                <button className="rpag-btn" disabled={completedPage === 0} onClick={() => setCompletedPage(p => p - 1)}>‹</button>
                                <span className="rpag-info">{completedPage + 1} / {completedPages}</span>
                                <button className="rpag-btn" disabled={completedPage >= completedPages - 1} onClick={() => setCompletedPage(p => p + 1)}>›</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {animals.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <h2>No animals yet</h2>
              <p>Register your first pet to start tracking procedures, health history and set up reminders.</p>
              <button className="register-btn" onClick={() => setShowAddAnimal(true)}>
                + Register first animal
              </button>
            </div>
          )}
        </div>

        {hasAnimals && (
          <div className="dashboard-notif-panel">
            <div className="dnp-header">
              <h3 className="dnp-title">🔔 Notifications</h3>
              {onToggleNotif && (
                <button className="dnp-toggle-btn" onClick={() => onToggleNotif(!notifEnabled)}>
                  <span className={`dnp-toggle-state ${notifEnabled ? "dnp-toggle-state--on" : "dnp-toggle-state--off"}`}>
                    {notifEnabled ? "ZAP" : "VYP"}
                  </span>
                  <span className={`notif-toggle ${notifEnabled ? "notif-toggle--on" : "notif-toggle--off"}`}>
                    <span className="notif-toggle-knob" />
                  </span>
                </button>
              )}
            </div>

            {!notifEnabled && <div className="dnp-disabled">Notifikácie sú vypnuté</div>}

            {notifEnabled && notifReminders.length === 0 && (
              <div className="dnp-empty">
                <span style={{ fontSize: 28 }}>✅</span>
                <p>All clear!</p>
              </div>
            )}

            {notifEnabled && notifUrgent.length > 0 && (
              <div className="dnp-section">
                <p className="dnp-section-title dnp-section-title--urgent">🔴 Overdue / Due Today</p>
                {notifUrgent.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
              </div>
            )}
            {notifEnabled && notifSoon.length > 0 && (
              <div className="dnp-section">
                <p className="dnp-section-title dnp-section-title--soon">🟡 Due Soon</p>
                {notifSoon.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
              </div>
            )}
            {notifEnabled && notifUpcoming.length > 0 && (
              <div className="dnp-section">
                <p className="dnp-section-title dnp-section-title--upcoming">🔵 Upcoming</p>
                {notifUpcoming.map((r) => <NotifCard key={r.procedure_id} r={r} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddAnimal && (
        <AddAnimalModal onClose={() => setShowAddAnimal(false)} onSave={handleAnimalSaved} />
      )}
      {showAddProcedure && (
        <AddProcedureModal
          onClose={() => setShowAddProcedure(false)}
          onSave={handleProcedureSaved}
        />
      )}
      {editProcedure && (
        <EditProcedureModal
          procedure={editProcedure}
          animalName={getAnimalName(editProcedure.animal_id)}
          onClose={() => setEditProcedure(null)}
          onSave={handleProcedureUpdated}
        />
      )}
    </>
  );
}

function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default DashboardPage;
