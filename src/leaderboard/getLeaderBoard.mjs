import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import { getLeaderboardSchema } from "../utils/schemas.mjs";
import { encodeToken, decodeToken } from "../utils/pagination.mjs";
import createError from "http-errors";

const { TABLE_NAME } = process.env;

const getLeaderboardHandler = async (event) => {
  const quizId = event?.pathParameters?.quizId;
  if (!quizId) throw createError(400, "quizId krävs");
  if (!TABLE_NAME) throw createError(500, "felkonfigurerad server");

  const qs = event.queryStringParameters ?? {};
  const limit = Math.min(
    Math.max(parseInt(qs.limit ?? "10", 10) || 10, 1),
    100
  );
  const startKey = qs.nextToken ? decodeToken(qs.nextToken) : undefined;
  const rankOffset = startKey?.rankOffset ?? 0;

  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSILeaderboard",
      KeyConditionExpression: "GSI3PK = :pk",
      ExpressionAttributeValues: { ":pk": `QUIZ#${quizId}` },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: startKey,
    })
  );

  if(!res.Items || res.Items.length === 0) {
    return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            quizId,
            items: [],
            nextToken: undefined,
        }),
    }
  }

  const items = (res.Items ?? []).map((it, index) => ({
    rank: rankOffset + index + 1,
    userId: it.userId,
    score: typeof it.score === `number` ? it.score : Number(it.GSI3SK ?? 0),
    createdAt: it.submittedAt ?? it.createdAt ?? null,
  }));

  const nextToken = res.LastEvaluatedKey
    ? encodeToken({
        ...res.LastEvaluatedKey,
        rankOffset: rankOffset + items.length,
      })
    : undefined;
      
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quizId,
      items,
      nextToken,
    }),
  };
};

export const handler = withHttp(getLeaderboardHandler).use(
  withSchema(getLeaderboardSchema)
);
