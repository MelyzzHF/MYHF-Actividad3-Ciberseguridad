terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region     = "us-east-1"
  access_key = "test"   # credenciales ficticias
  secret_key = "test"

  # No consultar servicios reales de AWS
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  # Necesario para LocalStack (bucket en la ruta, no en el subdominio)
  s3_use_path_style = true

  endpoints {
    s3 = "http://localhost:4566"
  }
}