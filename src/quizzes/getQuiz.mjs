import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import { getQuizSchema } from "../utils/schemas.mjs"
import createError from "http-errors";


const { TABLE_NAME } = process.env

const getQuizHandler =  async (event) => {

    const quizId = event?.pathParameters?.quizId
    if(!quizId) throw createError(400, "quizId krävs")

        const res = await ddb.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": `QUIZ#${quizId}`,
            }
        }))

