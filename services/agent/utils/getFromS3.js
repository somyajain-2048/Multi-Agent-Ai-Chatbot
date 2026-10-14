import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const getFromS3 = async (filename, expiresIn = 86400, isS3 = true) => {
    const bucketName = (process.env.AWS_BUCKET_NAME || "cortex-chat-ai").trim();
    const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:8000";
    const localUrl = `${gatewayUrl}/api/agent/pdf/${filename}`;

    if (!isS3) {
        return localUrl;
    }

    try {
        return await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: bucketName,
                Key: filename
            }),
            { expiresIn }
        );
    } catch (error) {
        console.warn("AWS S3 getSignedUrl warning (using local download link):", error?.message || error);
        return localUrl;
    }
};
