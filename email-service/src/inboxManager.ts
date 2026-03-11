import { client } from "./agentmail";

export const agentInboxes: Record<string, string> = {
    "matchmaker": "matchmaker@agentmail.to",
    "romantic": "romantic@agentmail.to",
    "skeptic": "skeptic@agentmail.to"
};

export async function initializeInboxes() {
    console.log("Inboxes are already provisioned. Using existing inbox IDs:");
    for (const [name, id] of Object.entries(agentInboxes)) {
        console.log(`- ${name}: ${id}`);
    }
}
