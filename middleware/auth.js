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
        console.log('=============== userId')
        console.log(userId)
        req.auth = { userId };
        console.log('=============== req.auth');
        console.log(req.auth);
        const { post } = req;
        console.log('=============== req.body.userId');
        console.log(req.body.userId)

        if ((req.body.userId && (req.body.userId !== userId))) {
            throw "User Id non valable !";
        } else {
            // res.status(201).json({ 'userId': userId })
            next();
        }
    } catch (error) {
        res.status(401).json({ error: error | "Requête non authentifiée !" });
    }
};

