import ddb from "../db/client.mjs";
import { GetCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import httpErrorHandler from "@middy/http-error-handler"
import { withHttp } from "../utils/middy.mjs";
import createError from "http-errors"

const { TABLE_NAME } = process.env;

const deleteQuizHandler = async (event) => {
  if (!TABLE_NAME) throw createError(500, "serverfel");

  const userId = event?.requestContext?.authorizer?.lambda?.userId;
  if (!userId) throw createError(401, "saknar eller ogiltig token");

  const quizId = event?.pathParameters?.quizId;
  if (!quizId) throw createError(400, "quiz id krävs");

  const metaRes = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `QUIZ#${quizId}`, SK: "METADATA" },
    })
  );

  const meta = metaRes.Item;
  if (!meta) throw createError(404, "quizet hittades ej");
  if (String(meta.ownerUserId) !== String(userId)) {
    throw createError(403, "endast ägaren får ta bort detta quiz");
  }

  const all = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `QUIZ#${quizId}` },
    })
  );

  const items = all.Items ?? [];

  if (!items.length) {
    return {statusCode: 200,
    body: JSON.stringify({ message: "Quiz borttaget" })
    }
  }

  const chunk = (arr, size) =>
    arr.reduce(
      (acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]),
      []
    );
  const batches = chunk(items, 20);

  for (const group of batches) {
    await Promise.all(
      group.map((it) =>
        ddb.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK: it.PK, SK: it.SK },
          })
        )
      )
    );
  }
  return { 
    statusCode: 200,
    body: JSON.stringify({ message: "Quiz borttaget" })
   };
};
export const handler = withHttp(deleteQuizHandler);
