const express = require("express");
const contact = require("../controllers/Contact.controller");

const router = express.Router();

router.route("/")
    .get(contact.findAll)
    .post(contact.create)
    .delete(contact.deleteAll);

router.route("/:id")
    .get(contact.findOne)
    .put(contact.update)
    .delete(contact.delete);

module.exports = router;