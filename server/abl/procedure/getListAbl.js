const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");

async function getListAbl(req, res) {
    const { animal_id, status, type, page = 1, pageSize = 10, includeDeleted } = req.query;

    const fileContent = fs.readFileSync(filePath, "utf-8");
    let procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    if (!includeDeleted) {
        procedures = procedures.filter((p) => !p.is_deleted);
    }

    // Filter podľa animal_id
    if (animal_id) {
        procedures = procedures.filter((p) => p.animal_id === animal_id);
    }

    // Filter podľa statusu
    if (status) {
        procedures = procedures.filter((p) => p.status === status.toUpperCase());
    }

    // Filter podľa typu
    if (type) {
        procedures = procedures.filter((p) => p.type === type.toUpperCase());
    }

    // Stránkovanie
    const totalItems = procedures.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = parseInt(page);
    const start = (currentPage - 1) * parseInt(pageSize);
    const end = start + parseInt(pageSize);
    const itemList = procedures.slice(start, end);

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