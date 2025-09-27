import ddb from "../db/client.mjs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const { TABLE_NAME } = process.env;

const json = (code, data) => ({
  statusCode: code,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});

const parse = (body) =>
  typeof body === "string" ? JSON.parse(body || "{}") : body || {};

export const handler = async (event) => {
  try {
    const { email, password, username } = parse(event?.body);
    if (!email || !password)
      return json(400, { message: "email & password krävs" });
    if (!TABLE_NAME) return json(500, { message: "Felkonfigurerad server" });

    const emailFormat = email.trim().toLowerCase();
    const isEmail = version => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(version);
    if(!isEmail(emailFormat)) return json(400, { message: "ogiltig epost"});
    if(String(password).length < 8) return json(400, { message: "password måste minst vara 8 tecken"})

    const existing = await ddb.send(
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
    if (existing.Items?.length)
      return json(409, { message: "Konto med denna email finns redan" });

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
          name: username ?? null,
          passwordHash,
          createdAt: now,
          // GSIEmail
          GSI1PK: `EMAIL#${emailFormat}`,
          GSI1SK: `PROFILE`,
        },
        ConditionExpression: "attribute_not_exists(PK)",
      })
    );

    return json(201, {
      userId,
      email: emailFormat,
      name: username ?? null,
      createdAt: now,
    });
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      return json(409, { message: "kunde inte skapa användare" });
    }
    console.error("signup error", err);
    return json(500, { message: "något gick fel" });
  }
};
