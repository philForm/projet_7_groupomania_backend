/**
 * Teste la complexité du mot de passe
 * @param {String} password : mot de passe entré par l'utilisateur.
 * @returns {boolean}
 */
const securePassword = (password) => {

    // min 10 caractères
    if (password.length < 10) {
        return false;
    }

    // majuscules
    if (!/[A-Z]/.test(password)) {
        return false;
    }

    // minuscules
    if (!/[a-z]/.test(password)) {
        return false;
    }

    // chiffres
    if (!/[0-9]/.test(password)) {
        return false;
    }

    // special chars
    if (!/[!@#$%\^&\*\(\)]/.test(password)) {
        return false;
    }
    return true
};

module.exports = securePassword;