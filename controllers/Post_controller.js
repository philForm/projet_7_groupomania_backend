const { QueryTypes } = require("sequelize");
const fs = require("fs")
const Db = require("../db/db.js")

// Création d'un message
const createPost = async (req, res, next) => {
    // console.log(req.body);
    // const { post, postPicture, userId } = await req.body;
    const { post, userId } = await req.body;
    let postPicture
    if (req.file.filename)
        postPicture = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    await Db.query(`
            INSERT INTO posts (post, post_picture, user_id) VALUES (?,?,?);`,
        {
            replacements: [
                post,
                postPicture,
                userId
            ],
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

// Renvoie l'Id de la requête et l'Id de la BDD
const idOfBd = async (req) => {
    // Récupération de l'id dans les paramètres de la requête
    const postId = JSON.parse(req.params.id);
    console.log(`postId into idOfBd : ${postId}`)

    // Sélection dans la BDD du post ayant le même id que la requête.
    let idIntoBdd = await Db.query(
        `SELECT id FROM posts WHERE id = ?;`,
        {
            replacements: [postId],
            type: QueryTypes.SELECT
        }
    );

    let result
    for (let item in idIntoBdd) {
        result = idIntoBdd[item].id
        console.log(`result into : ${result}`)
    };
    console.log(`result out : ${result}`);
    return [result, postId];

}

/// Modifie un Post
const modifyPost = async (req, res, next) => {

    /// Tableau qui récupère les Ids renvoyés par idOfBd().
    const tab = (await idOfBd(req)).map(el => el);
    // console.log(`tab : ${tab}`);
    /// Id de la requête
    const postId = tab[1];
    console.log(`postId : ${postId}`)
    /// Id de la BDD
    const result = tab[0];

    const { post, postPicture } = await req.body;
    console.log(req.body.post);

    /// Si dans la BDD un Id correspond à l'Id de la requête, le message est modifié
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
    } else
        res.status(404).json({ message: "Post introuvable !" });
}

// Supprime un Post
const deletePost = async (req, res, next) => {

    /// Tableau qui récupère les Ids renvoyés par idOfBd().
    const tab = (await idOfBd(req)).map(el => el);
    /// Id de la requête
    const postId = tab[1];
    /// Id de la BDD
    const result = tab[0];

    /// Si dans la BDD un Id correspond à l'Id de la requête, le message est supprimé.
    if (result != undefined) {

        await Db.query(`
            DELETE FROM posts
            WHERE id = ?;`,
            {
                replacements: [postId],
                type: QueryTypes.PUT
            }
        ).then(() => {
            res.status(201).json({ message: "Message supprimé !" });
        })
            .catch(error => res.status(500).json({ error }));
    } else
        res.status(404).json({ message: "Post introuvable !" });




}


module.exports = { createPost, sendAllPosts, modifyPost, deletePost };