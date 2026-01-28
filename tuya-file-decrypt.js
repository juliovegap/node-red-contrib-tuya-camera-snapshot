module.exports = function(RED) {
    function TuyaFileDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const decrypt = require("./lib/decrypt");
        const tuya = require("./lib/tuya");

        // Tuya context creation
        const ctx = tuya.createContext(config);

        node.on("input", async function(msg) {
            try {
                // 1. Base64 → JSON Decoding
                let decoded;
                try {
                    decoded = JSON.parse(
                        Buffer.from(msg.payload, "base64").toString()
                    );
                } catch (err) {
                    node.error("Invalid Base64 or JSON payload: " + err.message);
                    return;
                }

                // 2. Minimum Length Validation
                if (!decoded?.files || !Array.isArray(decoded.files) || decoded.files.length === 0) {
                    node.error("Invalid Tuya payload: missing 'files' array → " + JSON.stringify(decoded));
                    return;
                }

                const entry = decoded.files[0];
                
                if (!Array.isArray(entry) || entry.length < 2) {
                    node.error("Invalid Tuya file entry: " + JSON.stringify(entry));
                    return;
                }

                // 3. Real Parameter Extraction
                const file = entry[0];
                let key = entry[1];
                const bucket = decoded.bucket;

                // Double Check Key String Type
                if (typeof key !== "string") {
                    key = String(key);
                }

                // AES Length Optional Validation
                if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
                    node.warn("AES key length is unusual (" + key.length + "): " + key);
                }

                // 4. Get real URL from Tuya Archive
                let fileURL;
                try {
                    fileURL = await tuya.getFileURL(ctx, config.deviceId, bucket, file);
                } catch (err) {
                    node.error("Error fetching file URL from Tuya: " + err.message);
                    return;
                }

                // 5. File Decrypt
                let decrypted;
                try {
                    decrypted = await decrypt.decryptFile(fileURL, key);
                } catch (err) {
                    node.error("Error decrypting file: " + err.message);
                    return;
                }

                // 6. Final Output
                msg.payload = decrypted.toString("base64");
                msg.image = decrypted;
                msg.file = file;
                msg.bucket = bucket;
                
                node.send(msg);

            } catch (err) {
                node.error("Unexpected error: " + err.message);
            }
        });
    }

    RED.nodes.registerType("tuya-file-decrypt", TuyaFileDecrypt);
};
