import ddb from "../db/client.mjs"
import { QueryCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import createError from "http-errors"
import { withHttp } from "../utils/middy.mjs"
import { withSchema } from "../utils/validator.mjs"
import { submitScoreSchema } from "../utils/schemas.mjs"

const { TABLE_NAME } = process.env

const submitScoreHandler = async (event) => {
    if(!TABLE_NAME) throw createError(500, "serverfel")

const userId = event?.requestContext?.authorizer?.lambda?.userId;
if(!userId) throw createError(401, "saknar eller ogiltig token")

const quizId = event?.pathParameters?.quizId;
if(!quizId) throw createError(400, "quizId krävs")

    const { answers } = event.body ?? {}
    if(!Array.isArray(answers) || !answers.length) {
        throw createError(400, "answers måste vara en icke tom array")
    }

    const meta = await ddb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `QUIZ#${quizId}`, SK: "METADATA" },
    }))
    if(!meta.Item) throw createError(404, "quizet hittades inte")

    const qRes = await ddb.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, : sk)",
        ExpressionAttributeValues: {
            ":pk" : `QUIZ#${quizId}`,
            ":sk" : "QUESTION#",
        },
    }))

    const questions = qRes.Items ?? [];
    if(!questions.length) throw createError(400, "quizet saknar frågor")

        const facit = new Map()
        let maxPoints = 0

        for (const q of questions) {
            const qid = q.questionId ?? (q.SK?.startsWith("QUESTION#") ? q.SK.slice(9) : null)
        if(!qid) continue;
        const pts = Number(q.points ?? 0) || 0;
        maxPoints += pts


        const correct = Array.isArray(q.answer) ? q.answer.map(normalize) : [normalize(q.answer)]
        facit.set(String(qid), { correct, points: pts})
        }

        const seen = new Set()
        const cleaned = []
        for(let i = answers.length -1; i >= 0; i--) {
            const a = answers[i]
            const qid = String(a?.questionId ?? "")
            if(!qid || seen.has(qid)) continue
            seen.add(qid)
            cleaned.unshift({ questionId: qid, value: a?.value })
        }

        let totalPoints = 0
        const results = []

        for (const a of cleaned) {
            const key = String(a.questionId)
            const info = facit.get(key)
            if(!info) {
                results.push({ questionId: key, correct: false, awarded: 0 })
                continue
            }

            const given = normalize(a.value)
            const isCorrect = info.correct.includes(given)

            const awarded = isCorrect ? info.points : 0;
            totalPoints += awarded
            results.push({ questionId: key, correct, isCorrect, awarded })
        }

        const submittedAt = new Date().toISOString()

        await ddb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `QUIZ#${quizId}`,
                SK: `SCORE#${submittedAt}#${userId}`,
                quizId,
                userId: String(userId),
                totalPoints,
                submittedAt,
                GSI3PK: `QUIZ#${quizId}`,
                GSI3SK: totalPoints,
            },
        }))
        return {
            statusCode: 201,
            headers: { "content-type" : "application/json" },
            body: JSON.stringify({
                quizId,
                userId: String(userId),
                totalPoints,
                maxPoints,
                results,
                submittedAt,
            }),
        }
}

export const handker = withHttp(submitScoreHandler).use(withSchema(submitScoreSchema))