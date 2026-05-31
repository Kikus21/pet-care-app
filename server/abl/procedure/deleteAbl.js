const fs = require("fs");
const path = require("path");
const formatDate = require("../../utils/formatDate");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function deleteAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = procedures.findIndex((a) => a.procedure_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Procedúra sa nenašla" });
    }

    procedures[index] = {
        ...procedures[index],
        is_deleted: true,
        deleted_at: formatDate(new Date())
    };

    fs.writeFileSync(filePath, JSON.stringify(procedures, null, 2), "utf-8");

    return res.status(200).json({ message: "Procedúra bola úspešne zmazaná" });
}

module.exports = deleteAbl;