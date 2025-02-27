

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { SDK as RC } from "@ringcentral/sdk";

dotenv.config();

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const rcsdk = new RC({
    server: process.env.RC_SERVER_URL,
    clientId: process.env.RC_APP_CLIENT_ID,
    clientSecret: process.env.RC_APP_CLIENT_SECRET,
    jwt: process.env.RC_USER_JWT // Add JWT directly to config
});

// Simplified authentication
const authenticate = async () => {
    try {
        // Force fresh JWT authentication
        await platform.login({
            jwt: process.env.RC_USER_JWT,
            access_token_ttl: 3600 // 1 hour token validity
        });
        return platform.auth().data().access_token;
    } catch (e) {
        console.error("Auth Error:", {
            code: e.response?.statusCode,
            apiError: e.response?.data
        });
        throw new Error("Authentication failed: Verify JWT validity");
    }
};
// Retry Wrapper for API Calls
const withRetry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0 && e.response?.status >= 500) {
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw e;
    }
};

// Create Meeting Endpoint
router.post("/create", async (req, res) => {
    try {
        const token = await authenticate();
        
        const meetingConfig = {
            name: "Admin Controlled Meeting",
            type: "Scheduled",
            settings: {
                security: {
                    waitingRoomRequired: true,
                    waitingRoomMode: "Everyone",
                    authentication: "Public"
                },
                host: {
                    joinBeforeHost: false,
                    screenSharing: true,
                    muteParticipantsOnEntry: true
                },
                recording: {
                    enabled: true,
                    autoStart: true,
                    accountUserAccess: true
                },
                participants: {
                    allowJoinBeforeHost: false,
                    publishOwnVideo: false
                }
            }
        };

        const response = await withRetry(() => 
            platform.post("/rcvideo/v2/account/~/extension/~/bridges", meetingConfig, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            })
        );

        const meetingData = await response.json();
        
        res.json({
            meetingLink: meetingData.discovery.web,
            meetingId: meetingData.id,
            expiration: new Date(Date.now() + 3600000) // 1 hour expiration
        });

    } catch (e) {
        console.error("Meeting Creation Error:", {
            message: e.message,
            status: e.response?.status,
            data: e.response?.data
        });
        
        res.status(e.response?.status || 500).json({
            error: "MEETING_CREATION_FAILED",
            message: e.response?.data?.message || e.message
        });
    }
});

// End Meeting Endpoint
router.delete("/end/:meetingId", async (req, res) => {
    try {
        const token = await authenticate();
        const { meetingId } = req.params;

        await withRetry(() =>
            platform.delete(`/rcvideo/v2/account/~/extension/~/bridges/${meetingId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        );

        res.json({ 
            success: true,
            message: "Meeting ended successfully"
        });

    } catch (e) {
        res.status(e.response?.status || 500).json({
            error: "MEETING_END_FAILED",
            message: e.message
        });
    }
});



export default router
