import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

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
