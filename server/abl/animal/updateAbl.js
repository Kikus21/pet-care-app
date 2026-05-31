const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const formatDate = require("../../utils/formatDate")

const ajv = new Ajv({ allErrors: true });
ajvErrors(ajv);

const filePath = path.join(__dirname, "../../dao/storage/animalsList/animals.json");
const breedsFilePath = path.join(__dirname, "../../dao/storage/enums/breeds.json");

const schema = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 2,
            maxLength: 100,
            pattern: "^[a-zA-ZÀ-žá-žÁ-Ž0-9 ]+$",
            errorMessage: {
                type: "Meno musí byť text",
                minLength: "Meno musí mať aspoň 2 znaky",
                maxLength: "Meno môže mať maximálne 100 znakov",
                pattern: "Meno obsahuje nepovolené znaky"
            }
        },
        owner: {
            type: "string",
            minLength: 2,
            maxLength: 20,
            pattern: "^[a-zA-ZÀ-žá-žÁ-Ž ]+$",
            errorMessage: {
                type: "Owner musí byť text",
                minLength: "Owner musí mať aspoň 2 znaky",
                maxLength: "Owner môže mať maximálne 20 znakov",
                pattern: "Owner obsahuje nepovolené znaky"
            }
        },
        species: {
            type: "string",
            enum: ["DOG", "CAT", "RABBIT", "BIRD", "OTHER"],
            errorMessage: {
                enum: "Species musí byť jedna z hodnôt: DOG, CAT, RABBIT, BIRD, OTHER"
            }
        },
        breed: {
            type: "string",
            enum: [
                "LABRADOR", "GOLDEN_RETRIEVER", "GERMAN_SHEPHERD", "AUSTRALIAN_SHEPHERD", "BULLDOG", "POODLE", "BEAGLE",
                "PERSIAN", "SIAMESE", "MAINE_COON", "BENGAL", "BRITISH_SHORTHAIR",
                "HOLLAND_LOP", "MINI_REX", "LIONHEAD", "DUTCH",
                "PARROT", "CANARY", "COCKATIEL", "BUDGERIGAR",
                "OTHER"
            ],
            errorMessage: {
                enum: "Breed nie je platná hodnota"
            }
        },
        gender: {
            type: "string",
            enum: ["MALE", "FEMALE", "UNKNOWN"],
            errorMessage: {
                enum: "Pohlavie musí byť jedna z hodnôt: MALE, FEMALE, UNKNOWN"
            }
        },
        date_of_birth: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            errorMessage: {
                type: "Dátum narodenia musí byť text",
                pattern: "Dátum narodenia musí byť vo formáte YYYY-MM-DD"
            }
        },
        weight: {
            type: "number",
            minimum: 0,
            multipleOf: 0.01,
            errorMessage: {
                type: "Váha musí byť číslo",
                minimum: "Váha nemôže byť záporná",
                multipleOf: "Váha môže mať maximálne 2 desatinné miesta"
            }
        },
        microchip_number: {
            type: "string",
            minLength: 5,
            maxLength: 10,
            pattern: "^[0-9-]+$",
            errorMessage: {
                type: "Číslo čipu musí byť text",
                minLength: "Číslo čipu musí mať aspoň 5 znakov",
                maxLength: "Číslo čipu môže mať maximálne 10 znakov",
                pattern: "Číslo čipu môže obsahovať len číslice a pomlčky"
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
        },
        photo_url: {
            type: "string",
            pattern: "^[a-zA-Z0-9_-]+\\.jpg$",
            errorMessage: {
                type: "Foto musí byť text",
                pattern: "Foto musí byť súbor vo formáte .jpg"
            }
        }
    },
    required: ["name", "owner", "species", "gender", "date_of_birth", "weight"],
    additionalProperties: false
};

const validate = ajv.compile(schema);

async function updateAbl(req, res) {
    const { id } = req.params;
    const body = req.body;

    // Validácia schémy
    const valid = validate(body);
    if (!valid) {
        const errors = validate.errors.map((e) => e.message);
        return res.status(400).json({ errors });
    }

    // Validácia dátumu narodenia nie je v budúcnosti
    if (body.date_of_birth) {
        const dob = new Date(body.date_of_birth);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(dob.getTime())) {
            return res.status(400).json({
                errors: ["Dátum narodenia nie je platný dátum"]
            });
        }

        if (dob > today) {
            return res.status(400).json({
                errors: ["Dátum narodenia nemôže byť v budúcnosti"]
            });
        }
    }

    // Validácia formátu fotky
    if (body.photo_url) {
        if (!body.photo_url.endsWith(".jpg")) {
            return res.status(400).json({
                errors: ["Foto musí byť vo formáte .jpg"]
            });
        }
    }

    // Validácia breed voči species
    if (body.breed) {
        const breeds = JSON.parse(fs.readFileSync(breedsFilePath, "utf-8"));
        const allowedBreeds = breeds[body.species];
        if (!allowedBreeds.includes(body.breed)) {
            return res.status(400).json({
                errors: [`Breed '${body.breed}' nie je platný pre species '${body.species}'. Povolené hodnoty: ${allowedBreeds.join(", ")}`]
            });
        }
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const animals = fileContent.trim() ? JSON.parse(fileContent) : [];

    const index = animals.findIndex((a) => a.animal_id === id);
    if (index === -1) {
        return res.status(404).json({ error: "Zviera sa nenašlo" });
    }

    // Nemôžeme updatovať neaktívne zviera
    if (animals[index].is_active === false) {
        return res.status(400).json({ errors: ["Neaktívne zviera nie je možné upraviť"] });
    }

    const updated = {
        ...animals[index],
        ...body,
        animal_id: id,
        updated_at: formatDate(new Date())
    };

    animals[index] = updated;
    fs.writeFileSync(filePath, JSON.stringify(animals, null, 2), "utf-8");

    return res.status(200).json(updated);
}

module.exports = updateAbl;