function calculateStatus(scheduledAt, currentStatus) {
    if (currentStatus === "SNOOZED" ||
        currentStatus === "CANCELLED" ||
        currentStatus === "COMPLETED") {
        return currentStatus;
    }

    const scheduled = new Date(scheduledAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((scheduled - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return "UPCOMING";
    if (diffDays > 1 && diffDays <= 7) return "DUE_SOON";
    if (diffDays === 1) return "DUE_SOON";
    if (diffDays === 0) return "DUE_TODAY";
    if (diffDays < 0) return "DUE_TODAY";
}

module.exports = calculateStatus;