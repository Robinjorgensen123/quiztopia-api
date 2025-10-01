import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const { REGION } = process.env;

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

export default ddb;
