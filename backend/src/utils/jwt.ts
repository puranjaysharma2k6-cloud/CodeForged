import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  email: string;
}

function getSecret(key: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): string {
  const secret = process.env[key];
  if (!secret) {
    throw new Error(`${key} is not set`);
  }
  return secret;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret("JWT_ACCESS_SECRET")) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret("JWT_REFRESH_SECRET")) as JwtPayload;
}
