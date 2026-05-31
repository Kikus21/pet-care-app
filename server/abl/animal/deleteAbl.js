const fs = require("fs");
const path = require("path");
const formatDate = require("../../utils/formatDate");

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");
const proceduresFilePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function deleteAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const animals = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = animals.findIndex((a) => a.animal_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Zviera sa nenašlo" });
    }

    // Už je inactive
    if (animals[index].is_active === false) {
        return res.status(400).json({ errors: ["Zviera je už neaktívne"] });
    }

    // Nastavíme všetky procedúry zvieraťa na COMPLETED
    const proceduresContent = fs.readFileSync(proceduresFilePath, "utf-8");
    const procedures = proceduresContent.trim() ? JSON.parse(proceduresContent) : [];

    procedures.forEach((p, i) => {
        if (p.animal_id === id && p.status !== "COMPLETED" && p.status !== "CANCELLED") {
            procedures[i] = {
                ...procedures[i],
                status: "COMPLETED",
                completed_at: formatDate(new Date()),
                updated_at: formatDate(new Date())
            };
        }
    });

    fs.writeFileSync(proceduresFilePath, JSON.stringify(procedures, null, 2), "utf-8");

    // Deaktivujeme zviera
    animals[index] = {
        ...animals[index],
        is_active: false,
        updated_at: formatDate(new Date())
    };

    fs.writeFileSync(filePath, JSON.stringify(animals, null, 2), "utf-8");

    return res.status(200).json({
        message: "Zviera bolo úspešne deaktivované a všetky procedúry uzatvorené!"
    });
}

module.exports = deleteAbl;