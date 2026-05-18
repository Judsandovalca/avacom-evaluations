#!/usr/bin/env bash
set -euo pipefail
STACK_NAME="${STACK_NAME:-avacom-cloudfront}"
STAGE="${STAGE:-prod}"
REGION="${REGION:-us-east-1}"
API_STACK="${API_STACK:-avacom}"

# Extract API Gateway domain from the backend stack outputs
API_URL=$(aws cloudformation describe-stacks --stack-name "$API_STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
API_DOMAIN=$(echo "$API_URL" | sed -e 's|https://||' -e 's|/$||')

echo "Deploying CloudFront pointing /api/* to $API_DOMAIN"

sam deploy -t infra/cloudfront-template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides ApiDomain="$API_DOMAIN" Stage="$STAGE"

echo ""
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs" --output table
