const { QueryTypes } = require("sequelize");
const fs = require("fs");
const Db = require("../db/db.js");
const utf8 = require("utf8");

/**
 * Création d'un message
 */
const createPost = async (req, res, next) => {

    let { body, file } = req;
    let postPicture = "";

    console.log(`post : ${body.post}`);
    console.log(`userId : ${body.userId}`);
    console.log(`file : ${file}`);

    // Création de l'URL de l'image
    if (file != undefined) {
        console.log(`file.filename: ${file.filename}`)

        const name = file.filename
        console.log(`name : ${name}`)
        postPicture = `${req.protocol}://${req.get('host')}/images/${name}`;
    }
    else
        postPicture = "";

    await Db.query(`
            INSERT INTO posts (post, post_picture, user_id) VALUES (?,?,?);`,
        {
            replacements: [
                body.post,
                postPicture,
                body.userId
            ],
            type: QueryTypes.INSERT
        }
    ).then(() => {
        res.status(201).json({ message: "Message envoyé !" });
    })
        .catch(error => res.status(500).json({ error }));
};

/**
 * Envoie tous les messages
 */
const sendAllPosts = async (req, res, next) => {
    // const [posts] = await Db.query(`
    //     SELECT post, post_picture, user_id, createdAt
    //     FROM posts WHERE is_censored = 0
    //     ORDER BY createdAt DESC;
    //     `
    // );

    const [posts2] = await Db.query(`
        SELECT email, user_picture, post, post_picture, posts.id, posts.user_id, posts.createdAt 
        FROM users 
        INNER JOIN posts 
        WHERE users.id = posts.user_id AND is_censored = 0
        ORDER BY posts.createdAt DESC;
        `
    )
    console.log(posts2);
    res.send(posts2);

};

/**
 * Renvoie l'Id de la requête et l'Id de la BDD
 * @param {*} req 
 * @returns {}
 */
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
    console.log(`result : ${result}`)

    // const { post, postPicture } = await req.body;
    const { post } = await req.body;
    const postPicture = ""
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
        // Sélection de l'URL de l'image à supprimer du dossier images :
        const [imageUrl] = await Db.query(`
            SELECT post_picture FROM posts WHERE id = ?;`,
            {
                replacements: [postId],
                type: QueryTypes.SELECT
            }
        )
        console.log(imageUrl)
        // Vérification de l'existence de l'URL de l'image :
        if (imageUrl.post_picture) {

            // Récupération du nom de l'image à partir de l'URL :
            const image = imageUrl.post_picture.split('/images/')[1];
            // Suppression de l'image :
            fs.unlink(`images/${image}`, (err) => {
                if (err) throw err;
                console.log(`Image du post ${postId} supprimée !`);
            });
        }
        // Suppression du post :
        await Db.query(`
            DELETE FROM posts
            WHERE id = ?;`,
            {
                replacements: [postId],
                type: QueryTypes.DELETE
            }
        ).then(() => {
            res.status(201).json({ message: "Message supprimé !" });
        })
            .catch(error => res.status(500).json({ error }));
    } else
        res.status(404).json({ message: "Post introuvable !" });




}


module.exports = { createPost, sendAllPosts, modifyPost, deletePost };