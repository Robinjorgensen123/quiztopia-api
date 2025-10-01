import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import addFormats from "ajv-formats"

export const withSchema = (eventSchema) => {
  return validator({
    eventSchema: transpileSchema(eventSchema),
    ajvOptions: {
        allErrors: true,
        removeAdditional: false,
        coerceTypes: true,
    },
    ajvPlugins: [addFormats] // email, uri, date-time, etc.
  });
};
