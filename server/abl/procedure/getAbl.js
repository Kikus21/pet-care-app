const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function getAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const procedure = procedures.find((a) => a.procedure_id === id);

    if (!procedure) {
        return res.status(404).json({ error: "Procedura sa nenašla" });
    }

    return res.status(200).json(procedure);
}

module.exports = getAbl;