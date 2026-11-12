# MYHF-Actividad3-Ciberseguridad
Laboratorio de seguridad en la nube y desarrollo seguro, con tres partes independientes:

S3 seguro con LocalStack y Terraform (laboratorio/, terraform/): bucket cifrado y sin acceso público, desplegado en local sin tocar AWS real.
Análisis de imagen Docker con Trivy (lab-trivy/): escaneo de node:14 y mitigación con node:18.
API con 2FA y JWT (lab-jwt/): registro, Google Authenticator (TOTP) y endpoints protegidos, probada con OWASP ZAP.

Requisitos
Docker y Docker Compose, Terraform, AWS CLI v2, Node.js 18+, Trivy, OWASP ZAP (opcional), token de LocalStack y Google Authenticator. 

1. S3 con LocalStack y Terraform
cd laboratorio
Copy-Item .env.example .env        
docker compose up -d
curl.exe -s http://localhost:4566/_localstack/health

cd ..\terraform
terraform init
terraform validate
terraform plan                   
terraform apply

Crea el bucket actividad3-seguro-local con cifrado SSE-S3 (AES256) y los cuatro bloqueos de acceso público. El provider usa credenciales ficticias y el endpoint http://localhost:4566.

Comprobación con AWS CLI:

$env:AWS_ACCESS_KEY_ID="test"; $env:AWS_SECRET_ACCESS_KEY="test"; $env:AWS_DEFAULT_REGION="us-east-1"
$EP="--endpoint-url=http://localhost:4566"; $B="actividad3-seguro-local"

aws $EP s3api list-buckets
aws $EP s3api get-bucket-encryption --bucket $B
aws $EP s3api get-public-access-block --bucket $B
aws $EP s3 cp prueba.txt "s3://$B/"
aws $EP s3 cp "s3://$B/prueba.txt" descarga.txt --no-sign-request   # acceso anónimo
aws $EP s3api get-bucket-policy --bucket $B
LocalStack no replica todas las reglas de autorización de AWS, por lo que la descarga anónima puede permitirse aquí y denegarse en AWS real.
NoSuchBucketPolicy solo indica que no hay política adjunta; no prueba que el bucket sea público o privado.
2. Trivy
powershell
cd lab-trivy
docker build -t lab-node:14 .
trivy image node:14 --severity HIGH,CRITICAL
# Cambiar FROM node:14 por node:18 en el Dockerfile y repetir
docker build -t lab-node:18 .
trivy image node:18 --severity HIGH,CRITICAL

Reportes en trivy-node14.json y trivy-node18.json. node:14 muestra menos hallazgos en el sistema operativo porque su Debian ya no recibe datos de seguridad, no porque sea más seguro. Para una mitigación real conviene una versión LTS vigente y una imagen -slim o -alpine.

3. API con 2FA y JWT
powershell
cd lab-jwt
npm install
node crear-admin.js admin "UnaClaveSegura#2026"      # genera admin-qr.png para el Authenticator
$env:JWT_SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node server.js

Abre http://localhost:3000: registro → QR → código de 6 dígitos → bienvenida.
