import ddb from "../db/client.mjs"
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto"
import httpErrorHandler from "@middy/http-error-handler"
import { withHttp } from "../utils/middy.mjs"
import { withSchema } from "../utils/validator.mjs";
import { createQuizSchema } from "../utils/schemas.mjs"
import createError from "http-errors"


const { TABLE_NAME } = process.env



const createQuizHandler = async (event) => {
    if (!TABLE_NAME) throw createError(500, "Felkonfigurerad server")

const userId = event?.requestContext?.authorizer?.lambda?.userId
if(!userId) throw createError(401, "saknar eller ogiltig token")

const { title, description } = event.body ?? {}
const titleTrim = String(title).trim();

if(!titleTrim) throw createError(400, "title krävs")
if(description && String(description).length > 500) {
    throw createError(400, "description max 500 tecken")
}

const quizId = crypto.randomUUID()
const now = new Date().toISOString()

const item = {
    PK: `QUIZ#${quizId}`,
    SK: "METADATA",
    quizId,
    title: titleTrim,
    description: description ? String(description) : null,
    ownerUserId: String(userId),
    createdAt: now,
    // GSI2: alla quiz för en viss användare (”mina quiz”)
    GSI2PK: `USER#${userId}`,
    GSI2SK: `QUIZ#${quizId}`,
    // GSI4: alla quiz
    GSI4PK: "QUIZ",
    GSI4SK: now,
}

try {
    await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(PK)",
    }))
} catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
        throw createError(409, "kunde inte skapa quiz")
    }
    throw err
}

return {
    statusCode: 201,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
        quizId,
        title: item.title,
        description: item.description,
        ownerUserId: item.ownerUserId,
        createdAt: item.createdAt,
    }),
}
}

export const handler = withHttp(createQuizHandler).use(withSchema(createQuizSchema))