

import { S3Client,PutObjectCommand, GetObjectCommand,DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


//aws  variables
const bName = 'ankit-aws-sprint';
const bRegion= 'us-east-1'
const bAccesKey='AKIAQ3EGWFXUQUWJQRWM';
const bSecretAcessKey='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';



const s3 = new S3Client({
    region: bRegion, // Directly set the region here
    credentials: {
        accessKeyId: bAccesKey, // Directly set the AWS Access Key ID
        secretAccessKey: bSecretAcessKey // Directly set the AWS Secret Access Key
    },

});

// **Upload File to S3**
export const uploadFileToS3 = async (file) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    const params = {
        Bucket: bName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    const a = await s3.send(new PutObjectCommand(params));

    const url = await getPresignedUrl(fileName);


    return {fileName, url}; // Return the uploaded file name
};




export const deleteFilesFromS3 = async (fileUrls) => {
    console.log("deel", fileUrls);
    if (!fileUrls || fileUrls.length === 0) return;
    console.log("deel", fileUrls);

    const deleteParams = {
        Bucket: bName,
        Delete: {
            Objects: fileUrls.map((fileUrl) => ({ Key: fileUrl })),
        },
    };

   const ankit = await s3.send(new DeleteObjectsCommand(deleteParams));
   console.log(ankit) 
   return {"deletedFiles":fileUrls};
};

export const getPresignedUrl = async (fileName) => {
    try {
        if (!fileName) throw new Error("No fileName provided");

        const command = new GetObjectCommand({
            Bucket: bName,
            Key: fileName,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
        });

        const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min expiry

        return presignedUrl;
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        throw error;
    }
};


export default s3;