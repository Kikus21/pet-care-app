const fs = require("fs");
const path = require("path");
const formatDate = require("../../utils/formatDate");

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");

async function reactivateAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const animals = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = animals.findIndex((a) => a.animal_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Zviera sa nenašlo" });
    }

    // Nemôžeme reaktivovať už aktívne zviera
    if (animals[index].is_active === true) {
        return res.status(400).json({ errors: ["Zviera je už aktívne"] });
    }

    animals[index] = {
        ...animals[index],
        is_active: true,
        updated_at: formatDate(new Date())
    };

    fs.writeFileSync(filePath, JSON.stringify(animals, null, 2), "utf-8");

    return res.status(200).json({
        message: "Zviera bolo úspešne reaktivované!",
        animal: animals[index]
    });
}

module.exports = reactivateAbl;