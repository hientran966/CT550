const express = require("express");
const file = require("../controllers/File.controller");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.route("/")
    .get(file.findAll)
    .post(upload.single("file"), file.create)

router.route("/:id")
    .get(file.findOne)
    .put(file.update)
    .delete(file.delete);

router.route("/:id/version")
    .get(file.findAllVersion)
    .post(file.addVersion);

router.route("/:id/version/:versionId")
    .get(file.findVersion)

router.route("/avatar/:id")
    .get(file.getAvatar)
    .post(upload.single("avatar"), file.uploadAvatar);

module.exports = router;