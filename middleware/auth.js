const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();


module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(
            token,
            process.env.WEB_TOKEN
        );

        const userId = decodedToken.userId;
        const role = decodedToken.user_role.data[0];
        req.auth = { userId, role };

        if ((req.body.userId && (req.body.userId !== userId))) {
            throw "User Id non valable !";
        } else {
            next();
        }
    } catch (error) {
        res.status(401).json({ error: error | "Requête non authentifiée !" });
    }
};

