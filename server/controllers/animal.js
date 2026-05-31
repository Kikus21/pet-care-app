const express = require("express");
const router = express.Router();

//Naimportujeme si subor 
const createAbl = require("../abl/animal/createAbl.js");
const updateAbl = require("../abl/animal/updateAbl.js");
const getAbl = require("../abl/animal/getAbl.js");
const deleteAbl = require("../abl/animal/deleteAbl.js");
const getListAbl = require("../abl/animal/getListAbl.js");
const reactivateAbl = require("../abl/animal/reactivateAbl.js");
const deactivateAbl = require("../abl/animal/deactivateAbl.js");
const getStatsAbl = require("../abl/animal/getStatsAbl.js");


//smerujeme
router.post("/create", createAbl);
router.get("/list", getListAbl);
router.get("/stats", getStatsAbl);
router.put("/:id", updateAbl);
router.get("/:id", getAbl);
router.delete("/:id", deleteAbl);
router.patch("/:id/reactivate", reactivateAbl);
router.patch("/:id/deactivate", deactivateAbl);


module.exports = router;