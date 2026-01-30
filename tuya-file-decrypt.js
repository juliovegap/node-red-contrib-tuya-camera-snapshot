module.exports = function(RED) {
    function TuyaFileDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const decrypt = require("./lib/decrypt");

        function buildS3URL(bucket, file, region) {
            if (!bucket || !file) {
                throw new Error("Missing bucket or file to build S3 URL");
            }

            const cleanFile = file.startsWith("/") ? file.slice(1) : file;

            // China regions uses domain .com.cn
            const isChina = region.startsWith("cn-");
            const domain = isChina ? "amazonaws.com.cn" : "amazonaws.com";

            return `https://${bucket}.s3.${region}.${domain}/${cleanFile}`;
        }

        node.on("input", async function(msg) {
            try {
                // 1. Tuya Credentials Validation
                if (!config.accessId || !config.accessKey) {
                    node.error("Tuya credentials missing: accessId or accessKey is empty");
                    return;
                }

                if (!config.deviceId) {
                    node.error("Tuya deviceId is missing");
                    return;
                }

                // Tuya context creation
                const ctx = tuya.createContext(config)

                // 2. Base64 → JSON Decoding
                let decoded;
                try {
                    if (typeof msg.payload === 'object') {
                        decoded = msg.payload; // JSON already
                    } else {
                        decoded = JSON.parse(Buffer.from(msg.payload, "base64").toString()); // Base64
                    }
                } catch (err) {
                    node.error("Invalid Base64 or JSON payload: " + err.message);
                    return;
                }

                // 3. Minimum Length Validation
                if (!decoded?.files || !Array.isArray(decoded.files) || decoded.files.length === 0) {
                    node.error("Invalid Tuya payload: missing 'files' array → " + JSON.stringify(decoded));
                    return;
                }

                const entry = decoded.files[0];
                
                if (!Array.isArray(entry) || entry.length < 2) {
                    node.error("Invalid Tuya file entry: " + JSON.stringify(entry));
                    return;
                }

                // 4. Real Parameter Extraction
                const file = entry[0];
                let key = entry[1];
                const bucket = decoded.bucket;
                const region = config.region || "eu-central-1";

                if (typeof key !== "string") {
                    key = String(key);
                }

                // AES Length Optional Validation
                if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
                    node.warn("AES key length is unusual (" + key.length + "): " + key);
                }

                // 5. S3 Direct Access Construction
                let fileURL;
                try {
                    fileURL = buildS3URL(bucket, file, region);
                } catch (err) {
                    node.error("Error building S3 URL: " + err.message);
                    return;
                }

                // 6. File Decrypt
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
                msg.region = region;
                msg.url = fileURL;

                node.send(msg);

            } catch (err) {
                node.error("Unexpected error: " + err.message);
            }
        });
    }

    RED.nodes.registerType("tuya-file-decrypt", TuyaFileDecrypt);
};
