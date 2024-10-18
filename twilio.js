const express = require("express");
const pool = require("./db.js");
const router = express.Router();

require("dotenv").config();

const twilio = require("twilio");
const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;

// Environment variables setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const chatServiceSid = process.env.TWILIO_CHAT_SERVICE_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

router.post("/token", async (req, res) => {
  const { identity, friendlyName } = req.body;

  const token = new twilio.jwt.AccessToken(accountSid, apiKey, apiSecret, {
    identity: identity,
  });

  const chatGrant = new twilio.jwt.AccessToken.ChatGrant({
    serviceSid: chatServiceSid,
  });

  token.addGrant(chatGrant);

  try {
    // Check if the user exists
    let user;
    try {
      user = await client.conversations
        .services(chatServiceSid)
        .users(identity)
        .fetch();
    } catch (error) {
      // If the user does not exist, create the user
      if (error.status === 404) {
        user = await client.conversations
          .services(chatServiceSid)
          .users.create({ identity, friendlyName });
        console.log("User created:", user.sid);
      } else {
        throw error;
      }
    }

    // If the user exists, update their friendly name
    if (user) {
      await client.conversations
        .services(chatServiceSid)
        .users(identity)
        .update({ friendlyName: friendlyName });
      console.log("User updated:", user.sid);
    }

    // Send the token back to the client
    res.send({ token: token.toJwt() });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).send("Error creating/updating user");
  }
});

// Create or fetch conversation between two users
router.post("/conversation", async (req, res) => {
  const { user1Id, user2Id } = req.body;
  const client = twilio(accountSid, authToken);

  try {
    // Check if conversation between users already exists
    let conversation = await client.conversations.v1.conversations
      .list({
        limit: 20,
      })
      .then((conversations) =>
        conversations.find(
          (conv) =>
            conv.uniqueName === `${user1Id}-${user2Id}` ||
            conv.uniqueName === `${user2Id}-${user1Id}`
        )
      );

    if (!conversation) {
      // Create new conversation
      conversation = await client.conversations.v1.conversations.create({
        uniqueName: `${user1Id}-${user2Id}`,
        friendlyName: `Chat between ${user1Id} and ${user2Id}`,
      });

      // Add users to the conversation
      await client.conversations.v1
        .conversations(conversation.sid)
        .participants.create({ identity: user1Id });
      await client.conversations.v1
        .conversations(conversation.sid)
        .participants.create({ identity: user2Id });
    }

    res.json({ conversationSid: conversation.sid });
  } catch (error) {
    res.status(500).send("Error creating or fetching conversation");
  }
});

module.exports = router;
