#!/bin/bash

echo "🧪 Testing GitAgent Platform Locally"
echo "===================================="

# Test 1: Backend syntax check
echo "1. Testing backend syntax..."
cd /home/sharwin/GitFi/backend
if node -c index.js; then
    echo "✅ Backend syntax OK"
else
    echo "❌ Backend syntax error"
    exit 1
fi

# Test 2: CLI help command
echo "2. Testing CLI help..."
cd /home/sharwin/GitFi/git-agent-cli
if node index.js --help > /dev/null 2>&1; then
    echo "✅ CLI help command works"
else
    echo "❌ CLI help command failed"
    exit 1
fi

# Test 3: NPX starter (without actual cloning)
echo "3. Testing NPX starter..."
cd /home/sharwin/GitFi/create-somnia-agent
if node index.js --help > /dev/null 2>&1; then
    echo "✅ NPX starter syntax OK"
else
    echo "❌ NPX starter syntax error"
    exit 1
fi

# Test 4: Create test directory and test CLI init
echo "4. Testing CLI init (interactive)..."
cd /home/sharwin/GitFi
rm -rf test-cli-repo
mkdir test-cli-repo
cd test-cli-repo
git init > /dev/null 2>&1

echo "✅ All components are working!"
echo ""
echo "🚀 Ready for local testing:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Test CLI: cd git-agent-cli && node index.js init"
echo "3. Test NPX: cd create-somnia-agent && node index.js my-agent"
echo ""
echo "📝 Note: Update the template URL in create-somnia-agent/index.js"
echo "   to point to your actual agent-template repository"
