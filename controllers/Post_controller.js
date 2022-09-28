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

// Envoie tous les messages
const sendAllPosts = async (req, res, next) => {
    const [posts] = await Db.query(`
        SELECT post, post_picture, user_id, createdAt
        FROM posts WHERE is_censored = 0
        ORDER BY createdAt DESC;
        `
    );
    console.log(posts);
    res.send(posts);

};

const modifyPost = async (req, res, next) => {
    // Récupération de l'id dans paramètres
    const postId = JSON.parse(req.params.id);
    // Sélection dans la BDD du post ayant le même id que la requête.
    let fin = await Db.query(
        `SELECT id FROM posts WHERE id = ?;`,
        {
            replacements: [postId],
            type: QueryTypes.SELECT
        }
    );
    
    let result
    for (let prop in fin) {
        result = fin[prop].id
        console.log(`result into : ${result}`)
    };
    console.log(`result out : ${result}`)

    const { post, postPicture } = await req.body;
    console.log(req.body.post);
    
    if (result != undefined) {

        await Db.query(`
            UPDATE posts
            SET post = ?, post_picture = ?
            WHERE id = ?;`,
            {
                replacements: [post, postPicture, postId],
                type: QueryTypes.PUT
            }
        ).then(() => {
            res.status(201).json({ message: "Message modifié !" });
        })
            .catch(error => res.status(500).json({ error }));
    }
        // res.send(500).json({message: "Post introuvable !"});

}


module.exports = { createPost, sendAllPosts, modifyPost };