import middy from "@middy/core";
import httpJsonBodyParsern from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import { authHandler } from "../auth/authorizer.mjs";

export const withHttp = (authHandler) =>
  middy(authHandler).use(httpJsonBodyParsern()).use(httpErrorHandler());
