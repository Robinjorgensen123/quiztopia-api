import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginEmailSchema } from "../utils/schemas.mjs";
import { withHttp } from "../utils/middy.mjs";
import { withSchema } from "../utils/validator.mjs";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors"

const { TABLE_NAME, JWT_SECRET, JWT_EXPIRES_IN = "10h" } = process.env;

export const loginHandler = async (event) => {
  const { email, password } = event.body;

  if (!TABLE_NAME || !JWT_SECRET)
    throw createError(500, "Felkonfigurerad server");

  const emailFormat = String(email).trim().toLowerCase();

  const res = await ddb.send(
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

  const user = res.Items?.[0];
  if (!user || !user.passwordHash)
    throw createError(401, "fel inloggningsuppgifter");

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) throw createError(401, "fel inloggningsuppgifter");

  const userId =
    user.userId ?? (user.PK?.startsWith("USER#") ? user.PK.slice(5) : user.PK);

  const token = jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token,
      user: {
        userId: String(userId),
        email: user.email ?? emailFormat,
        name: user.name ?? user.username ?? null,
      },
    }),
  };
};

export const handler = withHttp(loginHandler).use(withSchema(loginEmailSchema));
