const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");

async function getAbl(req, res) {
    const { id } = req.params;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const animals = fileContent.trim() ? JSON.parse(fileContent) : [];

    const animal = animals.find((a) => a.animal_id === id);

    if (!animal) {
        return res.status(404).json({ error: "Zviera sa nenašlo" });
    }

    return res.status(200).json(animal);
}

module.exports = getAbl;