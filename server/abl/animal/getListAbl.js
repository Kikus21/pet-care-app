const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");

async function getListAbl(req, res) {
    const { species, is_active, name, page = 1, pageSize = 10 } = req.query;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    let animals = fileContent.trim() ? JSON.parse(fileContent) : [];

    // Filter podľa species
    if (species) {
        animals = animals.filter((a) => a.species === species.toUpperCase());
    }

    // Filter podľa aktívnosti
    if (is_active !== undefined) {
        const active = is_active === "true";
        animals = animals.filter((a) => a.is_active === active);
    }

    // Filter podľa mena
    if (name) {
        animals = animals.filter((a) =>
            a.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    // Stránkovanie
    const totalItems = animals.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = parseInt(page);
    const start = (currentPage - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const itemList = animals.slice(start, end);

    return res.status(200).json({
        itemList,
        pageInfo: {
            currentPage,
            pageSize: parseInt(pageSize),
            totalItems,
            totalPages
        }
    });
}

module.exports = getListAbl;