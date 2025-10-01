import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import { getQuizSchema } from "../utils/schemas.mjs";
import httpErrorHandler from "@middy/http-error-handler"
import createError from "http-errors"


const { TABLE_NAME } = process.env;

const getQuizHandler = async (event) => {
  const quizId = event?.pathParameters?.quizId;
  if (!TABLE_NAME) throw createError(500, "felkonfigurerad server");
  if (!quizId) throw createError(400, "quizId krävs");

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": `QUIZ#${quizId}`,
      },
    })
  );

  const items = res.Items ?? [];
  if (!items.length) throw createError(404, "quizet hittades ej");

  const meta = items.find((it) => it.SK === "METADATA");
  if (!meta) throw createError(404, "quiz saknar metadata");

  const questions = items
    .filter((it) => it.SK.startsWith?.("QUESTION#"))
    .map((q) => ({
      questionId: q.questionId ?? q.SK.replace("QUESTION#", ""),
      question: q.question,
      points: q.points ?? 0,
      createdAt: q.createdAt ?? null,
    }));
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quizId: meta.quizId,
      title: meta.title,
      description: meta.description ?? null,
      ownerUserId: meta.ownerUserId,
      createdAt: meta.createdAt,
      questions,
    }),
  };
};

export const handler = withHttp(getQuizHandler).use(withSchema(getQuizSchema));
