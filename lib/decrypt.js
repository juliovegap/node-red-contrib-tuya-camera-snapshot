const CryptoJS = require("crypto-js");

function decryptAES(buffer, key, iv) {
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    const keyWA = CryptoJS.enc.Utf8.parse(key);
    const ivWA = CryptoJS.lib.WordArray.create(iv);

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: wordArray },
        keyWA,
        { iv: ivWA, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    return Buffer.from(decrypted.toString(CryptoJS.enc.Hex), "hex");
}
