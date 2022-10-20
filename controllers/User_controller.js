const { QueryTypes } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Db = require("../db/db.js");

// selectionne tous les utilisateurs dans la BDD
const getAllUsers = async (req, res, next) => {
    const [users] = await Db.query("SELECT * FROM users");
    if (users)
        res.send(users);
    else
        res.status(404).json({ message: "Aucun utilisateur" });

};

// selectionne UN utilisateur dans la BDD avec son ID
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

// Enregistrement d'un utilisateur
const signupUser = async (req, res, next) => {
    console.log(req.body)
    // Destructuration du corps de la requête
    const { firstname, lastname, email, picture } = await req.body;
    // Hachage du mot de passe
    const hash = await bcrypt.hash(req.body.password, 10);
    // Recherche d'un doublon de l'email dans la base de données
    const emailsDb = await Db.query(
        `SELECT email FROM users WHERE email = ?`,
        {
            replacements: [email],
            type: QueryTypes.SELECT
        }
    );
    // Renvoie 'true' si la condition est vérifiée
    const [tab] = emailsDb.map(el => el.email === email)

    console.log(tab)
    // Création de l'utilisateur si son email est unique 
    if (!tab) {

        Db.query(`
                INSERT INTO users (firstname, lastname, pass_word, email, user_picture) VALUES (?,?,?,?,?);`,
            {
                replacements: [firstname, lastname, hash, email, picture],
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

};

// Authentifie un utilisateur
const loginUser = async (req, res, next) => {

    let valid = false;

    // Recherche dans le BDD un utilisateur par son email
    const [user] = await Db.query(
        'SELECT `id`, `email`, `pass_word` FROM `users` WHERE `users`.`email` = ?',
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
        token: jwt.sign(
            { userId: user.id },
            process.env.WEB_TOKEN,
            { expiresIn: "24h" }
        )
    });
}


module.exports = { getAllUsers, getOneUser, signupUser, loginUser };

