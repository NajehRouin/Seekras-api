import jwt from "jsonwebtoken";

export const generateToken = (payload: object): string => {
  const secret = process.env.JWT_SECRET!;

  return jwt.sign(payload, secret);
};
