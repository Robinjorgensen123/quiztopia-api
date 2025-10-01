import validator from "@middy/validator"
import Ajv from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv({ coerceTypes: true, allErrors: true })
addFormats(ajv)

export const withSchema = (schema) => validator({ inputSchema: schema, ajv })
