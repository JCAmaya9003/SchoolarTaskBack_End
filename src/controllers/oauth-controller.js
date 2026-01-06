import * as userService from '../services/user-service.js';
import { config } from '../config/config.js';
import { OAuth2Client } from 'google-auth-library';
import { generateToken } from '../middlewares/auth-middleware.js'; // Assume this function generates JWTs

const CLIENT_ID = config.googleClientId;
const client = new OAuth2Client(config.googleClientId, config.googleClientSecret, config.googleRedirectUrl);


export const generateAuthUrl = async (req, res) => {
  try {
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid',
      ],
      prompt: 'consent',
    });

    res.json({ url: authorizeUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: "Failed to generate Google auth URL" });
  }
};


export const handleOAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // Exchange the code for tokens google
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.status(400).json({ error: "Failed to retrieve ID token" });
    }

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    if (!email) {
      return res.status(400).json({ error: "Email not found in Google token" });
    }

    // Match the email with the database
    const user = await userService.searchUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found in local database" });
    }

    // Generate a JWT for the authenticated user
    const jwtToken = generateToken({ id: user._id, email: user.email });

    // Set the token in a cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: false, 
      sameSite: "strict",
      maxAge:   60 * 60 * 1000, //1 hour
    });
      res
     
  const frontendUrl = `${config.frontUrl}/googleload`;
   return res.redirect(frontendUrl);
  } catch (error) {
    console.error("Error during Google OAuth callback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};