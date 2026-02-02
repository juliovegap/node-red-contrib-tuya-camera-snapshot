const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

function createContext(config) {
    return new TuyaContext({
        baseUrl: config.endpoint,
        accessKey: config.accessId,
        secretKey: config.accessKey
    });
}

/**
 * Tuya Open Camera Service API
 * API: POST /v1.0/cameras/{device_id}/actions/capture
 */
async function captureImage(ctx, deviceId) {
    const path = `/v1.0/cameras/${deviceId}/actions/capture`;
    
    // console.log(`[Tuya] Performing snapshot: POST ${path}`);

    try {
        const res = await ctx.request({
            method: "POST",
            path: path,
            body: {} // Empty body to perform this action
        });

        // Typical response is: { result: "https://..." } o { result: { url: "..." } }
        if (typeof res.result === 'string') {
            return res.result;
        } else if (res.result && res.result.url) {
            return res.result.url;
        } else {
            // If the received structure is different, an error will be raised
            throw new Error(`Unexpected API response: ${JSON.stringify(res)}`);
        }

    } catch (err) {
        throw new Error(`captureImage error: ${err.message}`);
    }
}

module.exports = { createContext, captureImage };
