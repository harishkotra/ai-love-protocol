import { client } from "./agentmail";
import { agentInboxes } from "./inboxManager";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://backend-python:8000";
const processedMessages = new Set<string>();

// Ignore all emails that arrived before the email service started (prevents old errors re-appearing on restart)
const START_TIME = Date.now();

export async function pollInboxes() {
    for (const [name, inboxId] of Object.entries(agentInboxes)) {
        try {
            const res = await client.inboxes.messages.list(inboxId);

            for (const msg of res.messages) {
                // Ignore messages older than when our service started
                const msgTime = new Date(msg.createdAt || msg.timestamp || 0).getTime();
                if (msgTime < START_TIME) continue;

                // Use composite key so we don't deduplicate the identical email across multiple inboxes
                const processKey = `${name}-${msg.messageId}`;
                if (!processedMessages.has(processKey)) {
                    processedMessages.add(processKey);

                    // MessageFrom is a plain string like "matchmaker@agentmail.to"
                    const fromRaw = String(msg.from || "").toLowerCase();
                    let senderName = "unknown";

                    if (fromRaw.includes("romantic")) senderName = "romantic";
                    else if (fromRaw.includes("skeptic")) senderName = "skeptic";
                    else if (fromRaw.includes("matchmaker")) senderName = "matchmaker";

                    // Ignore emails that this inbox sent (i.e. sent mail showing up in the inbox list)
                    if (senderName === name) {
                        continue;
                    }

                    console.log(`New email for ${name} from ${senderName} (raw: ${fromRaw}): ${msg.subject}`);

                    try {
                        const fullMsg = await client.inboxes.messages.get(inboxId, msg.messageId);
                        const body = fullMsg.extractedText || fullMsg.text || msg.preview || "";

                        console.log(`  Body preview: ${body.substring(0, 100)}...`);

                        await fetch(`${PYTHON_BACKEND_URL}/webhook/email`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                sender: senderName,
                                receiver: name,
                                subject: msg.subject || "chat",
                                text: body
                            })
                        });
                    } catch (e) {
                        console.error("Failed to fetch full message or post to webhook", e);
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to poll inbox ${name}:`, e);
        }
    }
}

export function startPolling(intervalMs = 5000) {
    setInterval(pollInboxes, intervalMs);
}
