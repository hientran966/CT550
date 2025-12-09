const express = require("express");
const logs = require("../controllers/Activity.controller");

const router = express.Router();

router.route("/")
    .get(logs.findAll)
    .post(logs.create)

router.route("/:id")
    .get(logs.findOne)
    .put(logs.update)
    .delete(logs.delete);

module.exports = router;