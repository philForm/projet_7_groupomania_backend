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
 * @returns {object[]}
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

// Recherche le propriétaire d'un post :
const postUserFind = async (req, res, next) => {
    const [user] = await Db.query(`
        SELECT user_id FROM posts WHERE id = ?`,
        {
            replacements: [req.params.id],
            type: QueryTypes.SELECT
        }
    );
    res.status(200).json({
        userId: user.user_id
    })
};

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

    const { post } = await req.body;
    let postPicture = ""
    console.log(req.body.post);

    /// Si dans la BDD un Id correspond à l'Id de la requête, le message est modifié  :
    if (result != undefined) {

        // On sélectionne dans la BDD les éléments visés par la modification :
        const [postBDD] = await Db.query(`
            SELECT post, post_picture FROM posts WHERE id=?;`,
            {
                replacements: [postId],
                type: QueryTypes.SELECT
            }
        );
        // On vérifie si une image est présente dans la requête :
        if (req.file != undefined) {
            console.log("l'image existe");
            // ------------------------------------------
            // Récupération du nom de l'image à partir de l'URL dans la BDD :
            const image = postBDD.post_picture.split('/images/')[1];
            // Si une image existe elle est supprimée du dossier :
            if (image) {
                // Suppression de l'ancienne image du dossier images :
                fs.unlink(`images/${image}`, (err) => {
                    if (err) throw err;
                    console.log(`Image ${image} supprimée de la BDD!`);
                });
            }
            // ------------------------------------------
            // Envoi de l'URL de la nouvelle image dans la BDD :
            postPicture = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
            await Db.query(`
                UPDATE posts
                SET post_picture = ?
                WHERE id = ?;`,
                {
                    replacements: [postPicture, postId],
                    type: QueryTypes.PUT
                }
            ).then(() => {
                res.status(201).json({ message: "L'image a été modifiée !" });
            })
                .catch(error => res.status(500).json({ error }));
        }
        // Vérification de la modification du messsage :
        if (postBDD.post != req.body.post) {
            console.log("post modifié !")

            await Db.query(`
                UPDATE posts
                SET post = ?
                WHERE id = ?;`,
                {
                    replacements: [req.body.post, postId],
                    type: QueryTypes.PUT
                }
            ).then(() => {
                res.status(201).json({ message: "Le message a été modifié !" });
            })
                .catch(error => res.status(500).json({ error }));

        };

        console.log('--------------------- postBDD.post')
        console.log(postBDD.post)

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
        await Db.query(`,  
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

};

const postLiked = async (req, res, next) => {

    console.log("============== req.body");
    console.log(req.body);
    const { like, userId } = req.body
    console.log("============== req.params");
    console.log(req.params);
    console.log("============== req.auth dans postLiked")
    console.log(req.auth)
    const postId = parseInt(req.params.id)

    // Vérification que l'utilisateur n'a pas déjà liked le post :
    const [likeBdd] = await Db.query(
        `SELECT * FROM likes WHERE post_id=? AND user_id=?;`,
        {
            replacements: [postId, userId],
            type: QueryTypes.SELECT
        }
    );
    console.log("=========== likeBdd")
    console.log(likeBdd)

    // Si l'utilisateur n'a pas encore liked, on enregistre son like :
    if (likeBdd == undefined) {
        await Db.query(
            `INSERT INTO likes (post_like, post_id, user_id) VALUES (?,?,?);`,
            {
                replacements: [like, postId, userId],
                type: QueryTypes.INSERT
            }
        );
        countLike(like, postId, res);
    }
    // Si l'utilisateur a déjà liked, on observe son vôte dans la BDD :
    else {
        console.log("*****************")
        console.log(likeBdd.post_like.readInt8())
        // Si le vôte de la BDD est différent du nouveau vôte, on modifie dans la BDD, et on met à jour le décompte des like et dislike :
        if (likeBdd.post_like.readInt8() !== like) {
            console.log("vote différent !!!!")
            await Db.query(`
                UPDATE likes
                SET post_like = ?
                WHERE user_id = ? AND post_id = ?;`,
                {
                    replacements: [like, userId, postId],
                    type: QueryTypes.INSERT
                }
            );

            countLike(like, postId, res);
            // countLike(1, postId, res);

        }
        // Si le vôte est identique, on supprime l'évaluation :
        else {
            await Db.query(`
                DELETE FROM likes 
                WHERE user_id = ? AND post_id = ?;`,
                {
                    replacements: [userId, postId],
                    type: QueryTypes.INSERT
                }
            );

        };
    };
};

/**
 * Compte les like identiques pour un post :
 */
const countLike = async (like, postId, res) => {
    let [count] = await Db.query(`
        SELECT COUNT(*) FROM likes 
        WHERE post_like=? AND post_id=?;`,
        {
            replacements: [like, postId],
            type: QueryTypes.SELECT
        }
    );

    res.send({ count, like, postId });
};


module.exports = { createPost, sendAllPosts, modifyPost, deletePost, postUserFind, postLiked };