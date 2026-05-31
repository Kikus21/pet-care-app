const fs = require("fs");
const path = require("path");
const calculateStatus = require("../../utils/calculateStatus");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function getReminderAbl(req, res) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const reminders = procedures
        .filter((p) => !p.is_deleted && p.status !== "COMPLETED" && p.status !== "CANCELLED")
        .map((p) => ({ ...p, status: calculateStatus(p.scheduled_at, p.status) }))
        .filter((p) => p.status === "DUE_TODAY" || p.status === "DUE_SOON" || p.status === "UPCOMING");

    return res.status(200).json({
        count: reminders.length,
        procedures: reminders
    });
}

module.exports = getReminderAbl;
