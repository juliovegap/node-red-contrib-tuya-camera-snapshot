module.exports = function(RED) {
    function TuyaFileDecrypt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const decrypt = require("./lib/decrypt");
        const tuya = require("./lib/tuya");

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

                const ctx = tuya.createContext(config);

                // 2. Base64 → JSON Decoding
                let key = "";
                let decoded;
                try {
                    if (typeof msg.payload === 'object') {
                        decoded = msg.payload; // JSON already
                    } else {
                        decoded = JSON.parse(Buffer.from(msg.payload, "base64").toString()); // Base64
                    }

                    // Tuya standar structure key check
                    if (decoded && decoded.files && Array.isArray(decoded.files) && decoded.files.length > 0) {
                         // Fromat: files: [ ["path", "KEY"] ]
                         key = decoded.files[0][1];
                    } else if (typeof decoded === 'object' && decoded.local_key) {
                         // Alternative support if local_key is manually set
                         key = decoded.local_key;
                    }
                } catch (err) {
                    node.error("Key cannot be automatically extracted: " + err.message);
                    return;
                }

                // Convert key to a string
                key = String(key)
                
                // 3. Recent URL search
                node.status({fill:"blue", shape:"dot", text:"Logs check..."});
                
                let fileUrls = [];
                try {
                    fileUrls = await tuya.getRecentFiles(ctx, config.deviceId);
                    node.log(`There was found ${fileUrls.length} recent images.`);
                } catch (err) {
                    node.status({fill:"red", shape:"ring", text:"Error API Tuya"});
                    node.error(err.message);
                    return;
                }
                
                // 4. Each Picture Process
                let successCount = 0;
                
                for (let i = 0; i < fileUrls.length; i++) {
                    const url = fileUrls[i];
                    node.status({fill:"yellow", shape:"ring", text:`Download ${i+1}/${fileUrls.length}...`});

                    try {
                        const decryptedBuffer = await decrypt.decryptFile(url, key);
                        
                        // Just message clone to manage several pictures output
                        let newMsg = RED.util.cloneMessage(msg);
                        
                        newMsg.payload = decryptedBuffer.toString("base64"); // Dashboard Base64 picture
                        newMsg.image = decryptedBuffer; // Disk write binary buffer
                        newMsg.fileUrl = url;
                        newMsg.imageIndex = i + 1;
                        newMsg.totalImages = fileUrls.length;
                        
                        // Send individual messages
                        node.send(newMsg);
                        successCount++;
                        
                    } catch (decryptErr) {
                        node.warn(`Error processsing imagen ${i+1}: ${decryptErr.message}`);
                        // Don't return yet. Let's try another picture
                    }
                }

                if (successCount > 0) {
                    node.status({fill:"green", shape:"dot", text:`Success (${successCount}/${fileUrls.length})`});
                } else {
                    node.status({fill:"red", shape:"dot", text:"Total fail"});
                }

            } catch (err) {
                node.error("Unexpected error: " + err.message);
                node.status({fill:"red", shape:"dot", text:"Error"});
            }
        });
    }

    RED.nodes.registerType("tuya-file-decrypt", TuyaFileDecrypt);
};
