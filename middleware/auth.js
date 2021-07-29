"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware with the purpose of ensuring a 
 * user is logged in and that they are an Admin.
 * 
 * If either of the conditions are not meet then
 * this function will throw an UnauthorizedError()
 */
function ensureLoggedInAndAdmin(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    if (!res.locals.user.isAdmin) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware with the purpose of determining if a
 * user is either an admin or their username matches
 * the username parameter passed through the request.
 * Also if their is not a logged in user making the request
 * this function throws an UnauthorizedError(). The same error
 * is also thrown if the user is not an admin or not 
 * the same user.
 */
function sameOrAdmin(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    if ((res.locals.user.username !== req.params.username) && !res.locals.user.isAdmin) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureLoggedInAndAdmin,
  sameOrAdmin,
};
