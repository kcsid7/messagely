const express = require("express");
const jwt = require("jsonwebtoken");


const { ExpressError } = require("../expressError.js");
const { SECRET_KEY } = require("../config.js");
const User = require("../models/user.js");

const router = new express.Router();



/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function(req, res, next) {
    try {
        // Try to authenticate using the User.authenticate method
        // If user is able to authenticate, then update login token and last login date
        // Else throw an error
        const {username, password} = req.body;

        if (!(await User.authenticate(username, password))) throw new ExpressError("Invalid username password combination")

        User.updateLoginTimestamp(username);
        let token = jwt.sign({username}, SECRET_KEY);
        return res.json({token})

    } catch(e) {
        return next(e);
    }
})




/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function(req, res, next) {
    try {
        const newUser = await User.register(req.body);
        User.updateLoginTimestamp(newUser.username);
        let token = jwt.sign(newUser.username, SECRET_KEY)
        return res.json({token})

    } catch(e) {
        return next(e);
    }
})


module.exports = router;