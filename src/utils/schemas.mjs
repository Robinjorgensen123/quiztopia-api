export const signupSchema = {
  type: "object",
  required: ["body"],
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
        quizId: { type: "string", minLength: 1 },
      },
    },
  },
};

export const listQuizzesSchema = {
  type: "object",
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
};

export const addQuestionSchema = {
  type: "object",
  properties: {
    pathParameters: {
      type: "object",
      required: ["quizId"],
      properties: { quizId: { type: "string", minLength: 1 } },
    },
    body: {
      type: "object",
      required: ["question", "answer"],
      additionalProperties: false,
      properties: {
        question: { type: "string", minLength: 1, maxLength: 300 },
        answer: { type: "string", minLength: 1, maxLength: 300 },
        points: { type: "integer", minimum: 0 },
      },
    },
  },
};

export const submitScoreSchema = {
  type: "object",
  properties: {
    pathParameters: {
      type: "object",
      required: ["quizId"],
      properties: {
        quizId: { type: "string", minLength: 1 },
      },
    },
    body: {
      type: "object",
      required: ["answers"],
      additionalProperties: false,
      properties: {
        answers: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["questionId", "value"],
            additionalProperties: true,
            properties: {
              questionId: { type: "string", minLength: 1 },
              value: {
                anyOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "boolean" },
                ],
              },
            },
          },
        },
      },
    },
  },
};
