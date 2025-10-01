

export const encodeToken = (key) => 
 key ? Buffer.from(JSON.stringify(key), "utf-8").toString("base64") : null


export const decodeToken = (token) => {
    if(!token) return undefined;
    try {
        return JSON.parse(Buffer.from(token, "base64").toString("utf-8") )
    } catch {
        return undefined
    }
}


