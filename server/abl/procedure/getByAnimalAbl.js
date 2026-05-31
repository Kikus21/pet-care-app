const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function getByAnimalAbl(req, res) {
    const { animal_id } = req.params;
    const { status } = req.query;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    let result = procedures.filter((p) => p.animal_id === animal_id && !p.is_deleted);

    // Ak je zadaný filter podľa statusu
    if (status) {
        result = result.filter((p) => p.status === status);
    }

    return res.status(200).json(result);
}

module.exports = getByAnimalAbl;