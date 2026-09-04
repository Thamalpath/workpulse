import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set a strong, unpredictable value " +
      "(at least 32 characters) in your backend/.env file."
  );
}

if (JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters. Generate a strong value, e.g. " +
      "`node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"`."
  );
}

export type JwtPayload = {
  sub: string;
  jti: string;
};

export function signToken(userId: string, sessionId: string, expiresIn: string): string {
  return jwt.sign({ sub: userId, jti: sessionId }, JWT_SECRET, {
    expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]>,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string" || typeof decoded.jti !== "string") {
      return null;
    }
    return { sub: decoded.sub, jti: decoded.jti };
  } catch {
    return null;
  }
}
