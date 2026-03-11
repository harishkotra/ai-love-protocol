import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { client } from "./agentmail";
import { initializeInboxes, agentInboxes } from "./inboxManager";
import { startPolling } from "./emailPoller";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/send-email", async (req, res) => {
    const { sender, receiver, subject, text } = req.body;

    try {
        const inboxId = agentInboxes[sender];
        if (!inboxId) {
            res.status(400).json({ error: "Invalid sender" });
            return;
        }

        await client.inboxes.messages.send(inboxId, {
            to: `${receiver}@agentmail.to`,
            subject,
            text
        });

        console.log(`[${sender}] sent email to [${receiver}]: ${subject}`);
        res.json({ success: true });
    } catch (e: any) {
        console.error("Send email error:", e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
    console.log(`Email service running on port ${PORT}`);
    await initializeInboxes();
    startPolling(5000);
});
