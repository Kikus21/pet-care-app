const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const calculateStatus = require("../../utils/calculateStatus");
const formatDate = require("../../utils/formatDate");

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);

const filePath = path.join(__dirname, "../../dao/storage/proceduresList/procedures.json");
const animalsFilePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");

const schema = {
    type: "object",
    properties: {
        animal_id: { type: "string" },
        type: {
            type: "string",
            enum: ["VACCINATION", "VET_VISIT", "DEWORMING", "ANTIPARASITIC", "MEDICATION", "GROOMING", "CUSTOM"],
            errorMessage: {
                enum: "Typ musí byť jedna z hodnôt: VACCINATION, VET_VISIT, DEWORMING, ANTIPARASITIC, MEDICATION, GROOMING, CUSTOM"
            }
        },
        title: {
            type: "string",
            minLength: 2,
            maxLength: 50,
            errorMessage: {
                minLength: "Názov musí mať aspoň 2 znaky",
                maxLength: "Názov môže mať maximálne 50 znakov"
            }
        },
        scheduled_at: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            errorMessage: {
                type: "Dátum musí byť text",
                pattern: "Dátum musí byť vo formáte YYYY-MM-DD"
            }
        },
        status: {
            type: "string",
            enum: ["UPCOMING", "DUE_SOON", "COMPLETED", "SNOOZED", "CANCELLED"],
            errorMessage: {
                enum: "Status musí byť jedna z hodnôt: UPCOMING, DUE_SOON, COMPLETED, SNOOZED, CANCELLED"
            }
        },
        notes: {
            type: "string",
            maxLength: 50,
            pattern: "^[a-zA-ZÀ-žá-žÁ-Ž0-9 .,]+$",
            errorMessage: {
                type: "Poznámky musia byť text",
                maxLength: "Poznámky môžu mať maximálne 50 znakov",
                pattern: "Poznámky obsahujú nepovolené znaky"
            }
        }
    },
    required: ["animal_id", "type", "title", "scheduled_at"],
    additionalProperties: false
};

const validate = ajv.compile(schema);

async function updateAbl(req, res) {
    const { id } = req.params;
    const body = req.body;

    // 1. AJV validácia
    const valid = validate(body);
    if (!valid) {
        const errors = validate.errors.map((e) => e.message);
        return res.status(400).json({ errors });
    }

    // 2. Validácia že zviera existuje
    const animalsContent = fs.readFileSync(animalsFilePath, "utf-8");
    const animals = animalsContent.trim() ? JSON.parse(animalsContent) : [];
    const animal = animals.find((a) => a.animal_id === body.animal_id);
    if (!animal) {
        return res.status(404).json({
            errors: ["Neplatná požiadavka"]
        });
    }

    // 3. Validácia scheduled_at nie je v minulosti
    const scheduled = new Date(body.scheduled_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(scheduled.getTime())) {
        return res.status(400).json({ errors: ["Dátum nie je platný"] });
    }
    if (scheduled < today) {
        return res.status(400).json({ errors: ["Dátum nemôže byť v minulosti"] });
    }

    // 4. Nájdeme procedúru
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = procedures.findIndex((p) => p.procedure_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Procedúra sa nenašla" });
    }

    // 5. Výpočet statusu
    const status = calculateStatus(body.scheduled_at, body.status);

    //bez updatu už copmleted proceduru
    // Nemôžeme updatovať dokončenú procedúru
    if (procedures[index].status === "COMPLETED") {
        return res.status(400).json({ errors: ["Dokončenú procedúru nie je možné upraviť"] });
    }

    // 6. Update
    const updated = {
        ...procedures[index],
        ...body,
        procedure_id: id,
        status: status,
        completed_at: status === "COMPLETED" ? formatDate(new Date()) : procedures[index].completed_at,
        updated_at: formatDate(new Date())
    };

    procedures[index] = updated;
    fs.writeFileSync(filePath, JSON.stringify(procedures, null, 2), "utf-8");

    return res.status(200).json(updated);
}

module.exports = updateAbl;