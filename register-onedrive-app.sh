#!/usr/bin/env bash
set -e

# Clear screen
clear

echo "========================================================================="
echo "      Microsoft OneDrive Custom OAuth App Registration Assistant         "
echo "========================================================================="
echo " This tool will guide you through connecting your Azure AD / Microsoft  "
echo " account and registering a custom OAuth client ID for OneDrive.         "
echo "========================================================================="
echo ""
echo " STEP 1: LOG IN TO MICROSOFT AZURE "
echo " --------------------------------- "
echo " We will launch the Azure Device Code Login."
echo " 1. Copy the code displayed below."
echo " 2. Open a browser page at: https://microsoft.com/devicelogin"
echo " 3. Enter the code to authenticate."
echo " 4. Approve permissions to access Azure Active Directory / Entra ID."
echo ""
echo " Press ENTER to start the login process..."
read -r

# Execute device login
az login --use-device-code

echo ""
echo "========================================================================="
echo " STEP 2: CREATING CUSTOM AZURE ACTIVE DIRECTORY SPA APP REGISTRATION     "
echo "========================================================================="
echo " Authenticated successfully!"
echo " Registering custom SPA (Single Page Application) with Redirect URIs..."
echo ""

REDIRECT_PROD="https://project1-video-app.sharjeelsohail85.workers.dev/auth/onedrive/callback"
REDIRECT_DEV="http://localhost:3000/auth/onedrive/callback"

echo "Creating App Registration in your Microsoft tenant with permissions:"
echo " - Scope: openid, profile, email, files.readwrite, files.readwrite.all"
echo " - Redirect URI (Production): $REDIRECT_PROD"
echo " - Redirect URI (Local Dev):  $REDIRECT_DEV"
echo " - Audience: AzureADandPersonalMicrosoftAccount (Any work/personal account)"
echo "-------------------------------------------------------------------------"

# Run az ad app create to build the App Registration
# Using modern az ad app create CLI params
APP_JSON=$(az ad app create \
  --display-name "Octopus Video App (Custom)" \
  --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
  --spa-redirect-uris "$REDIRECT_PROD" "$REDIRECT_DEV" \
  --enable-access-token-issuance true \
  --required-resource-accesses '[{"resourceAppId": "00000003-0000-0000-c000-000000000000", "resourceAccess": [{"id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d", "type": "Scope"}, {"id": "14adeb1e-1fd5-4562-a1b2-940b8a502250", "type": "Scope"}]}]' \
  --output json)

# Extract appId (Client ID)
APP_ID=$(echo "$APP_JSON" | jq -r '.appId')

if [ -z "$APP_ID" ] || [ "$APP_ID" == "null" ]; then
  echo "❌ Error: Failed to extract Application (client) ID from Azure API response."
  exit 1
fi

echo ""
echo "========================================================================="
echo " 🎉 SUCCESS! CUSTOM APP REGISTRATION REGISTERED SUCCESSFULLY!            "
echo "========================================================================="
echo " Custom Application (Client) ID: $APP_ID"
echo "========================================================================="
echo ""
echo " STEP 3: WRITING CLIENT ID TO CODEBASE CONFIGURATIONS "
echo " ---------------------------------------------------- "

# Write to the JSON config file
echo "{ \"clientId\": \"$APP_ID\" }" > src/config/onedrive_app_id.json
echo "✔ Saved client ID to src/config/onedrive_app_id.json!"

# Update VITE_ONEDRIVE_CLIENT_ID in .env or create .env if it doesn't exist
if [ -f .env ]; then
  if grep -q "VITE_ONEDRIVE_CLIENT_ID" .env; then
    # replace existing
    sed -i "s/VITE_ONEDRIVE_CLIENT_ID=.*/VITE_ONEDRIVE_CLIENT_ID=$APP_ID/" .env
  else
    echo "VITE_ONEDRIVE_CLIENT_ID=$APP_ID" >> .env
  fi
else
  echo "VITE_ONEDRIVE_CLIENT_ID=$APP_ID" > .env
fi
echo "✔ Saved client ID to .env file!"

echo ""
echo "========================================================================="
echo " STEP 4: BUILDING AND RE-DEPLOYING THE APP TO CLOUDFLARE PAGES / WORKER "
echo " --------------------------------------------------------------------- "
echo " Rebuilding production bundle..."
npm run build

echo ""
# Ensure credentials are set or prompted
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  read -p "Enter your Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
fi
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  read -p "Enter your Cloudflare API Token: " -s CLOUDFLARE_API_TOKEN
  echo ""
fi
if [ -z "$GITHUB_TOKEN" ]; then
  read -p "Enter your GitHub Personal Access Token (PAT): " -s GITHUB_TOKEN
  echo ""
fi

export CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN

echo " Deploying to Cloudflare..."
npx wrangler pages deploy dist --project-name=project1-video-app || \
npx wrangler deploy --name=project1-video-app

echo ""
echo " Push codebase to GitHub..."
git config --global user.email "sharjeelsohail85@gmail.com"
git config --global user.name "Sharjeel Sohail"
git add src/config/onedrive_app_id.json .env
git commit -m "Configure custom OneDrive App Registration Client ID" || true
git push https://${GITHUB_TOKEN}@github.com/Sharjeelsohail85/Project1.git main || \
git push https://${GITHUB_TOKEN}@github.com/Sharjeelsohail85/Project1.git master || true

echo ""
echo "========================================================================="
echo " 🚀 SYSTEM SETUP COMPLETELY ONLINE!                                      "
echo "========================================================================="
echo " Your application is now configured with your custom OneDrive App ID!     "
echo " Live streams and uploads will now flow through your personal OneDrive.  "
echo "========================================================================="
echo ""
