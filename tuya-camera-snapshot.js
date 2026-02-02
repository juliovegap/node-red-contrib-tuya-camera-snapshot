module.exports = function(RED) {
    function TuyaCameraSnapshot(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const axios = require("axios");
        const tuya = require("./lib/tuya");

        // In the event that the endopint comes empty, it will point to Central Europe endpoint
        if (!config.endpoint) config.endpoint = "https://openapi.tuyaeu.com";
        
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

                // 2. Snapshot Execution (Action)
                node.status({fill:"blue", shape:"dot", text:"Taking snapshot..."});
                const ctx = tuya.createContext(config);

                let imageUrl;
                try {
                    imageUrl = await tuya.captureImage(ctx, config.deviceId);
                    node.log(`Snapshot successfully taken: ${imageUrl}`);
                } catch (err) {
                    node.error(err.message);
                    node.status({fill:"red", shape:"dot", text:"API Error"});
                    return;
                }

                // 3. Picture Download
                node.status({fill:"yellow", shape:"ring", text:"Downloading..."});
                
                try {
                    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
                    const imageBuffer = Buffer.from(response.data);

                    // Output Initialization
                    msg.payload = imageBuffer.toString("base64"); // For dashboard or visualization
                    msg.image = imageBuffer; // Pure binary data to disk save
                    msg.fileUrl = imageUrl;  // Origin URL

                    node.send(msg);
                    node.status({fill:"green", shape:"dot", text:"OK"});
                    
                } catch (dlErr) {
                    node.error(`Picture download error: ${dlErr.message}`);
                    node.status({fill:"red", shape:"ring", text:"Dowload Error"});
                }

            } catch (err) {
                node.error("Unexpected error: " + err.message);
                node.status({fill:"red", shape:"dot", text:"Error"});
            }
        });
    }

    RED.nodes.registerType("tuya-camera-snapshot", TuyaCameraSnapshot);
};
