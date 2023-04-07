const express = require("express");
const jwt = require("jsonwebtoken");


const { ExpressError } = require("../expressError.js");
const { SECRET_KEY } = require("../config.js");
const User = require("../models/user.js");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth.js")

const router = new express.Router();

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", ensureLoggedIn, async function(req, res, next) {
    try {

        const allUsers = await User.all();
        return res.json({users: allUsers});

    } catch(e) {
        return next(e);
    }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", ensureCorrectUser, async function(req, res, next) {
    try {
        const {username} = req.params;
        const curUser = await User.get(username);

        return res.json({user: curUser})

    } catch(e) {
        return next(e);
    }
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/to", ensureCorrectUser, async function(req, res, next) {
    try {
        const { username } = req.params;
        const messageTo = await User.messagesTo(username);

        return res.json({messages: messageTo});

    } catch(e) {
        return next(e);
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", ensureCorrectUser, async function(req, res, next) {
    try {
        const {username} = req.params
        const messageFrom = await User.messagesFrom(username);
        return res.json({messages: messageFrom})

    } catch(e) {
        return next(e);
    }
})


module.exports = router;
