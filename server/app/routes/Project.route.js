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

router.route("/:id/member")
    .get(project.getMember)
    .post(project.addMember);

router.route("/account/:id")
    .get(project.findByAccountId)

module.exports = router;