#!/bin/bash

# 🚀 Workflow Project - Agent Deployment Launcher
# This script guides you through launching AI agents to build the project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is NOT installed"
        return 1
    fi
}

# Welcome banner
clear
echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║              🤖 WORKFLOW PROJECT - AGENT DEPLOYMENT LAUNCHER 🤖             ║
║                                                                              ║
║                  Transform 3 months of work into 5 days!                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
print_info "This script will guide you through launching AI agents to build your project"
echo ""
read -p "Press ENTER to continue..."

# Step 1: Check prerequisites
print_header "STEP 1: Checking Prerequisites"

ALL_OK=true

check_command "docker" || ALL_OK=false
check_command "docker-compose" || check_command "docker compose" || ALL_OK=false
check_command "git" || ALL_OK=false
check_command "gh" || ALL_OK=false
check_command "ao" || ALL_OK=false

echo ""

if [ "$ALL_OK" = false ]; then
    print_error "Some required tools are missing. Please install them first."
    echo ""
    print_info "Installation commands:"
    echo "  - Docker: https://docs.docker.com/get-docker/"
    echo "  - GitHub CLI: https://cli.github.com/"
    echo "  - Agent Orchestrator: Check your AO documentation"
    exit 1
else
    print_success "All prerequisites are installed!"
fi

echo ""
read -p "Press ENTER to continue..."

# Step 2: GitHub Authentication
print_header "STEP 2: GitHub Authentication"

if gh auth status &> /dev/null; then
    print_success "Already authenticated with GitHub"
else
    print_warning "Not authenticated with GitHub"
    echo ""
    print_info "Running: gh auth login"
    gh auth login
fi

echo ""
read -p "Press ENTER to continue..."

# Step 3: Push to GitHub
print_header "STEP 3: Push Initial Commit to GitHub"

print_info "Current commit: $(git log -1 --oneline)"
echo ""

read -p "Push to GitHub now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Pushing to origin/main..."
    if git push origin main; then
        print_success "Successfully pushed to GitHub!"
    else
        print_warning "Push failed. You may need to configure credentials or use SSH."
        print_info "You can do this manually later with: git push origin main"
    fi
else
    print_warning "Skipped push. Remember to push manually later!"
fi

echo ""
read -p "Press ENTER to continue..."

# Step 4: Create GitHub Issues
print_header "STEP 4: Create GitHub Issues"

print_info "This will create 24 issues in your repository"
echo ""

read -p "Create all issues now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f ".github/create-all-issues.sh" ]; then
        chmod +x .github/create-all-issues.sh
        print_info "Creating issues..."
        ./.github/create-all-issues.sh
        print_success "Issues created!"
    else
        print_error "Issue creation script not found!"
    fi
else
    print_warning "Skipped issue creation. You can run it later with:"
    echo "  ./.github/create-all-issues.sh"
fi

echo ""
read -p "Press ENTER to continue..."

# Step 5: Choose deployment strategy
print_header "STEP 5: Choose Deployment Strategy"

echo ""
echo "How do you want to deploy agents?"
echo ""
echo "  1) Conservative (Recommended for first time)"
echo "     - Start with 5 agents (Foundation wave)"
echo "     - Monitor progress"
echo "     - Launch next waves after completion"
echo ""
echo "  2) Aggressive (For experienced users)"
echo "     - Launch all 24 agents at once"
echo "     - Maximum parallelization"
echo "     - Requires more monitoring"
echo ""
echo "  3) Manual (I'll spawn agents myself)"
echo "     - Skip automatic spawning"
echo "     - You control everything"
echo ""

