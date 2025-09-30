const express = require("express");
const project = require("../controllers/Project.controller");

const router = express.Router();

router.route("/")
    .get(project.findAll)
    .post(project.create)

router.route("/:id")
    .get(project.findOne)
    .put(project.update)
    .delete(project.delete);

module.exports = router;