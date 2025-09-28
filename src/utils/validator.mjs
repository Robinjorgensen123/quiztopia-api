import validator from "@middy/validator"

export const withSchema = (schema) => validator({ inputSchema: schema })