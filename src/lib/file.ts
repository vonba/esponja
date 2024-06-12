import { PUBLIC_S3_BUCKET, PUBLIC_S3_REGION } from "$env/static/public";

export const getImageURL = (fileKey: string): string => {
  return `https://${PUBLIC_S3_BUCKET}.s3.${PUBLIC_S3_REGION}.amazonaws.com/${fileKey}`;
}