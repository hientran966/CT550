const express = require("express");
const assignment = require("../controllers/Assignment.controller");

const router = express.Router();

router.route("/")
    .get(assignment.findAll)
    .post(assignment.create)
    .delete(assignment.deleteAll);

router.route("/:id")
    .get(assignment.findOne)
    .put(assignment.update)
    .delete(assignment.delete);

router.route("/:id/report")
    .get(assignment.getReport)
    .put(assignment.report);

router.route("/task/:task")
    .get(assignment.findByTask);

module.exports = router;
