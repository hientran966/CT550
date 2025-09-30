const express = require("express");
const member = require("../controllers/Member.controller");

const router = express.Router();

router.route("/")
    .get(member.findAll)
    .post(member.create)

router.route("/:id")
    .get(member.findOne)
    .put(member.update)
    .delete(member.delete);

module.exports = router;