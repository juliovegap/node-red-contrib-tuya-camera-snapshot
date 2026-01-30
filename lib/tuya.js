const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

function createContext(config) {
    return new TuyaContext({
        baseUrl: config.endpoint,
        accessKey: config.accessId,
        secretKey: config.accessKey
    });
}

async function getFileURL(ctx, deviceId, bucket, file) {
    // URL Encoding on file
    const path = `/v1.0/devices/${deviceId}/movement-configs?bucket=${bucket}&file_path=${file}`;

    // Optional Log to check URL final query
    // console.log("Tuya request path:", path);

    const res = await ctx.request({
        method: "GET",
        path
    });

    return res.result;
}

module.exports = { createContext, getFileURL };
