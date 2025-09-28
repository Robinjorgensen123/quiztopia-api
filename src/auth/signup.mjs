import ddb from "../db/client.mjs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import createError from "http-errors";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import { signupSchema } from "../utils/schemas.mjs";

const { TABLE_NAME } = process.env;

const signupHandler = async (event) => {
  const { email, password, username } = event.body;
  if (!TABLE_NAME) throw createError(500, "felkonfigurerad server");

  const emailFormat = email.trim().toLowerCase();
  const usernameFormat = String(username).trim().toLowerCase();

  const byEmail = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSIEmail",
      KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `EMAIL#${emailFormat}`,
        ":sk": "PROFILE",
      },
      Limit: 1,
    })
  );
  if (byEmail.Items?.length) throw createError(409, "E-post redan registrerad");

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
        userId,
        email: emailFormat,
        username: usernameFormat,
        passwordHash,
        createdAt: now,
        // GSIEmail
        GSI1PK: `EMAIL#${emailFormat}`,
        GSI1SK: `PROFILE`,
      },
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );

  return {
    statusCode: 201,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      userId,
      email: emailFormat,
      username: usernameFormat,
      createdAt: now,
    }),
  };
};

export const handler = withHttp(signupHandler).use(withSchema(signupSchema));
