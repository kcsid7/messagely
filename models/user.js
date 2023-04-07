/** User class for message.ly */
const bcrypt = require("bcrypt");

const db = require("../db.js");
const { ExpressError } = require("../expressError.js");

const { BCRYPT_WORK_FACTOR:workFactor } = require("../config.js");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    try {
      const hashPw = await bcrypt.hash(password, workFactor);
      const data = await db.query(`
          INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
          VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
          RETURNING username, password, first_name, last_name, phone
          `, [username, hashPw, first_name, last_name, phone])
      
      return data.rows[0];
    } catch(e) {
      throw new Error(e);
    }
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const data = await db.query(`SELECT username, password FROM users
                                  WHERE username = $1`, [username]);
    if (data.rows[0] !== undefined) {
      return bcrypt.compare(password, data.rows[0].password)
    } else {
      return false
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 

    const updatedUser = await db.query(`UPDATE users SET last_login_at = current_timestamp
                                          WHERE username = $1 RETURNING username`, [username]);
    if (updatedUser.rows[0] === undefined) throw new ExpressError(`User ${username} not found`, 404);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const data = db.query(`SELECT username, first_name, last_name, phone FROM users ORDER BY last_name`);
    return data.rows
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const data = db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
                              FROM users WHERE username = $1`, [username]);
    if (data.rows[0] === undefined) throw new ExpressError(`User ${username} not found`, 404);

    return data.rows[0]
              
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const data = await db.query(`
                  SELECT  m.id,
                          m.to_username AS toUser,
                          m.sent_at AS sent,
                          m.read_at AS read,
                          m.body,
                          u.first_name AS firstName,
                          u.last_name AS lastName,
                          u.phone
                  FROM messages AS m
                  JOIN users AS u
                  ON messages.to_username = users.username 
                  WHERE messages.from_username = $1
                  `, [username])

    const messages = data.rows.map( d => ({
      id: d.id,
      body: d.body,
      sent_at: d.sent,
      read_at: d.read,
      to_users: {
        username: d.toUser,
        phone: d.phone,
        first_name: d.firstName,
        last_name: d.lastName
      }
    }))

    return messages;

  } 

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const data = await db.query(`
                  SELECT  m.id,
                          m.from_username AS fromUser,
                          m.sent_at AS sent,
                          m.read_at AS read,
                          m.body,
                          u.first_name AS firstName,
                          u.last_name AS lastName,
                          u.phone
                  FROM messages AS m
                  JOIN users AS u
                  ON messages.from_username = users.username 
                  WHERE messages.to_username = $1
                  `, [username])

    const messages = data.rows.map( d => ({
      id: d.id,
      body: d.body,
      sent_at: d.sent,
      read_at: d.read,
      to_users: {
        username: d.toUser,
        phone: d.phone,
        first_name: d.firstName,
        last_name: d.lastName
      }
    }))

    return messages;
  }
}


module.exports = User;