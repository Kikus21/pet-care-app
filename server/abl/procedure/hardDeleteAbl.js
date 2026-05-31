const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function hardDeleteAbl(req, res) {
    const { id } = req.params;

    const content = fs.readFileSync(filePath, "utf-8");
    const procedures = content.trim() ? JSON.parse(content) : [];

    const index = procedures.findIndex((p) => p.procedure_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Procedúra sa nenašla" });
    }

    const p = procedures[index];
    const isHistory = p.status === "COMPLETED" || p.status === "CANCELLED" || p.is_deleted === true;
    if (!isHistory) {
        return res.status(400).json({ error: "Možno vymazať iba záznamy z histórie." });
    }

    procedures.splice(index, 1);
    fs.writeFileSync(filePath, JSON.stringify(procedures, null, 2), "utf-8");

    return res.status(200).json({ message: "Záznam bol trvalo vymazaný." });
}

module.exports = hardDeleteAbl;
