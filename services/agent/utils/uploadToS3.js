import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadToS3 = async (filename, buffer, contentType) => {
    // Save local copy as fallback
    try {
        const localFilePath = path.join(uploadsDir, filename);
        fs.writeFileSync(localFilePath, buffer);
    } catch (e) {
        console.warn("Local file backup warning:", e?.message || e);
    }

    const bucketName = (process.env.AWS_BUCKET_NAME || "cortex-chat-ai").trim();
    try {
        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Body: buffer,
                Key: filename,
                ContentType: contentType
            })
        );
        return { isS3: true, filename };
    } catch (error) {
        console.warn("AWS S3 upload warning (falling back to local file):", error?.message || error);
        return { isS3: false, filename };
    }
};