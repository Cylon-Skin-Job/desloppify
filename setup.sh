#!/usr/bin/env bash

##
## Desloppify Smart Setup Wizard
##
## Auto-detects project type and guides interactive setup
##

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root (where setup.sh was called from)
PROJECT_ROOT="$(pwd)"

# Detect desloppify directory (may be "desloppify" or ".desloppify")
if [ -d "${PROJECT_ROOT}/desloppify" ]; then
  DESLOPPIFY_DIR="${PROJECT_ROOT}/desloppify"
elif [ -d "${PROJECT_ROOT}/.desloppify" ]; then
  DESLOPPIFY_DIR="${PROJECT_ROOT}/.desloppify"
else
  DESLOPPIFY_DIR=""
fi

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛠️  Desloppify Smart Setup Wizard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"

## Step 1: Verify desloppify submodule exists

echo -e "${YELLOW}Step 1: Checking desloppify submodule...${NC}"

if [ -z "$DESLOPPIFY_DIR" ]; then
  echo -e "${RED}❌ Error: desloppify/ submodule not found${NC}"
  echo ""
  echo "Please run from project root after adding submodule:"
  echo "  git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify"
  echo "  git submodule update --init --recursive"
  exit 1
fi

# Check if submodule has content
if [ ! -d "$DESLOPPIFY_DIR/wisdom" ]; then
  echo -e "${YELLOW}⚠️  Submodule is empty. Initializing...${NC}"
  git submodule update --init --recursive
fi

echo -e "${GREEN}✅ Desloppify submodule found${NC}"

## Step 2: Auto-detect project type

echo ""
echo -e "${YELLOW}Step 2: Detecting project type...${NC}"

# Run detection script and extract JSON only (grep from opening brace to closing brace)
DETECTION_OUTPUT=$(node "$DESLOPPIFY_DIR/scripts/detect-project-type.mjs" "$PROJECT_ROOT" --json 2>/dev/null)
DETECTION_JSON=$(echo "$DETECTION_OUTPUT" | sed -n '/^{/,/^}$/p')

# Parse JSON (requires jq, but fall back to manual detection if not available)
if command -v jq &> /dev/null; then
  PROJECT_TYPE=$(echo "$DETECTION_JSON" | jq -r '.projectType')
  HAS_NPM=$(echo "$DETECTION_JSON" | jq -r '.hasNpm')
  HAS_EXPRESS=$(echo "$DETECTION_JSON" | jq -r '.techStack.express')
  HAS_FIREBASE=$(echo "$DETECTION_JSON" | jq -r '.techStack.firebase')
  HAS_ROUTES=$(echo "$DETECTION_JSON" | jq -r '.structure.hasRoutes')
else
  # Manual fallback
  if [ -f "$PROJECT_ROOT/package.json" ]; then
    HAS_NPM="true"
    PROJECT_TYPE="npm"
  else
    HAS_NPM="false"
    PROJECT_TYPE="vanilla"
  fi
  
  HAS_EXPRESS="false"
  HAS_FIREBASE="false"
  [ -d "$PROJECT_ROOT/routes" ] && HAS_ROUTES="true" || HAS_ROUTES="false"
fi

# Show detection results
node "$DESLOPPIFY_DIR/scripts/detect-project-type.mjs" "$PROJECT_ROOT"

## Step 3: Ask user to confirm setup level

echo ""
echo -e "${YELLOW}Step 3: Choose setup level${NC}"
echo ""
echo "Based on project detection, what would you like to install?"
echo ""
echo "  1) MINIMAL - Wisdom access only (no validators)"
echo "     ✅ /menu command"
echo "     ✅ Access to debug clues, insights, patterns"
echo "     ❌ No automated validation"
echo ""
echo "  2) STANDARD - Wisdom + validators (recommended for npm projects)"
echo "     ✅ Everything from MINIMAL"
echo "     ✅ Orchestrator (scripts/docs-check.js)"
echo "     ✅ Automated validation"
echo "     ✅ Session tracking"
echo ""
echo "  3) FULL - Complete infrastructure"
echo "     ✅ Everything from STANDARD"
echo "     ✅ Project documentation (00-project-context.mdc)"
echo "     ✅ Auto-generated rules (API, schema, etc.)"
echo "     ✅ Deploy playbook"
echo ""
read -p "Choose setup level (1/2/3): " SETUP_LEVEL

