const { QueryTypes } = require("sequelize");
const fs = require("fs");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const securePassword = require('../utils/secure_password')

const Db = require("../db/db.js");

const avatarImg = "avatars/avatar-anonyme.png";

// sélectionne tous les utilisateurs dans la BDD
const getAllUsers = async (req, res, next) => {
    const [users] = await Db.query("SELECT * FROM users");
    if (users)
        res.send(users);
    else
        res.status(404).json({ message: "Aucun utilisateur" });

};

/**
 * Sélectionne UN utilisateur dans la BDD avec son ID
 */
const getOneUser = async (req, res, next) => {
    const reqId = req.params.id

    const [user] = await Db.query("SELECT * FROM users WHERE id = ?",
        {
            replacements: [reqId],
            type: QueryTypes.SELECT,
        }
    );

    if (user)
        res.send(user);
    else
        res.status(404).json({ message: "L'utilisateur n'existe pas !" });

};

/**
 * Enregistrement d'un utilisateur
 */
const signupUser = async (req, res, next) => {
    console.log(req.body)
    // Destructuration du corps de la requête :
    const { firstname, lastname, email, picture } = await req.body;

    // Vérification de la complexité du mot de passe :
    if (securePassword(req.body.password)) {
        // Hachage du mot de passe
        const hash = await bcrypt.hash(req.body.password, 10);
        // Recherche d'un doublon de l'email dans la base de données :
        const emailsDb = await Db.query(
            `SELECT email FROM users WHERE email = ?`,
            {
                replacements: [email],
                type: QueryTypes.SELECT
            }
        );

        // Renvoie 'true' si la condition est vérifiée :
        const [tab] = emailsDb.map(el => el.email === email);

        // Avatar anonyme :
        let avatar = `${req.protocol}://${req.get('host')}/images/${avatarImg}`;


        console.log(tab)
        // Création de l'utilisateur si son email est unique :
        if (!tab) {

            Db.query(`
                    INSERT INTO users (firstname, lastname, pass_word, email, user_picture) VALUES (?,?,?,?,?);`,
                {
                    replacements: [firstname, lastname, hash, email, avatar],
                    type: QueryTypes.INSERT
                }
            ).then(() => {
                res.status(201).json({ message: "Utilisateur créé !" });
            })
                .catch(error => res.status(500).json({ error }));
        } else {
            console.log("l'email existe déjà !")
            res.status(200).json({ message: "L'email existe déjà !" });
        }
    } else {
        res.status(200).json({
            message2: {
                pass: "Le mot de passe n'est pas assez sécurisé !",
                pass2: "Entrez au minimum 10 caractères, des minuscules, majuscules, des chiffres, et des caractères spéciaux !"
            }
        });
    };


};

/**
 * Ajout d'un avatar à l'utilisateur
 */
const addUserAvatar = async (req, res, next) => {

    console.log("========== req.file")
    console.log(req)

    // Si une image est envoyée avec la requête :
    if (req.file != undefined) {
        // On vérifie si l'utilisateur a déjà un avatar :
        let [picture] = await Db.query(`
                SELECT user_picture 
                FROM users
                WHERE id = ?`,
            {
                replacements: [req.params.id],
                type: QueryTypes.SELECT
            }
        );
        // Si un avatar est présent dans la BDD, on le supprime :
        if (picture.user_picture !== "") {
            // Récupération du nom de l'image à partir de l'URL dans la BDD :
            const avatar = picture.user_picture.split('/images/')[1];
            // Suppression de l'ancienne image du dossier images :
            if (avatar != avatarImg) {
                fs.unlink(`images/${avatar}`, (err) => {
                    if (err) throw err;
                    console.log(`Avatar ${avatar} supprimée de la BDD!`);
                });
            }

        }
        // Envoi de l'URL du nouvel avatar dans la BDD :
        const userAvatar = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        await Db.query(`
            UPDATE users
            SET user_picture = ?
            WHERE id=?;`,
            {
                replacements: [userAvatar, req.params.id],
                type: QueryTypes.UPDATE
            }
        ).then(() => {
            res.status(201).json({ message: "L'avatar de l'utilisateur est créé !" });
        })
            .catch(error => res.status(500).json({ error }));
    }
    else
        console.log("Pas de mise à jour possible !")
}

/**
 * Authentifie un utilisateur
 */
const loginUser = async (req, res, next) => {

    let valid = false;

    // Recherche dans le BDD un utilisateur par son email
    const [user] = await Db.query(
        'SELECT `id`, `email`, `pass_word`, `user_role` FROM `users` WHERE `users`.`email` = ?',
        {
            replacements: [req.body.email],
            type: QueryTypes.SELECT
        }
    );

    // Comparaison entre l'email de la requête et celui présent dans la BDD
    if (!user || user.email != req.body.email) {
        res.status(401).json({ message: "Email incorrect !" });
        return;
    };
    // Comparaison entre le mot de passe de la requête et celui présent dans la BDD
    if (user) {
        valid = await bcrypt.compare(req.body.password, user.pass_word);
        console.log(valid);
        if (!valid) {
            res.status(401).json({ message: "Mot de passe incorrect !" });
            return;
        }
    };
    // Si tout est ok, envoi de la réponse : id et token
    res.status(200).json({
        userId: user.id,
        user_role: user.user_role,
        token: jwt.sign(
            {
                userId: user.id,
                user_role: user.user_role
            },
            process.env.WEB_TOKEN,
            { expiresIn: "24h" }
        )
    });
}


module.exports = { getAllUsers, getOneUser, signupUser, addUserAvatar, loginUser };

