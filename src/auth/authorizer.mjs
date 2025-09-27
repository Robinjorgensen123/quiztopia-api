import jwt from "jsonwebtoken";

const { JWT_SECRET } = process.env;

export const handler = async (event) => {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET saknas i env");
      return { isAuthorized: false };
    }

    const authHeader =
      event.headers?.authorization ?? event.headers?.Authorization ?? "";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isAuthorized: false };
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) return { isAuthorized: false };

    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    const userId = payload?.sub;
    if (!userId) return { isAuthorized: false };

    return {
      isAuthorized: true,
      context: {
        userId: String(userId),
      },
    };
  } catch (err) {
    console.error("Authorizer error:", err?.message || err);
    return { isAuthorized: false };
  }
};
