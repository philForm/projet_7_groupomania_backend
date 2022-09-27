const { QueryTypes } = require("sequelize");
const Db = require("../db/db.js")


// Création d'un message
const createPost = async (req, res, next) => {
    console.log(req.body);
    const { post, postPicture, userId } = await req.body;

    Db.query(`
            INSERT INTO posts (post, post_picture, user_id) VALUES (?,?,?);`,
        {
            replacements: [post, postPicture, userId],
            type: QueryTypes.INSERT
        }
    ).then(() => {
        res.status(201).json({ message: "Message envoyé !" });
    })
        .catch(error => res.status(500).json({ error }));
};


module.exports = { createPost };