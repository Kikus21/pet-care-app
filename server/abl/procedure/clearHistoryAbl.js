const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function clearHistoryAbl(req, res) {
    const content = fs.readFileSync(filePath, "utf-8");
    const procedures = content.trim() ? JSON.parse(content) : [];

    const isHistory = (p) => p.status === "COMPLETED" || p.status === "CANCELLED" || p.is_deleted === true;

    const removed = procedures.filter(isHistory).length;
    const remaining = procedures.filter((p) => !isHistory(p));

    fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2), "utf-8");

    return res.status(200).json({ message: `Vymazaných ${removed} záznamov z histórie.`, removed });
}

module.exports = clearHistoryAbl;
