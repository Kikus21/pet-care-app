const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const { v4: uuidv4 } = require("uuid");

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
                type: "Názov musí byť text",
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

async function createAbl(req, res) {
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

    // Validácia scheduled_at nie je v minulosti
    const scheduled = new Date(body.scheduled_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(scheduled.getTime())) {
        return res.status(400).json({ errors: ["Dátum nie je platný"] });
    }
    if (scheduled < today) {
        return res.status(400).json({ errors: ["Dátum nemôže byť v minulosti"] });
    }

    // Validácia že zviera je aktívne 
    if (animal.is_active === false) {
        return res.status(400).json({ errors: ["Zviera nemáte aktívne"] });
    }

    // 4. Načítame procedúry a skontrolujeme duplikát (nie pre typy ktoré môžu mať viac záznamov)
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const procedures = fileContent.trim() ? JSON.parse(fileContent) : [];

    const MULTI_ALLOWED = ["CUSTOM", "MEDICATION", "VET_VISIT"];

    if (!MULTI_ALLOWED.includes(body.type)) {
        const existingProcedure = procedures.find(
            (p) => p.animal_id === body.animal_id &&
                p.type === body.type &&
                p.status !== "COMPLETED" &&
                p.status !== "CANCELLED" &&
                !p.is_deleted
        );

        if (existingProcedure) {
            return res.status(400).json({
                errors: [`Zviera už má aktívnu procedúru typu ${body.type}`]
            });
        }
    }

    // 5. Výpočet statusu
    const status = calculateStatus(body.scheduled_at, null);

    // 6. Zápis do súboru
    const newProcedure = {
        procedure_id: uuidv4(),
        animal_id: body.animal_id,
        type: body.type,
        title: body.title,
        scheduled_at: body.scheduled_at,
        status: status,
        completed_at: null,
        notes: body.notes || null,
        created_at: formatDate(new Date()),
        updated_at: formatDate(new Date())
    };

    procedures.push(newProcedure);
    fs.writeFileSync(filePath, JSON.stringify(procedures, null, 2), "utf-8");

    return res.status(201).json({
        message: "Procedúra úspešne vytvorená!",
        procedure: {
            procedure_id: newProcedure.procedure_id,
            title: newProcedure.title,
            type: newProcedure.type,
            status: newProcedure.status,
            created_at: newProcedure.created_at
        }
    });
}

module.exports = createAbl;