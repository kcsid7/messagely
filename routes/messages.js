const express = require("express");
const jwt = require("jsonwebtoken");


const { ExpressError } = require("../expressError.js");
const { SECRET_KEY } = require("../config.js");
const Message = require("../models/message.js");
const { ensureLoggedIn } = require("../middleware/auth.js")

const router = new express.Router();


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:msgId", ensureLoggedIn, async function(req, res, next) {
    try {
        const curUser = req.user.username; // Get the currently logged in user from middleware
        const message = await Message.get(req.params.id);

        if (message.from_user.username !== curUser && message.to_user.username !== curUser) {
            throw new ExpressError("Not authorized user");
        }

        return res.json({message});
    } catch(e) {
        return next(e)
    }
})



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const curUser = req.user.username;
        const {to_username:toUser, body} = req.body;
        const newMessage = await Message.create({
            from_username: curUser,
            to_username: toUser,
            body: body
        })

        return res.json({ message: newMessage})

    } catch(e) {
        return next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/


router.post("/:msgId/read", ensureLoggedIn, async function(req, res, next) {
    try {

        const curUser = req.user.username;
        const { msgId } = req.params;

        const message = await Message.get(msgId);

        if (message.to_user.username !== curUser) throw new ExpressError("Unauthorized access")

        const readMessage = await Message.markRead(msgId);

        return res.json({message: readMessage});

    } catch(e) {
        return next(e)
    }
})

