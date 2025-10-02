import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpErrorHandler from "@middy/http-error-handler";
import httpEventNormalizer from "@middy/http-event-normalizer";

export const withHttp = (handler) =>
  middy(handler)
    .use(httpJsonBodyParser({ disableContentTypeError: true }))
    .use(httpEventNormalizer())
    .use(httpErrorHandler());

