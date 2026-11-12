# 1. Bucket S3
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "actividad3-seguro-local"
}

# 2. Cifrado SSE-S3 (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "cifrado" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 3. Bloqueo de acceso público (los cuatro controles)
resource "aws_s3_bucket_public_access_block" "bloqueo_publico" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}