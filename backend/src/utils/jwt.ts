import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

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
};

export function signToken(userId: string): string {
  const options: jwt.SignOptions = {};
  options.expiresIn = JWT_EXPIRES_IN as NonNullable<jwt.SignOptions["expiresIn"]>;
  return jwt.sign({ sub: userId }, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string") {
      return null;
    }
    return { sub: decoded.sub };
  } catch {
    return null;
  }
}
