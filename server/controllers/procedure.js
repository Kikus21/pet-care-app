const express = require("express");
const router = express.Router();

//Naimportujeme si subor 
const createAbl = require("../abl/procedure/createAbl.js");
const updateAbl = require("../abl/procedure/updateAbl.js");
const getAbl = require("../abl/procedure/getAbl.js");
const deleteAbl = require("../abl/procedure/deleteAbl.js");
const getListAbl = require("../abl/procedure/getListAbl.js");
const getByAnimalAbl = require("../abl/procedure/getByAnimalAbl.js");
const completeAbl = require("../abl/procedure/completeAbl.js");
const getReminderAbl = require("../abl/procedure/getReminderAbl.js");
const clearHistoryAbl = require("../abl/procedure/clearHistoryAbl.js");
const hardDeleteAbl = require("../abl/procedure/hardDeleteAbl.js");

//smerujeme
router.post("/create", createAbl);
router.get("/list", getListAbl);
router.get("/reminders", getReminderAbl);
router.delete("/history", clearHistoryAbl);
router.delete("/history/:id", hardDeleteAbl);
router.put("/:id", updateAbl);
router.get("/:id", getAbl);
router.delete("/:id", deleteAbl);
router.get("/animal/:animal_id", getByAnimalAbl);
router.patch("/:id/complete", completeAbl);



module.exports = router;