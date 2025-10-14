const express = require("express");
const notifications = require("../controllers/Notification.controller");

const router = express.Router();

router.route("/")
    .get(notifications.findAll)
    .post(notifications.create)

router.route("/:id")
    .get(notifications.findOne)
    .put(notifications.update)
    .delete(notifications.delete);

router.patch("/:id/read", notifications.markAsRead);
router.patch("/recipient/:recipient_id/read-all", notifications.markAllAsRead);

module.exports = router;