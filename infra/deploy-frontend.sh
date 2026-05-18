#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${STACK_NAME:-avacom-cloudfront}"
REGION="${REGION:-us-east-1}"

WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
DIST_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)

echo "Building frontend..."
cd frontend
npm ci
npm run build

echo "Uploading hashed assets with long cache..."
aws s3 sync dist/ "s3://$WEB_BUCKET" \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

echo "Uploading HTML with no-cache..."
aws s3 sync dist/ "s3://$WEB_BUCKET" \
  --exclude "*" --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --delete

echo "Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*"

DIST_DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)
echo ""
echo "Deployed. Visit: https://$DIST_DOMAIN"
