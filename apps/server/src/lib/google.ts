import { OAuth2Client } from "google-auth-library";
import { env } from "./env.js";

export function getOAuthClient() {
  return new OAuth2Client(env.googleClientId, env.googleClientSecret, env.googleCallbackUrl);
}

export async function getGoogleUser(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token");

  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name ?? payload.email!.split("@")[0],
    picture: payload.picture,
  };
}
