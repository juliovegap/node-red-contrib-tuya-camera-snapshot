module.exports = function(RED) {
    function TuyaFileDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const axios = require("axios");
        const CryptoJS = require("crypto-js");
        const { TuyaContext } = require("tuya-connector-nodejs");

        const ctx = new TuyaContext({
            baseUrl: config.endpoint,
            accessKey: config.accessKey,
            accessId: config.accessId
        });

        node.on("input", async function(msg) {
            try {
                const decoded = JSON.parse(
                    Buffer.from(msg.payload, "base64").toString()
                );

                const bucket = decoded.bucket;
                const file = decoded.files[0][0];
                const key = decoded.files[0][1];

                const fileURL = await ctx.request({
                    method: "GET",
                    path: `/v1.0/devices/${config.deviceId}/movement-configs`,
                    query: { bucket, file_path: file }
                });

                const url = fileURL.result;
                const fileData = (await axios.get(url, { responseType: "arraybuffer" })).data;

                const version = fileData.readInt32LE(0);
                const iv = fileData.slice(4, 20);
                const encrypted = fileData.slice(64);

                const decrypted = decryptAES(encrypted, key, iv);

                msg.payload = decrypted.toString("base64");
                msg.image = decrypted;

                node.send(msg);

            } catch (err) {
                node.error("Error decrypting Tuya file: " + err.message);
            }
        });

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
    }

    RED.nodes.registerType("tuya-file-decrypt", TuyaFileDecrypt);
};
