import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const { TABLE_NAME, JWT_SECRET, JWT_EXPIRES_IN = "10h" } = process.env;

const json = (code, data) => ({
  statusCode: code,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});

const parse = (body) =>
  typeof body === "string" ? JSON.parse(body || "{}") : body || {};

export const handler = async (event) => {
  try {
    const { email, password } = parse(event?.body);
    if (!email || !password)
      return json(400, { message: "email och password krävs" });
    if (!TABLE_NAME || !JWT_SECRET)
      return json(500, { message: "Felkonfigurerad server" });

    const emailFormat = String(email).trim().toLowerCase()

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
      return json(401, { message: "Fel inloggningsuppgifter" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return json(401, { message: "Fel inloggningsuppgiter" });

    const userId =
      user.userId ??
      (user.PK?.startsWith("USER#") ? user.PK.slice(5) : user.PK);

    const token = jwt.sign({ sub: String(userId) }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
    });

    return json(200, {
      token,
      user: {
        userId: String(userId),
        email: user.email ?? emailFormat,
        name: user.name ?? null,
      },
    });
  } catch (err) {
    console.error("login error", err);
    return json(500, { message: "Något gick fel" });
  }
};
