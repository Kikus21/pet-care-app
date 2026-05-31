const fs = require("fs");
const path = require("path");
const formatDate = require("../../utils/formatDate");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function completeAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = procedures.findIndex((p) => p.procedure_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Procedúra sa nenašla" });
    }

    // Nemôžeme dokončiť už dokončenú alebo zrušenú procedúru
    if (procedures[index].status === "COMPLETED") {
        return res.status(400).json({ errors: ["Procedúra už je dokončená"] });
    }
    if (procedures[index].status === "CANCELLED") {
        return res.status(400).json({ errors: ["Zrušená procedúra sa nedá dokončiť"] });
    }

    procedures[index] = {
        ...procedures[index],
        status: "COMPLETED",
        completed_at: formatDate(new Date()),
        updated_at: formatDate(new Date())
    };

    fs.writeFileSync(filePath, JSON.stringify(procedures, null, 2), "utf-8");

    return res.status(200).json({
        message: "Procedúra úspešne dokončená!",
        procedure: procedures[index]
    });
}

module.exports = completeAbl;