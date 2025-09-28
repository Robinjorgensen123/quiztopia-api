export const signupSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["email", "password", "username"],
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
        username: {
          type: "string",
          minLength: 1,
          pattern: "^[a-zA-Z0-9_.]{3,30}$",
        },
      },
    },
  },
};

export const loginEmailSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["email", "password"],
      additionalProperties: false,
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" },
      },
    },
  },
};
