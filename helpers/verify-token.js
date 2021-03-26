const jwt = require("jsonwebtoken");
const {env_vars} = require("../config/config")

module.exports = async function auth(req, res, next) {
    let token = req.header("access-token")
    if (!token) res.status(401).send({code:-1, message: "Access Denied"}) ;
    try {
        let verified = jwt.verify(token, env_vars.token_key);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send({code: -1, message: err.message || "invalid token"})
    }
}