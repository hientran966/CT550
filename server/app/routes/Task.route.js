const express = require("express");
const task = require("../controllers/Task.controller");

const router = express.Router();

router.route("/")
    .get(task.findAll)
    .post(task.create)
    .delete(task.deleteAll);

router.route("/:id")
    .get(task.findOne)
    .put(task.update)
    .delete(task.delete);

router.route("/project/:id")
    .get(task.findByProject);

router.get("/account/:id", task.findByAccountId);

module.exports = router;