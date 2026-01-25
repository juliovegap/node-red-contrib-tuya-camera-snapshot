module.exports = function(RED) {
    function TuyaFileDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const decrypt = require("./lib/decrypt");
        const tuya = require("./lib/tuya");

        const ctx = tuya.createContext(config);

        node.on("input", async function(msg) {
            try {
                const decoded = JSON.parse(
                    Buffer.from(msg.payload, "base64").toString()
                );

                const bucket = decoded.bucket;
                const file = decoded.files[0][0];
                const key = decoded.files[0][1];

                const url = await tuya.getFileURL(ctx, config.deviceId, bucket, file);
                const decrypted = await decrypt.decryptFile(url, key);

                msg.payload = decrypted.toString("base64");
                msg.image = decrypted;

                node.send(msg);

            } catch (err) {
                node.error("Error decrypting Tuya file: " + err.message);
            }
        });
    }

    RED.nodes.registerType("tuya-file-decrypt", TuyaFileDecrypt);
};
