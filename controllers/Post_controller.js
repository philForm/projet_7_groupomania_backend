const { QueryTypes } = require("sequelize");
const fs = require("fs");
const Db = require("../db/db.js");
const utf8 = require("utf8");

const { sizeOfPicture } = require("../utils/functions");

/**
 * Création d'un message :
 */
const createPost = async (req, res, next) => {

    let { body, file } = req;
    let postPicture = "";

    let sizeObj = sizeOfPicture(200000, file);

    // Création de l'URL de l'image si l'image existe et que son poids est conforme :
    if (file != undefined && sizeObj.pictureSize) {

        const name = file.filename
        postPicture = `${req.protocol}://${req.get('host')}/images/${name}`;
    }
    // Si le poids de l'image est trop élevé, on supprime l'image enregistrée par Multer du dossier images :
    else {
        if (file != undefined) {

            fs.unlink(`images/${file.filename}`, (err) => {
                if (err) throw err;
            });

        };

        postPicture = "";
    }

    // Insertion des données du nouveau post dans la BDD :
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
        console.log("pictureSize", sizeObj.pictureSize);
        console.log("postPicture", !!postPicture);
        // Si l'image existe et si son poids est trop élevé :
        // if (file != undefined && !sizeObj.pictureSize) {
        if (!!postPicture == true && sizeObj.pictureSize) {
            res.status(201).json({ message: "Message envoyé !" });
        }
        else {
            const func = async () => {
                const [postId] = await Db.query(`SELECT MAX(id) as postId FROM posts;`);
                // const postId = maxId();
                // console.log('postId', maxId());
                console.log('postId[0].postId', postId[0].postId)

                res.status(201).json({
                    message: "Message envoyé !",
                    picture: `Le poids de l'image doit être inférieur à ${sizeObj.size / 1000}k`,
                    postId: postId[0].postId
                });
            };
            func()
        }
    })
        .catch(error => res.status(500).json({ error }));
};

const maxId = async () => {
    const [postId] = await Db.query(`SELECT MAX(id) as postId FROM posts;`);
    console.log("maxId", postId[0].postId)
    return postId[0].postId;
};

/**
 * Envoie tous les messages
 */
const sendAllPosts = async (req, res, next) => {

    const [posts] = await Db.query(`
        SELECT email, user_picture, post, post_picture, posts.id, posts.user_id, posts.createdAt,
        IFNULL(B.like1, 0) AS like1, IFNULL(C.like0, 0) AS like0 
        FROM posts 
        INNER JOIN users 
        ON users.id = posts.user_id AND is_censored = 0
        LEFT OUTER JOIN
        (SELECT COUNT(*) as like1, post_id FROM likes WHERE post_like=1 GROUP BY post_id) B
        ON posts.id = B.post_id
        LEFT OUTER JOIN
        (SELECT COUNT(*) as like0, post_id FROM likes WHERE post_like=0 GROUP BY post_id) C
        ON posts.id = C.post_id
        ORDER BY posts.createdAt DESC;    `
    )
    res.send(posts);

};

/**
 * Renvoie l'Id de la requête et l'Id de la BDD
 * @param {*} req 
 * @returns {object[]}
 */
const idOfBd = async (req) => {

    // Récupération de l'id dans les paramètres de la requête
    const postId = JSON.parse(req.params.id);

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
    };
    return [result, postId];

}

/**
 * Recherche le propriétaire d'un post :
 */
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

/**
 * Modifie un Post
 */
const modifyPost = async (req, res, next) => {

    /// Tableau qui récupère les Ids renvoyés par idOfBd().
    const tab = (await idOfBd(req)).map(el => el);

    /// Id de la requête
    const postId = tab[1];
    /// Id de la BDD
    const result = tab[0];

    const userId = req.auth.userId;
    const role = req.auth.role;

    let postPicture = ""

    /// Si dans la BDD un Id correspond à l'Id de la requête, le message est modifié  :
    if (result != undefined) {

        // On sélectionne dans la BDD les éléments visés par la modification :
        const [postBDD] = await Db.query(`
            SELECT post, post_picture FROM posts 
            WHERE id = ? 
            AND (user_id = ? OR ? = 1);`,
            {
                replacements: [postId, userId, role],
                type: QueryTypes.SELECT
            }
        );

        let sizeObj = sizeOfPicture(200000, req.file);

        // Création d'un OBJET vide qui recevra les réponses :
        let resObj = {}
        // On vérifie si une image est présente dans la requête et que son poids est conforme :
        if (postBDD && req.file != undefined && sizeObj.pictureSize) {

            // Récupération du nom de l'image à partir de l'URL dans la BDD :
            const image = postBDD.post_picture.split('/images/')[1];
            // Si une image existe elle est supprimée du dossier :
            if (image) {
                // Suppression de l'ancienne image du dossier images si elle existe :
                try {
                    fs.unlink(`images/${image}`);
                } catch (err) {
                    console.log(err);
                }
            }

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

                resObj.message1 = "L'image a été modifiée !";

            })
                .catch(error => res.status(500).json({ error }));
        }
        // Si l'image existe et si son poids est trop élevé :
        else if (req.file != undefined && !sizeObj.pictureSize) {

            // On supprime l'image enregistrée par Multer du dossier images :
            fs.unlink(`images/${req.file.filename}`, (err) => {
                if (err) throw err;
            });
            resObj.picture =
                `Le poids de l'image doit être inférieur à ${sizeObj.size / 1000}k`;
        };
        // Vérification de la modification du message :
        if (postBDD && postBDD.post != req.body.post) {

            await Db.query(`
                UPDATE posts
                SET post = ?
                WHERE id = ?;`,
                {
                    replacements: [req.body.post, postId],
                    type: QueryTypes.PUT
                }
            ).then(() => {
                resObj.message2 = "Le message a été modifié !";
            })
                .catch(error => res.status(500).json({ error }));

        };
        Object.keys(resObj).length !== 0 ?
            res.status(201).json(resObj)
            :
            res.status(201).json({ message: "Aucune modification !" });
    } else
        res.status(404).json({ message: "Post introuvable !" });
}

