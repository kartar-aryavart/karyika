#!/bin/bash
# 🧪 Quick test runner for Karyika
# Usage: bash tests/run-tests.sh [type]
# Types: smoke, regression, full, ui

TYPE=${1:-smoke}
echo "🧪 Running $TYPE tests..."

case $TYPE in
  smoke)
    echo "Running smoke tests (auth + navigation)..."
    npx playwright test tests/e2e/01-auth.test.js tests/e2e/03-navigation.test.js --reporter=list
    ;;
  regression)
    echo "Running regression tests (known bug fixes)..."
    npx playwright test tests/e2e/04-regression.test.js --reporter=list
    ;;
  tasks)
    echo "Running tasks tests..."
    npx playwright test tests/e2e/02-tasks.test.js --reporter=list
    ;;
  perf)
    echo "Running performance tests..."
    npx playwright test tests/e2e/05-performance.test.js --reporter=list
    ;;
  full)
    echo "Running ALL tests..."
    npx playwright test --reporter=html
    echo "Report: npx playwright show-report tests/report"
    ;;
  ui)
    echo "Opening Playwright UI..."
    npx playwright test --ui
    ;;
  *)
    echo "Unknown type. Use: smoke | regression | tasks | perf | full | ui"
    ;;
esac