## Step 4: Execute setup based on level

case $SETUP_LEVEL in
  1)
    echo ""
    echo -e "${BLUE}Installing MINIMAL setup...${NC}"
    
    # Copy menu command
    mkdir -p "$PROJECT_ROOT/.cursor/commands"
    if [ ! -f "$PROJECT_ROOT/.cursor/commands/menu.md" ]; then
      cp "$DESLOPPIFY_DIR/templates/cursor-commands/menu.md.template" \
         "$PROJECT_ROOT/.cursor/commands/menu.md"
      echo -e "${GREEN}✅ Copied menu command${NC}"
    else
      echo -e "${YELLOW}⚠️  menu.md already exists (skipped)${NC}"
    fi
    
    echo -e "${GREEN}✅ MINIMAL setup complete!${NC}"
    echo ""
    echo "You can now:"
    echo "  - Type /menu in Cursor"
    echo "  - Access wisdom via /menu → 5 (Search Wisdom)"
    ;;
    
  2)
    echo ""
    echo -e "${BLUE}Installing STANDARD setup...${NC}"
    
    # Copy menu command (from MINIMAL)
    mkdir -p "$PROJECT_ROOT/.cursor/commands"
    if [ ! -f "$PROJECT_ROOT/.cursor/commands/menu.md" ]; then
      cp "$DESLOPPIFY_DIR/templates/cursor-commands/menu.md.template" \
         "$PROJECT_ROOT/.cursor/commands/menu.md"
      echo -e "${GREEN}✅ Copied menu command${NC}"
    fi
    
    # Copy orchestrator
    mkdir -p "$PROJECT_ROOT/scripts"
    if [ ! -f "$PROJECT_ROOT/scripts/docs-check.js" ]; then
      cp "$DESLOPPIFY_DIR/templates/scripts/docs-check.js.template" \
         "$PROJECT_ROOT/scripts/docs-check.js"
      echo -e "${GREEN}✅ Copied orchestrator${NC}"
      
      # TODO: Replace placeholders (needs project name, etc.)
      echo -e "${YELLOW}⚠️  Edit scripts/docs-check.js and replace {{PLACEHOLDERS}}${NC}"
    else
      echo -e "${YELLOW}⚠️  docs-check.js already exists (skipped)${NC}"
    fi
    
    # Copy session templates
    mkdir -p "$PROJECT_ROOT/desloppify-local/ledger/sessions"
    if [ ! -f "$PROJECT_ROOT/desloppify-local/ledger/sessions/README.md" ]; then
      cp -r "$DESLOPPIFY_DIR/templates/sessions/"* \
            "$PROJECT_ROOT/desloppify-local/ledger/sessions/"
      echo -e "${GREEN}✅ Copied session templates${NC}"
    fi
    
    # Copy config
    mkdir -p "$PROJECT_ROOT/desloppify-local/scripts"
    if [ ! -f "$PROJECT_ROOT/desloppify-local/scripts/docs-check.config.json" ]; then
      cp "$DESLOPPIFY_DIR/templates/scripts/docs-check.config.json.template" \
         "$PROJECT_ROOT/desloppify-local/scripts/docs-check.config.json"
      echo -e "${GREEN}✅ Copied config${NC}"
    fi
    
    echo -e "${GREEN}✅ STANDARD setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit scripts/docs-check.js (replace placeholders)"
    echo "  2. Run: npm run docs:check (if package.json exists)"
    echo "  3. Type /menu in Cursor"
    ;;
    
  3)
    echo ""
    echo -e "${BLUE}Installing FULL setup...${NC}"
    echo ""
    echo -e "${YELLOW}FULL setup requires AI assistance for interview.${NC}"
    echo -e "${YELLOW}Please use: /setup-desloppify command in Cursor${NC}"
    echo ""
    echo "Or manually complete STANDARD setup above, then add:"
    echo "  - .cursor/rules/00-project-context.mdc"
    echo "  - Project-specific generators"
    echo "  - Auto-generated rules"
    exit 0
    ;;
    
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

## Step 5: Verify setup

echo ""
echo -e "${YELLOW}Step 5: Verifying setup...${NC}"

node "$DESLOPPIFY_DIR/scripts/setup-check.mjs" "$PROJECT_ROOT"

## Done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