/**
 * Supprime un Post
 */
const deletePost = async (req, res, next) => {

    /// Tableau qui récupère les Ids renvoyés par idOfBd() :
    const tab = (await idOfBd(req)).map(el => el);
    /// Id de la requête :
    const postId = tab[1];
    /// Id de la BDD :
    const result = tab[0];

    const userId = req.auth.userId;
    const role = req.auth.role;

    /// Si dans la BDD un Id correspond à l'Id de la requête, le message est supprimé.
    if (result != undefined) {
        // Sélection de l'URL de l'image à supprimer du dossier images :
        const [imageUrl] = await Db.query(`
            SELECT post_picture 
            FROM posts WHERE id = ? 
            AND (user_id = ? OR ? = 1);`,
            {
                replacements: [postId, userId, role],
                type: QueryTypes.SELECT
            }
        );

        // Vérification de l'existence de l'URL de l'image :
        if (imageUrl && imageUrl.post_picture) {
            // Récupération du nom de l'image à partir de l'URL :
            const image = imageUrl.post_picture.split('/images/')[1];
            // Suppression de l'image si elle existe :
            try {
                fs.unlink(`images/${image}`);
            } catch (err) {
                console.log(err);
            }
        }
        // Suppression du post :
        await Db.query(`
            DELETE FROM posts
            WHERE id = ? 
            AND (user_id = ? OR ? = 1);`,
            {
                replacements: [postId, userId, role],
                type: QueryTypes.DELETE
            }
        ).then(async () => {
            let [post] = await Db.query(`
                SELECT id FROM posts WHERE id = ?;`,
                {
                    replacements: [postId],
                    type: QueryTypes.SELECT
                }
            );

            if (!post)
                res.status(201).json({ message: "Message supprimé !" });
            else
                res.status(401).json({ message: "Vous n'êtes pas autorisé à supprimer ce message !" });
        })
            .catch(error => res.status(500).json({ error }));
    } else
        res.status(404).json({ message: "Post introuvable !" });

}

/**
 * like et dislike :
 */
const postLiked = async (req, res, next) => {

    const { like, postId } = req.body
    const userId = req.auth.userId

    // Si l'utilisateur est connecté :
    if (userId) {

        // Vérification que l'utilisateur n'a pas déjà liked le post :
        const [likeBdd] = await Db.query(
            `SELECT * FROM likes WHERE post_id = ? AND user_id = ?;`,
            {
                replacements: [postId, userId],
                type: QueryTypes.SELECT
            }
        );

        // Si l'utilisateur n'a pas encore liked, on enregistre son like :
        if (likeBdd == undefined) {
            await Db.query(
                `INSERT INTO likes (post_like, post_id, user_id) VALUES (?,?,?);`,
                {
                    replacements: [like, postId, userId],
                    type: QueryTypes.INSERT
                }
            );

        }
        // Si l'utilisateur a déjà liked, on observe son vôte dans la BDD :
        else {

            // Si le vôte de la BDD est différent du nouveau vôte, on modifie dans la BDD, et on met à jour le décompte des like et dislike :
            if (likeBdd.post_like.readInt8() !== like) {

                await Db.query(`
                    UPDATE likes
                    SET post_like = ?
                    WHERE id = ?;`,
                    {
                        replacements: [like, likeBdd.id],
                        type: QueryTypes.PUT
                    }
                );

            }
            // Si le vôte est identique, on supprime l'évaluation :
            else {
                await Db.query(`
                    DELETE FROM likes 
                    WHERE id = ?;`,
                    {
                        replacements: [likeBdd.id],
                        type: QueryTypes.DELETE
                    }
                );

            };
        };

        // 
        let [postLikes] = await Db.query(`
            SELECT A.post_id, IFNULL(B.like1, 0) AS like1, IFNULL(C.like0, 0) AS like0 FROM
            (SELECT ? as post_id) A
            LEFT OUTER JOIN
            (SELECT COUNT(*) as like1, post_id FROM likes WHERE post_id=? AND post_like=1) B
            ON A.post_id = B.post_id
            LEFT OUTER JOIN
            (SELECT COUNT(*) as like0, post_id FROM likes WHERE post_id=? AND post_like=0) C
            ON A.post_id = C.post_id;`,
            {
                replacements: [postId, postId, postId],
                type: QueryTypes.SELECT
            }
        );
        res.send(postLikes);
    }
    else {
        res.status(401).json({ message: "Vous n'êtes pas connecté !" });
    };
};


module.exports = { createPost, sendAllPosts, modifyPost, postUserFind, deletePost, postLiked };