const fs = require("fs");
const path = require("path");
const calculateStatus = require("../../utils/calculateStatus");

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");
const proceduresFilePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function getStatsAbl(req, res) {
    const animalsContent = fs.readFileSync(filePath, "utf-8");
    const animals = animalsContent.trim() ? JSON.parse(animalsContent) : [];

    const proceduresContent = fs.readFileSync(proceduresFilePath, "utf-8");
    const procedures = proceduresContent.trim() ? JSON.parse(proceduresContent) : [];

    // Štatistiky zvierat
    const totalAnimals = animals.length;
    const activeAnimals = animals.filter((a) => a.is_active === true).length;
    const inactiveAnimals = animals.filter((a) => a.is_active === false).length;

    // Počet zvierat podľa species
    const bySpecies = {};
    animals.forEach((a) => {
        bySpecies[a.species] = (bySpecies[a.species] || 0) + 1;
    });

    // Štatistiky procedúr — len pre aktívne zvieratá, vynechaj soft-deleted, prepočítaj status
    const activeAnimalIds = new Set(animals.filter((a) => a.is_active).map((a) => a.animal_id));
    const activeProcedures = procedures.filter((p) => !p.is_deleted && activeAnimalIds.has(p.animal_id));
    const totalProcedures = activeProcedures.length;

    const byStatus = {};
    activeProcedures.forEach((p) => {
        const status = calculateStatus(p.scheduled_at, p.status);
        byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Počet procedúr podľa typu
    const byType = {};
    activeProcedures.forEach((p) => {
        byType[p.type] = (byType[p.type] || 0) + 1;
    });

    return res.status(200).json({
        animals: {
            total: activeAnimals,
            active: activeAnimals,
            inactive: inactiveAnimals,
            by_species: bySpecies
        },
        procedures: {
            total: totalProcedures,
            by_status: byStatus,
            by_type: byType
        }
    });
}

module.exports = getStatsAbl;