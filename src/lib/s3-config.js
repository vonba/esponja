import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { S3_ACCESS_KEY_ID } from '$env/static/private'
import { S3_SECRET_ACCESS_KEY } from '$env/static/private'
import { S3_REGION } from '$env/static/private'

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  }
});

export { 
  s3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand
};
