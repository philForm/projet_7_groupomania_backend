const charSpecTab = {
    "à": "a",
    "á": "a",
    "â": "a",
    "ã": "a",
    "ä": "a",
    "å": "a",
    "ò": "o",
    "ó": "o",
    "ô": "o",
    "õ": "o",
    "ö": "o",
    "ø": "o",
    "è": "e",
    "é": "e",
    "ê": "e",
    "ë": "e",
    "ç": "c",
    "ì": "i",
    "í": "i",
    "î": "i",
    "ï": "i",
    "ù": "u",
    "ú": "u",
    "û": "u",
    "ü": "u",
    "ÿ": "y",
    "ñ": "n"
};
/**
 * Remplace tous les caractères avec accent dans une string
 * @param {String} txt : 
 * @returns {String} : texte sans accent 
 */
const replaceChar = (txt) => {
    var reg = /[àáäâèéêëçìíîïòóôõöøùúûüÿñ]/gi;
    return txt.replace(reg, function () {
        return charSpecTab[arguments[0].toLowerCase()];
    }).toLowerCase();
}

module.exports = replaceChar;