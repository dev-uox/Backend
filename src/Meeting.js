

// import express from "express";
// import { SDK as RC } from "@ringcentral/sdk";
// import dotenv from "dotenv";

// dotenv.config();

// const router = express.Router();

// console.log("🔹 Debugging .env values:");
// console.log("RC_SERVER_URL:", process.env.RC_SERVER_URL);
// console.log("RC_APP_CLIENT_ID:", process.env.RC_APP_CLIENT_ID ? "✅ Loaded" : "❌ MISSING");
// console.log("RC_APP_CLIENT_SECRET:", process.env.RC_APP_CLIENT_SECRET ? "✅ Loaded" : "❌ MISSING");
// console.log("RC_USER_JWT:", process.env.RC_USER_JWT ? "✅ Loaded" : "❌ MISSING");


// // Instantiate the SDK
// const rcsdk = new RC({
//     server: process.env.RC_SERVER_URL,
//     clientId: process.env.RC_APP_CLIENT_ID,
//     clientSecret: process.env.RC_APP_CLIENT_SECRET
// });
// const platform = rcsdk.platform();

// // 🔹 Authenticate Route (Fixed: Removed `/meeting/` prefix)
// router.get("/authenticate", async (req, res) => {
//     try {
//         console.log("🔹 Authenticating user...");
//         await platform.login({ jwt: process.env.RC_USER_JWT });
//         console.log("✅ RingCentral Authentication Successful!");
//         res.status(200).json({ message: "Authentication Successful" });
//     } catch (e) {
//         console.error("❌ Authentication Failed:", e.message);
//         res.status(500).json({ error: `Authentication Failed: ${e.message}` });
//     }
// });

// // 🔹 Create Meeting Route (Fixed: Removed `/meeting/` prefix)
// router.post("/create", async (req, res) => {
//     try {
//         await platform.login({ jwt: process.env.RC_USER_JWT });

//         const endpoint = "/rcvideo/v2/account/~/extension/~/bridges";
//         const bodyParams = {
//             name: "Test Meeting",
//             type: "Instant"
//         };

//         const response = await platform.post(endpoint, bodyParams);
//         const jsonObj = await response.json();

//         console.log("✅ Meeting Created:", jsonObj.discovery.web);
//         res.json({ meetingLink: jsonObj.discovery.web });
//     } catch (e) {
//         console.error("❌ Error creating meeting:", e.message);
//         res.status(500).json({ error: "Unable to create meeting." });
//     }
// });

// export default router;  // ✅ Correct: Exporting `router`, not `app`












// WORKING




import express from "express";
import { SDK as RC } from "@ringcentral/sdk";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

console.log("🔹 Debugging .env values:");
console.log("RC_SERVER_URL:", process.env.RC_SERVER_URL);
console.log("RC_APP_CLIENT_ID:", process.env.RC_APP_CLIENT_ID ? "✅ Loaded" : "❌ MISSING");
console.log("RC_APP_CLIENT_SECRET:", process.env.RC_APP_CLIENT_SECRET ? "✅ Loaded" : "❌ MISSING");
console.log("RC_USER_JWT:", process.env.RC_USER_JWT ? "✅ Loaded" : "❌ MISSING");


// Instantiate the SDK
const rcsdk = new RC({
    server: process.env.RC_SERVER_URL,
    clientId: process.env.RC_APP_CLIENT_ID,
    clientSecret: process.env.RC_APP_CLIENT_SECRET
});
const platform = rcsdk.platform();

// 🔹 Authenticate Route (Fixed: Removed `/meeting/` prefix)
router.get("/authenticate", async (req, res) => {
    try {
        console.log("🔹 Authenticating user...");
        await platform.login({ jwt: process.env.RC_USER_JWT });

        // Fetch user info to check admin permissions
        const userInfo = await platform.get("/restapi/v1.0/account/~/extension/~");
        const userData = await userInfo.json();
        console.log("✅ Authenticated User:", userData);

        if (!userData.permissions || !userData.permissions.includes("Video")) {
            throw new Error("❌ User does not have necessary video permissions");
        }

        console.log("✅ RingCentral Authentication Successful!");
        res.status(200).json({ message: "Authentication Successful" });
    } catch (e) {
        console.error("❌ Authentication Failed:", e.message);
        res.status(500).json({ error: `Authentication Failed: ${e.message}` });
    }
});


// 🔹 Create Meeting Route (Fixed: Removed `/meeting/` prefix)
router.post("/create", async (req, res) => {
    try {
        await platform.login({ jwt: process.env.RC_USER_JWT });

        const endpoint = "/rcvideo/v2/account/~/extension/~/bridges";
        const bodyParams = {
            name: "Admin Controlled Meeting",
            type: "Scheduled",
            settings: {
                waitingRoomRequired: true,
                hostJoinedRequired: true,
                joinBeforeHost: false
            }
        };

        const response = await platform.post(endpoint, bodyParams);
        if (!response.ok) {
            throw new Error(`Grant Error: ${response.statusText}`);
        }

        const jsonObj = await response.json();
        console.log("✅ Meeting Created:", jsonObj.discovery.web);
        res.json({ meetingLink: jsonObj.discovery.web });
    } catch (e) {
        console.error("❌ Error creating meeting:", e.message);
        res.status(500).json({ error: "Unable to create meeting. Check API permissions." });
    }
});

export default router;  // ✅ Correct: Exporting `router`, not `app`





