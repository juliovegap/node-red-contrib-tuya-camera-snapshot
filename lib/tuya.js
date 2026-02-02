const { TuyaContext } = require("@tuya/tuya-connector-nodejs");

function createContext(config) {
    return new TuyaContext({
        baseUrl: config.endpoint,
        accessKey: config.accessId,
        secretKey: config.accessKey
    });
}


// Last 5 minutes pictures search
async function getRecentFiles(ctx, deviceId) {
    const endTime = new Date().getTime();
    const startTime = endTime - (5 * 60 * 1000); // 5 minutes window

    // type=7 alarm/report events filter
    // size=20 to ensure we capture photos
    const path = `/v1.0/devices/${deviceId}/logs?startTime=${startTime}&endTime=${endTime}&type=7&size=20`;

    // console.log("Tuya Logs Query:", path); 

    const res = await ctx.request({
        method: "GET",
        path
    });

    if (!res.result || !res.result.logs || res.result.logs.length === 0) {
        throw new Error("There is no recent events on Tuya Cloud");
    }

    // Value field URL only logs filtering
    const urls = res.result.logs
        .filter(l => l.value && typeof l.value === 'string' && l.value.startsWith("http"))
        .map(l => l.value);

    // Duplicity erase
    const uniqueUrls = [...new Set(urls)];

    if (uniqueUrls.length === 0) {
        throw new Error("New events were found but without valid images.");
    }

    return uniqueUrls;
}

module.exports = { createContext, getRecentFiles };
