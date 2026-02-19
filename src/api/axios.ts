import axios from "axios";
import https from "https";

// Base URL from env - must include /api suffix (e.g. https://eservicesuat.nws.nama.om:444/api)
const envBaseUrl = process.env.NEXT_PUBLIC_UAT_BASE_URL || 'https://eservicesuat.nws.nama.om:444/api';

export const axiosInstance = axios.create({
    baseURL: envBaseUrl,
    headers: {
        "Accept": "application/json, text/plain, */*",
    },
    // Allow self-signed certs for UAT environment
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});
