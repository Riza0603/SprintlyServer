//import { configDotenv } from "dotenv";
import { S3Client, GetObjectCommand,DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//import express from 'express'
import { uploadFileToS3, deleteFilesFromS3, getPresignedUrl} from "../config/S3functions.js";



// const s3 = new S3Client({
//     region: 'us-east-1', // Directly set the region here
//     credentials: {
//         accessKeyId: 'AKIAQ3EGWFXUQUWJQRWM', // Directly set the AWS Access Key ID
//         secretAccessKey: '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' // Directly set the AWS Secret Access Key
//     },

// });


export const uploadP = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const uploadedFiles = await Promise.all(req.files.map(uploadFileToS3));

        res.status(200).json({ message: "Files uploaded successfully!", urls: uploadedFiles });

    } catch (error) {
        console.error("Error uploading files: ", error);
        res.status(500).json({ error: "Error uploading files" });
    }
};

















export const uploadFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const uploadedFiles = await Promise.all(req.files.map(uploadFileToS3));

        res.status(200).json({ message: "Files uploaded successfully!", urls: uploadedFiles });

    } catch (error) {
        console.error("Error uploading files: ", error);
        res.status(500).json({ error: "Error uploading files" });
    }
};

// export const uploadProfilePic = async (req, res) => {
//     try{

//     }
//     catch(error){

//     }
// }



export const getPresignedUrls = async (req, res) => {
    try {
        const { fileName } = req.params;
        if (!fileName) {
            return res.status(400).json({ error: "No fileName provided" });
        }

        const presignedUrl = await getPresignedUrl(fileName);
        res.status(200).json({ presignedUrl });

    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};









export const deleteFilesS3 = async (req, res) => {
    const { fileUrls } = req.body;

    if (Array.isArray(fileUrls)) {
        console.log("Everything is okay")
      } else {
        console.error("fileUrls is not an array:", fileUrls);
      }
      



    if (!fileUrls || fileUrls.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }

    try {
        await deleteFilesFromS3(fileUrls);
        res.status(200).json({ message: "Files deleted successfully" });

    } catch (error) {
        console.error("Error deleting files:", error);
        res.status(500).json({ error: "Server error" });
    }
};



/*
export const deleteTaskCommentFiles = async (req, res) => {
   
  
    const { fileUrls } = req.body;
  
    console.log("recieved", fileUrls);
    if (!fileUrls || fileUrls.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }
    try {

        const deleteParams = {
            Bucket: 'ankit-aws-sprint',
            Delete: {
                Objects: fileUrls.map((fileUrl) => ({ Key: fileUrl })),
            }
        };
        console.log(deleteParams);

        const dataa = await s3.send(new DeleteObjectsCommand(deleteParams));
        console.log("Files del sucfully", dataa);
        return res.status(200).json({ message: "Files deleted successfully" });
    } catch (error) {
        console.error("Error deleting files:", error);
        res.status(500).json({ error: "Il server error" });

    }
};
*/

// export const getPresignedUrls = async (req, res) => {

//         try {
//            console.log("received data", req.params);
           
//             const name = 'ankit-aws-sprint';
//             const { fileName } = req.params;
    
//             if (!fileName) {
//                 return res.status(400).json({ error: "No fileName provided" });
//             }
    
//             console.log("Generating presigned URL for:", fileName);
    
//             const key = fileName;
    
//             const command = new GetObjectCommand({
//                 Bucket: name,
//                 Key: key,
//                 ResponseContentDisposition: `attachment; filename="${key}"`
//             });
    
//             const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min expiry
    
//             console.log("Generated presigned URL:", presignedUrl);
    
//             // Ensure the URL is not malformed or incomplete
//             if (!presignedUrl || !presignedUrl.startsWith('https://')) {
//                 return res.status(500).json({ error: 'Failed to generate a valid presigned URL' });
//             }
    
            
    
//             res.json({ presignedUrl });
    
//         } catch (error) {
//             console.error("Error generating pre-signed URLs:", error);
//             res.status(500).json({ error: "Internal server error" });
//         }
    
// };