import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import createError from "http-errors";
import { listQuizzesSchema } from "../utils/schemas.mjs";

const { TABLE_NAME } = process.env


// base64 helpers för paginering
const encodeToken = (key) =>
    key ? Buffer.from(JSON.stringify(key), "utf8").toString("base64") : null;

const decodeToken = (token) => {
    if (!token) return undefined;
    try { return JSON.parse(Buffer.from(token, "base64").toString("utf8")); }
    catch { return undefined }  
}
 

const listQuizzesHandler = async (event) => {
    if(!TABLE_NAME) throw createError(500, "server fel")

    const qs = event.queryStringParameters ?? {}
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "20", 10) || 20, 1), 100) // antal rader som visas / sida
    const startKey = decodeToken(qs.nextToken) // fortsätt efter förra sidans sista post, 

    const res = await ddb.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSIAllQuizzes",
        KeyConditionExpression: "GSI4PK = :pk",
        ExpressionAttributeValues: { ":pk": "QUIZ" },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: startKey,
    }))

    const items = (res.Items ?? []).map((it) => ({
        quizId: it.quizId,
        title: it.title,
        description: it.description ?? null,
        ownerUserId: it.ownerUserId,
        createdAt: it.createdAt,
        
    }))
    return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            items,
            nextToken: encodeToken(res.LastEvaluatedKey),
        }),
    }
}

export const handler = withHttp(listQuizzesHandler).use(withSchema(listQuizzesSchema))