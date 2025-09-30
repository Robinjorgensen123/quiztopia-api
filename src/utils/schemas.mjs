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

export const createQuizSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["title"],
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 1, maxLength: 120 },
        description: { type: "string", maxLength: 500 },
      },
    },
  },
};


export const getQuizSchema = {
    type: "object",
    properties: {
        pathParameters: {
            type: "object",
            required: ["quizId"],
            properties: {
                quizId: { type: "string", minLength: 1 }
            },
        },
    },
}

export const listQuizzesSchema = {
    type:"object",
    properties: {
        queryStringParameters: {
            type: "object",
            additionalProperties: true,
            properties: {
                limit: { type: "string" },
                nextToken: { type: "string" },
            },
        },
    },
}