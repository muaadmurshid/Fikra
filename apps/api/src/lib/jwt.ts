import jwt, { JwtPayload as JsonWebTokenPayload, SignOptions } from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined.");
  }

  return secret;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

export interface AccessTokenPayload {
  userId: string;
}

export function signAccessToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      userId,
    },
    getJwtSecret(),
    options
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded === "string" ||
    typeof decoded.userId !== "string"
  ) {
    throw new Error("Invalid access token payload.");
  }

  const payload = decoded as JsonWebTokenPayload & {
    userId: string;
  };

  return {
    userId: payload.userId,
  };
}