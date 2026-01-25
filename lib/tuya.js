const { TuyaContext } = require("tuya-connector-nodejs");

async function getFileURL(ctx, deviceId, bucket, file) {
    const res = await ctx.request({
        method: "GET",
        path: `/v1.0/devices/${deviceId}/movement-configs`,
        query: { bucket, file_path: file }
    });
    return res.result;
}
