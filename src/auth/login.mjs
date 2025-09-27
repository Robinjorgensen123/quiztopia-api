import ddb from "../db/client.mjs";
import { QueryCommand } from "@aws-sdk/client-dynamodb";
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

const isEmail = (v) => 
    typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const handler = async (event) => {
  try {
    const { email, password } = parse(event?.body);
    if (!email || !password)
      return json(400, { message: "email och password krävs" });
    if (!TABLE_NAME || !JWT_SECRET)
      return json(500, { message: "Felkonfigurerad server" });
    const emailCheck = String(email).trim().toLowerCase()
    if(!isEmail(emailCheck)) {
        return json(400, { message: "ogiltig epost" })
    }
    if (String(password).length < 8) {
        return json(400, { message: "password måste vara minst 8 tecken" })
    }

    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSIEmail",
        KeyConditionExpression: "GSI1PK = :pk AND GSI1SK = :sk",
        ExpressionAttributeValues: {
          pk: `EMAIL#${email}`,
          sk: "PROFILE",
        },
        Limit: 1,
      })
    );

    const user = res.Items?.[0];
    if (!user) return json(401, { message: "Fel inloggningsuppgifter" });

    const ok = await bcrypt.compare(password, user.passwordHash);
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
        email: user.email,
        name: user.name ?? null,
      },
    });
  } catch (err) {
    console.error("login error", err);
    return json(500, { message: "Något gick fel" });
  }
};
