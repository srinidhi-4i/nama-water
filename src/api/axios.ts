import axios from "axios";
import https from "https";

// Ensure the baseURL includes the /api prefix since it's common for all UAT calls
const envBaseUrl = process.env.NEXT_PUBLIC_UAT_BASE_URL;
const baseURL = envBaseUrl
    ? (envBaseUrl.endsWith('/api') ? envBaseUrl : `${envBaseUrl}/api`)
    : 'https://eservicesuat.nws.nama.om:444/api';

console.log('Server Axios BaseURL:', baseURL);

export const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
    },
    // Allow self-signed certs for UAT environment
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});
