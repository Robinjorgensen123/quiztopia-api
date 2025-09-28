import ddb from "../db/client.mjs"
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { crypto } from "node:crypto"

const { TABLE_NAME } = process.env

const json = (code, data) => ({
  statusCode: code,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(data),
});

const parse = (body) => typeof body === "string" ? (body ? JSON.parse(body) : {}) : (body || {})


export const handler = (event) => {
    const { title, id , }  = parse

}