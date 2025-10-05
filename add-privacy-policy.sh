#!/bin/bash

# Add Privacy Policy page to database

set -e

echo "📄 Adding Privacy Policy page to database..."

# Create the page content in JSON format
CONTENT='[{"type": "text", "content": "<h1>Privacy Policy</h1><p>Our comprehensive Privacy Policy is available at: <a href=\"/privacy-policy.html\" target=\"_blank\">Privacy Policy Page</a></p><p>By using this site, you agree to our privacy terms and user confidentiality agreement.</p>"}]'

# Insert or update the privacy-policy page
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 <<EOF
INSERT OR REPLACE INTO pages (name, content) 
VALUES ('privacy-policy', '$CONTENT');
EOF

echo "✅ Privacy Policy page added to database!"
echo ""
echo "You can access it at:"
echo "  - https://itsusi.eu/privacy-policy.html (static page)"
echo "  - https://itsusi.eu/api/pages/privacy-policy (API endpoint)"