read -p "Choose strategy (1/2/3): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        print_info "Conservative strategy selected"
        echo ""
        print_info "Starting first wave: Foundation (5 agents)"
        echo "  - AUTH-001: JWT Authentication"
        echo "  - USERS-001: User Management"
        echo "  - DB-001: Database Schema"
        echo "  - REDIS-001: Caching"
        echo "  - REDIS-002: Job Queues"
        echo ""

        read -p "Spawn these 5 agents now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Spawning agents..."
            ao batch-spawn workflow AUTH-001 USERS-001 DB-001 REDIS-001 REDIS-002
            print_success "Agents spawned!"
            echo ""
            print_info "Next steps:"
            echo "  1. Monitor: http://localhost:3001 (dashboard)"
            echo "  2. Or run: ao status"
            echo "  3. When complete, launch Wave 2:"
            echo "     ao batch-spawn workflow TASKS-001 SCHEDULE-001 NOTIFY-001"
        fi
        ;;
    2)
        print_warning "Aggressive strategy selected - launching ALL 24 agents!"
        echo ""
        read -p "Are you sure? This will spawn 24 agents simultaneously (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Spawning ALL agents..."
            ao batch-spawn workflow \
              AUTH-001 USERS-001 TASKS-001 SCHEDULE-001 NOTIFY-001 REPORTS-001 \
              BOT-001 BOT-002 BOT-003 BOT-004 \
              FE-001 FE-002 FE-003 FE-004 FE-005 \
              DB-001 DB-002 REDIS-001 REDIS-002 \
              TEST-001 TEST-002 TEST-003 \
              CI-001 DEPLOY-001
            print_success "All 24 agents spawned!"
            echo ""
            print_warning "Monitor carefully! Check dashboard frequently."
        fi
        ;;
    3)
        print_info "Manual mode selected"
        echo ""
        print_info "Spawn agents manually with:"
        echo "  ao spawn workflow <ISSUE-ID>"
        echo "  ao batch-spawn workflow <ISSUE-1> <ISSUE-2> ..."
        echo ""
        print_info "See AGENT_ORCHESTRATION_PLAN.md for recommended waves"
        ;;
    *)
        print_warning "Invalid choice. Skipping agent spawning."
        ;;
esac

echo ""
read -p "Press ENTER to continue..."

# Step 6: Start Dashboard
print_header "STEP 6: Dashboard & Monitoring"

echo ""
print_info "The Agent Orchestrator dashboard helps you monitor all agents"
echo ""

# Check if dashboard is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "Dashboard is already running on port 3001"
    print_info "Open: http://localhost:3001"
else
    read -p "Start dashboard now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Starting dashboard on port 3001..."
        print_warning "Dashboard will run in the background"
        echo ""
        PORT=3001 ao start &
        sleep 2
        print_success "Dashboard started!"
        print_info "Open: http://localhost:3001"
    else
        print_info "You can start it later with: PORT=3001 ao start"
    fi
fi

echo ""
read -p "Press ENTER to continue..."

# Final summary
print_header "🎉 SETUP COMPLETE!"

echo ""
print_success "Your workflow project is ready for AI agent development!"
echo ""

echo -e "${CYAN}📊 What's Next:${NC}"
echo ""
echo "  1. 📈 Monitor Progress:"
echo "     - Dashboard: http://localhost:3001"
echo "     - Terminal: ao status"
echo "     - GitHub: https://github.com/endurohard/workflow/pulls"
echo ""
echo "  2. 🔍 Check Agent Sessions:"
echo "     - List: ao session ls -p workflow"
echo "     - Attach: ao session attach wor-1"
echo "     - Send message: ao send wor-1 \"your message\""
echo ""
echo "  3. 🌊 Launch Next Waves (if using conservative strategy):"
echo "     - Wave 2: ao batch-spawn workflow TASKS-001 SCHEDULE-001 NOTIFY-001"
echo "     - Wave 3: ao batch-spawn workflow BOT-001 BOT-002 BOT-003 BOT-004 FE-001 FE-002 FE-003 FE-004 FE-005"
echo "     - See AGENT_ORCHESTRATION_PLAN.md for details"
echo ""
echo "  4. 🧹 Cleanup When Done:"
echo "     - ao session cleanup -p workflow"
echo ""

echo -e "${CYAN}📚 Documentation:${NC}"
echo ""
echo "  - READY_TO_LAUNCH.md          - Complete launch guide"
echo "  - AGENT_ORCHESTRATION_PLAN.md - Detailed agent plan"
echo "  - QUICKSTART_AGENTS.md        - Quick reference"
echo "  - ISSUES_SUMMARY.md           - All 24 tasks"
echo "  - DEPLOYMENT_STATUS.md        - Current status"
echo ""

echo -e "${CYAN}💡 Pro Tips:${NC}"
echo ""
echo "  - Keep dashboard open in browser"
echo "  - Run 'watch -n 30 ao status' in another terminal"
echo "  - Trust the automated reactions (CI/Review)"
echo "  - Intervene only when necessary"
echo "  - Coffee break recommended ☕"
echo ""

print_header "Happy Building! 🚀✨"

echo ""
echo -e "${GREEN}The agents will handle the rest. Enjoy your coffee! ☕${NC}"
echo ""
