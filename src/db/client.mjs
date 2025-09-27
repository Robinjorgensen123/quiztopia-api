import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "aws-sdk/lib-dynamodb";

const { AWS_REGION } = process.env;

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: AWS_REGION })
);

export default ddb;
