import ddb from "../db/client.mjs";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto"
import createError from "http-errors"
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import { addQuestionSchema } from "../utils/schemas.mjs"
import { create } from "node:domain";


const { TABLE_NAME } = process.env


const addQuestionHandler = async (event) => {
    if(!TABLE_NAME) throw createError(500, "felkonfigurerad server")

        const userId = event?.requestContext?.authorizer?.lambda?.userId;
        if(!userId) throw createError(401, "saknar eller ogiltig token")
        
    const quizId = event?.pathParameters?.quizId;
    if(!quizId) throw createError(400, "quizId krävs")

        const { question, answer, points = 0 } = event.body ?? {};

        const metaRes = await ddb.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: `QUIZ#${quizId}`, SK: "METADATA" },
        }))
        const meta = metaRes.Item;
        if(!meta) throw createError(404, "quizzet hittades ej");
        if (String(meta.ownerUserId) !== String(userId)) {
            throw createError(403, "endast ägeren får ändra detta quiz")
        }

        const questionId = crypto.randomUUID()
        const now = new Date().toISOString()

        await ddb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `QUIZ#${quizId}`,
                SK: `QUESTION#${questionId}`,
                quizId,
                questionId,
            }
        }))

}