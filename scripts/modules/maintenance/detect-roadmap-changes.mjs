#!/usr/bin/env node

/**
 * @file detect-roadmap-changes.mjs
 * @description Detects roadmap/milestone changes in the current session
 * 
 * Helps with session-end workflow by:
 * - Finding modified roadmap files
 * - Detecting completed milestones
 * - Suggesting roadmap updates
 * - Tracking project progress
 * 
 * Usage:
 *   node scripts/detect-roadmap-changes.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

/**
 * Get all roadmap files
 * @returns {Array<string>}
 */
function getRoadmapFiles() {
  const docsDir = path.join(PROJECT_ROOT, 'docs');
  const files = [];
  
  if (!fs.existsSync(docsDir)) return files;
  
  const allFiles = fs.readdirSync(docsDir);
  
  for (const file of allFiles) {
    if (file.toUpperCase().includes('ROADMAP') && file.endsWith('.md')) {
      files.push(path.join('docs', file));
    }
  }
  
  return files;
}

/**
 * Get changed files from git status
 * @returns {Array<string>}
 */
function getChangedFiles() {
  try {
    const status = execSync('git status --short', { 
      cwd: PROJECT_ROOT,
      encoding: 'utf-8' 
    });
    
    return status.split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3));
  } catch (error) {
    return [];
  }
}

/**
 * Parse roadmap file for milestones
 * @param {string} filePath
 * @returns {Array<{name: string, status: string, phase: string}>}
 */
function parseRoadmap(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) return [];
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const milestones = [];
  
  let currentPhase = null;
  
  content.split('\n').forEach(line => {
    // Detect phase
    const phaseMatch = line.match(/##\s+(Phase \d+|Tier \d+|Milestone \d+|Step \d+):\s*(.+)/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[1] + ': ' + phaseMatch[2];
    }
    
    // Detect milestone status with checkboxes
    const checkboxMatch = line.match(/^[-*]\s+\[([ xX✓✅])\]\s+(.+)/);
    if (checkboxMatch) {
      const isComplete = checkboxMatch[1].trim() !== '';
      const name = checkboxMatch[2];
      
      milestones.push({
        name,
        status: isComplete ? 'complete' : 'incomplete',
        phase: currentPhase || 'General'
      });
    }
    
    // Detect status markers
    const statusMatch = line.match(/^[-*]\s+(✅|⚠️|🚧|❌)\s+(.+)/);
    if (statusMatch) {
      const emoji = statusMatch[1];
      const name = statusMatch[2];
      
      let status = 'unknown';
      if (emoji === '✅') status = 'complete';
      else if (emoji === '🚧') status = 'in-progress';
      else if (emoji === '⚠️') status = 'blocked';
      else if (emoji === '❌') status = 'cancelled';
      
      milestones.push({
        name,
        status,
        phase: currentPhase || 'General'
      });
    }
  });
  
  return milestones;
}

/**
 * Generate report
 */
function generateReport() {
  console.log('🗺️  Roadmap & Milestone Check\n');
  
  // Get all roadmap files
  const roadmapFiles = getRoadmapFiles();
  
  if (roadmapFiles.length === 0) {
    console.log('ℹ️  No roadmap files found in docs/\n');
    console.log('   (Looking for files with "ROADMAP" in name)\n');
    process.exit(0);
  }
  
  console.log(`📋 Found ${roadmapFiles.length} roadmap file(s):\n`);
  roadmapFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log('');
  
  // Get changed files
  const changedFiles = getChangedFiles();
  
  // Check which roadmaps were modified
  const modifiedRoadmaps = roadmapFiles.filter(roadmap => 
    changedFiles.includes(roadmap)
  );
  
  if (modifiedRoadmaps.length > 0) {
    console.log(`✏️  Modified Roadmaps (${modifiedRoadmaps.length}):\n`);
    
    for (const roadmap of modifiedRoadmaps) {
      console.log(`   📝 ${roadmap}`);
      
      const milestones = parseRoadmap(roadmap);
      const complete = milestones.filter(m => m.status === 'complete').length;
      const inProgress = milestones.filter(m => m.status === 'in-progress').length;
      const incomplete = milestones.filter(m => m.status === 'incomplete').length;
      
      console.log(`      - ${complete} complete, ${inProgress} in progress, ${incomplete} incomplete\n`);
    }
  } else {
    console.log('ℹ️  No roadmap files modified this session\n');
  }
  
  // Parse all roadmaps to show status
  console.log('📊 Roadmap Status Summary:\n');
  
  for (const roadmap of roadmapFiles) {
    const filename = path.basename(roadmap);
    const milestones = parseRoadmap(roadmap);
    
    if (milestones.length === 0) {
      console.log(`   ${filename}: No trackable milestones found`);
      continue;
    }
    
    const complete = milestones.filter(m => m.status === 'complete').length;
    const total = milestones.length;
    const percentage = Math.round((complete / total) * 100);
    
    let statusEmoji = '🚧';
    if (percentage === 100) statusEmoji = '✅';
    else if (percentage >= 75) statusEmoji = '🎯';
    else if (percentage >= 50) statusEmoji = '⚡';
    
    console.log(`   ${statusEmoji} ${filename}`);
    console.log(`      Progress: ${complete}/${total} (${percentage}%)`);
    
    // Show in-progress items
    const inProgress = milestones.filter(m => m.status === 'in-progress');
    if (inProgress.length > 0) {
      console.log(`      🚧 Active: ${inProgress.map(m => m.name).join(', ')}`);
    }
    
    console.log('');
  }
  
  // Suggestions
  console.log('💡 Suggestions:\n');
  
  if (modifiedRoadmaps.length > 0) {
    console.log('   ✅ You updated roadmap files - great job tracking progress!\n');
  } else {
    console.log('   • Did you complete any roadmap milestones this session?');
    console.log('   • Consider updating roadmap progress when you complete features\n');
  }
  
  // Exit code: 1 if should prompt user, 0 if no action needed
  const shouldPrompt = modifiedRoadmaps.length > 0 || 
                       roadmapFiles.some(r => parseRoadmap(r).some(m => m.status === 'in-progress'));
  
  process.exit(shouldPrompt ? 1 : 0);
}

generateReport();

