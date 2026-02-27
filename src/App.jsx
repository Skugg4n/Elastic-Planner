import React, { useEffect, useRef, useState } from 'react';
import { AlignLeft, AlertCircle, Bike, Book, Briefcase, Check, ChevronLeft, ChevronRight, Clock, Code, Coffee, Copy, Dumbbell, Edit3, FileText, Heart, MessageSquare, Music, Palette, PenTool, Plus, Save, Scissors, Settings, SplitSquareHorizontal, Star, Trash2, Upload, X, Zap } from 'lucide-react';

const APP_VERSION = '1.14.1';
const HOURS = Array.from({ length: 18 }, (_, i) => i + 7); // 07:00 - 24:00
const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const HOUR_HEIGHT = 4; // rem. 4rem = 1h.
const LOCAL_STORAGE_KEY = 'elastic-planner-weeks';
const CURRENT_WEEK_KEY = 'elastic-planner-current-week';
const PROJECT_HISTORY_KEY = 'elastic-planner-project-history';
const CATEGORIES_KEY = 'elastic-planner-categories';
const FLEX_KEY = 'elastic-planner-flex';
const DEFAULT_TEMPLATE_KEY = 'elastic-planner-default-template';
const BANK_KEY = 'elastic-planner-bank';

const COLOR_PALETTE = [
  { id: 'zinc-900', bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-900', iconColor: 'text-zinc-900', borderColor: 'border-zinc-900', doneStyle: 'bg-zinc-100 text-zinc-500 border-zinc-300 line-through opacity-75' },
  { id: 'blue-600', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', iconColor: 'text-blue-600', borderColor: 'border-blue-300', doneStyle: 'bg-blue-50 text-blue-600 border-blue-200 line-through opacity-75' },
  { id: 'red-600', bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', iconColor: 'text-red-600', borderColor: 'border-red-300', doneStyle: 'bg-red-50 text-red-600 border-red-200 line-through opacity-75' },
  { id: 'emerald-500', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', iconColor: 'text-emerald-600', borderColor: 'border-emerald-300', doneStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-75' },
  { id: 'amber-500', bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', iconColor: 'text-amber-600', borderColor: 'border-amber-300', doneStyle: 'bg-amber-50 text-amber-600 border-amber-200 line-through opacity-75' },
  { id: 'purple-600', bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', iconColor: 'text-purple-600', borderColor: 'border-purple-300', doneStyle: 'bg-purple-50 text-purple-600 border-purple-200 line-through opacity-75' },
  { id: 'pink-500', bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600', iconColor: 'text-pink-600', borderColor: 'border-pink-300', doneStyle: 'bg-pink-50 text-pink-600 border-pink-200 line-through opacity-75' },
  { id: 'zinc-200', bg: 'bg-zinc-200', text: 'text-zinc-900', border: 'border-zinc-300', iconColor: 'text-zinc-600', borderColor: 'border-zinc-300', doneStyle: 'bg-zinc-50 text-zinc-500 border-zinc-200 line-through opacity-75' },
];

const ICON_OPTIONS = ['Briefcase', 'PenTool', 'Zap', 'Coffee', 'Star', 'Heart', 'Music', 'Book', 'Code', 'Dumbbell', 'Bike', 'Palette'];

const DEFAULT_CATEGORIES = {
  creative: {
    id: 'creative',
    label: 'Bok',
    bg: 'bg-zinc-900',
    text: 'text-white',
    border: 'border-zinc-900',
    doneStyle: 'bg-zinc-100 text-zinc-500 border-zinc-300 line-through opacity-75',
    iconColor: 'text-zinc-900',
    borderColor: 'border-zinc-900',
    icon: 'PenTool',
    targetHoursPerWeek: null,
    weeklyGoalPoints: null,
  },
  job: {
    id: 'job',
    label: 'Jobb',
    bg: 'bg-zinc-200',
    text: 'text-zinc-900',
    border: 'border-zinc-300',
    doneStyle: 'bg-zinc-50 text-zinc-500 border-zinc-200 line-through opacity-75',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-300',
    icon: 'Briefcase',
    targetHoursPerWeek: 24,
    weeklyGoalPoints: null,
  },
  training: {
    id: 'training',
    label: 'Fys',
    bg: 'bg-red-600',
    text: 'text-white',
    border: 'border-red-700',
    doneStyle: 'bg-red-50 text-red-600 border-red-200 line-through opacity-75',
    iconColor: 'text-red-600',
    borderColor: 'border-red-300',
    icon: 'Zap',
    targetHoursPerWeek: null,
    weeklyGoalPoints: 10,
  },
  life: {
    id: 'life',
    label: 'Livet',
    bg: 'bg-emerald-500',
    text: 'text-white',
    border: 'border-emerald-600',
    doneStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-75',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
    icon: 'Coffee',
    targetHoursPerWeek: null,
    weeklyGoalPoints: null,
  },
};

const getCategoryIcon = (categoryId, size = 14, categories = DEFAULT_CATEGORIES) => {
  const category = categories[categoryId];
  if (!category) {
    return <Star size={size} />;
  }

  const iconName = category.icon || 'Star';
  const iconMap = {
    'Briefcase': <Briefcase size={size} />,
    'PenTool': <PenTool size={size} />,
    'Zap': <Zap size={size} fill="currentColor" />,
    'Coffee': <Coffee size={size} />,
    'Star': <Star size={size} />,
    'Heart': <Heart size={size} />,
    'Music': <Music size={size} />,
    'Book': <Book size={size} />,
    'Code': <Code size={size} />,
    'Dumbbell': <Dumbbell size={size} />,
    'Bike': <Bike size={size} />,
    'Palette': <Palette size={size} />,
  };

  return iconMap[iconName] || <Star size={size} />;
};

// Parse and render markdown checkboxes
const parseCheckboxes = (text) => {
  if (!text) return { hasCheckboxes: false, lines: [] };

  const lines = text.split('\n').map(line => {
    const uncheckedMatch = line.match(/^- \[ \] (.+)$/);
    const checkedMatch = line.match(/^- \[x\] (.+)$/);

    if (uncheckedMatch) {
      return { type: 'checkbox', checked: false, text: uncheckedMatch[1] };
    } else if (checkedMatch) {
      return { type: 'checkbox', checked: true, text: checkedMatch[1] };
    } else {
      return { type: 'text', text: line };
    }
  });

  const hasCheckboxes = lines.some(l => l.type === 'checkbox');
  return { hasCheckboxes, lines };
};

// Toggle checkbox in markdown text
const toggleCheckbox = (text, lineIndex) => {
  const lines = text.split('\n');
  const line = lines[lineIndex];

  if (line.match(/^- \[ \] /)) {
    lines[lineIndex] = line.replace(/^- \[ \] /, '- [x] ');
  } else if (line.match(/^- \[x\] /)) {
    lines[lineIndex] = line.replace(/^- \[x\] /, '- [ ] ');
  }

  return lines.join('\n');
};

// Parse training plan/template MD file
const parsePlanMD = (mdContent) => {
  const lines = mdContent.split('\n');
  const metadata = {
    title: '',
    type: 'plan',
    start: null,
    repeat: 'once',
    category: 'training',
  };

  const days = [];
  let currentDay = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse title
    if (line.startsWith('# ')) {
      metadata.title = line.substring(2).trim();
      continue;
    }

    // Parse metadata
    if (line.startsWith('Type:')) {
      metadata.type = line.substring(5).trim().toLowerCase();
      continue;
    }
    if (line.startsWith('Start:')) {
      metadata.start = line.substring(6).trim();
      continue;
    }
    if (line.startsWith('Repeat:')) {
      metadata.repeat = line.substring(7).trim().toLowerCase();
      continue;
    }
    if (line.startsWith('Category:')) {
      metadata.category = line.substring(9).trim().toLowerCase();
      continue;
    }

    // Parse day headers (## DAG 1, ## Måndag, etc)
    if (line.startsWith('## ')) {
      if (currentDay && currentSection) {
        days.push(currentDay);
      }
      currentDay = {
        name: line.substring(3).trim(),
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Parse blocks with time format: (9-12.30) Styrketräning
    const blockMatch = line.match(/^\((\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\)\s*(.+)$/);
    if (blockMatch && currentDay) {
      if (currentSection) {
        currentDay.sections.push(currentSection);
      }
      const [, startStr, endStr, title] = blockMatch;
      const start = parseFloat(startStr);
      const end = parseFloat(endStr);
      currentSection = {
        type: 'block',
        title: title.trim(),
        start,
        duration: end - start,
        items: [],
      };
      continue;
    }

    // Parse points with time format: @9.15 Armhävningar
    const pointMatch = line.match(/^@(\d+(?:\.\d+)?)\s*(.+)$/);
    if (pointMatch && currentDay) {
      if (currentSection) {
        currentDay.sections.push(currentSection);
      }
      const [, timeStr, title] = pointMatch;
      const timestamp = parseFloat(timeStr);
      currentSection = {
        type: 'point',
        title: title.trim(),
        timestamp,
        items: [],
      };
      continue;
    }

    // Start new section (activity name) - old format for backwards compatibility
    if (line && !line.startsWith('-') && currentDay && !line.startsWith('#') && !line.startsWith('(') && !line.startsWith('@')) {
      if (currentSection) {
        currentDay.sections.push(currentSection);
      }
      currentSection = {
        type: 'section',
        title: line,
        items: [],
      };
      continue;
    }

    // Parse checklist items
    if ((line.startsWith('- [ ]') || line.startsWith('- [x]')) && currentSection) {
      currentSection.items.push(line);
    } else if (line && currentSection && currentSection.items.length === 0) {
      // Non-checkbox text in section
      currentSection.items.push(line);
    }
  }

  // Add last section and day
  if (currentSection && currentDay) {
    currentDay.sections.push(currentSection);
  }
  if (currentDay) {
    days.push(currentDay);
  }

  return { metadata, days };
};

// Get ISO week number for a date
const getISOWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNum = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNum + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Get current ISO week number
const getCurrentWeek = () => {
  return getISOWeek(new Date());
};

// Get Monday's date for a given ISO week and year
const getMondayOfWeek = (weekNum, year) => {
  const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
};

// Get date for a specific day in a week (0 = Monday, 6 = Sunday)
const getDateForDay = (weekNum, dayIndex) => {
  const year = new Date().getFullYear();
  const monday = getMondayOfWeek(weekNum, year);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);
  return date;
};

// Format date as "6 jan"
const formatDate = (date) => {
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

const generateStandardWeek = (weekId) => {
  const blocks = [];
  let idCounter = 0;
  const createId = () => `${weekId}-${Date.now()}-${idCounter++}`;

  const add = (day, start, duration, type, label, status = 'planned', description = '') => {
    blocks.push({
      id: createId(),
      day,
      start,
      duration,
      type,
      label,
      status,
      description,
    });
  };

  [0, 2, 4].forEach((d) => {
    add(d, 8, 3, 'creative', 'Bok & Bild');
    add(d, 11.5, 0.5, 'life', 'Lunch');
    add(d, 12, 2, 'job', 'Jobb');
    add(d, 14, 2, 'job', 'Jobb');
    if (d !== 4) add(d, 16, 1, 'job', 'Jobb');
    if (d === 2) add(d, 20, 2, 'job', 'Kvällsbuffer', 'planned');
  });

  [1, 3].forEach((d) => {
    add(d, 8, 2, 'creative', 'Bok & Bild');
    add(d, 10, 1, 'training', d === 1 ? 'Styrka' : 'Kondition');
    add(d, 11.5, 0.5, 'life', 'Lunch');
    add(d, 12, 2, 'job', 'Jobb');
    add(d, 14, 2, 'job', 'Jobb');
    add(d, 16, 1, 'job', 'Jobb');
    add(d, 21, 1, 'training', 'Backup: Cykel', 'inactive');
  });

  add(5, 10, 2, 'training', 'Simhallen');

  return { calendar: blocks, points: {} };
};

const migrateLogs = (weeksData) => {
  // Migrate old logs to include categoryId based on type
  const migratedData = {};

  for (const [weekId, weekData] of Object.entries(weeksData)) {
    const migratedLogs = {};

    if (weekData.logs) {
      for (const [dayIndex, dayLogs] of Object.entries(weekData.logs)) {
        migratedLogs[dayIndex] = dayLogs.map((log) => {
          // If log already has categoryId, keep it
          if (log.categoryId) return log;

          // Migrate based on type
          const categoryId = log.type === 'zap' ? 'training' : 'life';
          return { ...log, categoryId };
        });
      }
    }

    migratedData[weekId] = {
      ...weekData,
      logs: migratedLogs,
    };
  }

  return migratedData;
};

const migrateToProjectTracking = (weeksData) => {
  // v1.4.0 -> v1.5.0: Add projectName and taskName to blocks and logs
  const migratedData = {};

  for (const [weekId, weekData] of Object.entries(weeksData)) {
    migratedData[weekId] = {
      calendar: (weekData.calendar || []).map((block) => ({
        ...block,
        projectName: block.projectName || null,
        taskName: block.taskName || null,
      })),
      bank: (weekData.bank || []).map((block) => ({
        ...block,
        projectName: block.projectName || null,
        taskName: block.taskName || null,
      })),
      logs: Object.entries(weekData.logs || {}).reduce((acc, [day, dayLogs]) => {
        acc[day] = dayLogs.map((log) => ({
          ...log,
          projectName: log.projectName || null,
          taskName: log.taskName || null,
        }));
        return acc;
      }, {}),
    };
  }

  return migratedData;
};

const migrateBankRemoval = (weeksData) => {
  // v1.7.1 -> v1.8.0: Remove bank from all weeks
  const migratedData = {};

  for (const [weekId, weekData] of Object.entries(weeksData)) {
    const bankBlocks = weekData.bank || [];

    if (bankBlocks.length > 0) {
      console.warn(`Migration v1.8.0: Week ${weekId} had ${bankBlocks.length} bank items - discarding as bank is removed`);
    }

    migratedData[weekId] = {
      calendar: weekData.calendar || [],
      logs: weekData.logs || {},
    };
  }

  return migratedData;
};

const migrateLogsToPoints = (weeksData) => {
  // v1.7.1 -> v1.8.0: Rename logs to points, add status field
  const migratedData = {};

  for (const [weekId, weekData] of Object.entries(weeksData)) {
    const points = {};

    if (weekData.logs) {
      for (const [dayIndex, dayLogs] of Object.entries(weekData.logs)) {
        points[dayIndex] = dayLogs.map((log) => ({
          id: log.id,
          day: parseInt(dayIndex),
          timestamp: log.timestamp,
          text: log.text,
          categoryId: log.categoryId,
          status: 'done',  // All existing logs are completed activities
          projectName: log.projectName || null,
          taskName: log.taskName || null,
        }));
      }
    }

    migratedData[weekId] = {
      calendar: weekData.calendar || [],
      points: points,
    };
  }

  return migratedData;
};

const migrateParallelId = (weeksData) => {
  // v1.11.0 -> v1.12.0: Add parallelId field to blocks
  const migratedData = {};

  for (const [weekId, weekData] of Object.entries(weeksData)) {
    migratedData[weekId] = {
      calendar: (weekData.calendar || []).map((block) => ({
        ...block,
        parallelId: block.parallelId || null,
      })),
      points: weekData.points || {},
    };
  }

  return migratedData;
};

const getInitialWeeksData = () => {
  if (typeof window === 'undefined') return { 1: generateStandardWeek(1) };
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        // Apply migrations in sequence
        let migrated = migrateLogs(parsed);
        migrated = migrateToProjectTracking(migrated);
        migrated = migrateBankRemoval(migrated);
        migrated = migrateLogsToPoints(migrated);
        migrated = migrateParallelId(migrated);
        return migrated;
      }
    } catch (e) {
      console.warn('Kunde inte läsa sparad planering, laddar standardvecka.', e);
    }
  }
  return { 1: generateStandardWeek(1) };
};

const getInitialWeekIndex = () => {
  if (typeof window === 'undefined') return 1;
  const stored = Number(localStorage.getItem(CURRENT_WEEK_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : 1;
};

const getInitialProjectHistory = () => {
  if (typeof window === 'undefined') {
    const projects = {};
    Object.keys(DEFAULT_CATEGORIES).forEach(id => {
      projects[id] = {};
    });
    return {
      projects,
      recentCombinations: [],
    };
  }

  const stored = localStorage.getItem(PROJECT_HISTORY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Kunde inte läsa projekthistorik');
    }
  }

  const projects = {};
  Object.keys(DEFAULT_CATEGORIES).forEach(id => {
    projects[id] = {};
  });
  return {
    projects,
    recentCombinations: [],
  };
};

const saveProjectHistory = (history) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(history));
  }
};

const updateProjectHistoryRecord = (history, categoryId, projectName, taskName) => {
  if (!projectName || !taskName) return history;

  const newHistory = { ...history };

  // Initialize category if needed
  if (!newHistory.projects[categoryId]) {
    newHistory.projects[categoryId] = {};
  }

  // Update or create project
  if (!newHistory.projects[categoryId][projectName]) {
    newHistory.projects[categoryId][projectName] = {
      lastUsed: Date.now(),
      usageCount: 1,
      tasks: [taskName],
    };
  } else {
    const project = newHistory.projects[categoryId][projectName];
    project.lastUsed = Date.now();
    project.usageCount = (project.usageCount || 0) + 1;
    if (!project.tasks.includes(taskName)) {
      project.tasks.push(taskName);
    }
  }

  // Update recent combinations
  const combo = { categoryId, projectName, taskName, lastUsed: Date.now() };
  newHistory.recentCombinations = [
    combo,
    ...newHistory.recentCombinations.filter(
      (c) => !(c.categoryId === categoryId && c.projectName === projectName && c.taskName === taskName)
    ),
  ].slice(0, 10); // Keep only last 10

  saveProjectHistory(newHistory);
  return newHistory;
};

const getProjectSuggestions = (history, categoryId, searchTerm) => {
  if (!history.projects[categoryId]) return [];

  const term = searchTerm.toLowerCase();
  const projects = history.projects[categoryId];

  return Object.entries(projects)
    .filter(([name]) => name.toLowerCase().includes(term))
    .map(([name, data]) => ({ name, usageCount: data.usageCount, lastUsed: data.lastUsed }))
    .sort((a, b) => {
      // Prefix matches score higher
      const aPrefix = a.name.toLowerCase().startsWith(term) ? 1 : 0;
      const bPrefix = b.name.toLowerCase().startsWith(term) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;
      // Then by usage count
      return b.usageCount - a.usageCount;
    })
    .slice(0, 5);
};

const getTaskSuggestions = (history, categoryId, projectName, searchTerm) => {
  if (!history.projects[categoryId] || !history.projects[categoryId][projectName]) return [];

  const term = searchTerm.toLowerCase();
  const tasks = history.projects[categoryId][projectName].tasks;

  return tasks
    .filter((task) => task.toLowerCase().includes(term))
    .sort((a, b) => {
      // Prefix matches score higher
      const aPrefix = a.toLowerCase().startsWith(term) ? 1 : 0;
      const bPrefix = b.toLowerCase().startsWith(term) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;
      return a.localeCompare(b);
    })
    .slice(0, 5);
};

const getRecentCombinations = (history, categoryId) => {
  return history.recentCombinations
    .filter((combo) => !categoryId || combo.categoryId === categoryId)
    .slice(0, 10);
};

// Report aggregation functions
const aggregateWeeksData = (weeksData, weekStart, weekEnd) => {
  const aggregated = {
    blocks: [],
    points: [],
  };

  for (let weekNum = weekStart; weekNum <= weekEnd; weekNum++) {
    const weekData = weeksData[weekNum];
    if (!weekData) continue;

    // Aggregate blocks from calendar
    aggregated.blocks.push(...(weekData.calendar || []));

    // Aggregate points
    Object.values(weekData.points || {}).forEach((dayPoints) => {
      aggregated.points.push(...dayPoints);
    });
  }

  return aggregated;
};

const generateReport = (weeksData, weekStart, weekEnd, filters) => {
  const { categoryId, projectName, taskName } = filters;
  const data = aggregateWeeksData(weeksData, weekStart, weekEnd);

  // Filter data
  let filteredBlocks = data.blocks;
  let filteredPoints = data.points;

  if (categoryId) {
    filteredBlocks = filteredBlocks.filter((b) => b.type === categoryId);
    filteredPoints = filteredPoints.filter((p) => p.categoryId === categoryId);
  }

  if (projectName) {
    filteredBlocks = filteredBlocks.filter((b) => b.projectName === projectName);
    filteredPoints = filteredPoints.filter((p) => p.projectName === projectName);
  }

  if (taskName) {
    filteredBlocks = filteredBlocks.filter((b) => b.taskName === taskName);
    filteredPoints = filteredPoints.filter((p) => p.taskName === taskName);
  }

  // Calculate totals
  const totalHours = filteredBlocks.reduce((sum, b) => sum + (b.status === 'done' ? b.duration : 0), 0);
  const totalPoints = filteredPoints.length;

  // Group by project
  const projectMap = {};

  filteredBlocks.forEach((block) => {
    if (!block.projectName) return;
    if (!projectMap[block.projectName]) {
      projectMap[block.projectName] = {
        name: block.projectName,
        hours: 0,
        pointCount: 0,
        tasks: {},
      };
    }
    if (block.status === 'done') {
      projectMap[block.projectName].hours += block.duration;
      if (block.taskName) {
        if (!projectMap[block.projectName].tasks[block.taskName]) {
          projectMap[block.projectName].tasks[block.taskName] = { name: block.taskName, hours: 0, pointCount: 0 };
        }
        projectMap[block.projectName].tasks[block.taskName].hours += block.duration;
      }
    }
  });

  filteredPoints.forEach((point) => {
    if (!point.projectName) return;
    if (!projectMap[point.projectName]) {
      projectMap[point.projectName] = {
        name: point.projectName,
        hours: 0,
        pointCount: 0,
        tasks: {},
      };
    }
    projectMap[point.projectName].pointCount++;
    if (point.taskName) {
      if (!projectMap[point.projectName].tasks[point.taskName]) {
        projectMap[point.projectName].tasks[point.taskName] = { name: point.taskName, hours: 0, pointCount: 0 };
      }
      projectMap[point.projectName].tasks[point.taskName].pointCount++;
    }
  });

  const byProject = Object.values(projectMap)
    .map((proj) => ({
      ...proj,
      tasks: Object.values(proj.tasks),
    }))
    .sort((a, b) => b.hours - a.hours);

  // Get all unique project and task names for filter dropdowns
  const allProjects = [...new Set([...data.blocks.map((b) => b.projectName), ...data.points.map((p) => p.projectName)])].filter(Boolean).sort();

  const allTasks = [
    ...new Set([...data.blocks.map((b) => b.taskName), ...data.points.map((p) => p.taskName)]),
  ].filter(Boolean).sort();

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    totalPoints,
    byProject,
    allProjects,
    allTasks,
  };
};

function ProjectTaskInput({ categoryId, initialProject = '', initialTask = '', projectHistory, onSave, onCancel }) {
  const [projectName, setProjectName] = useState(initialProject);
  const [taskName, setTaskName] = useState(initialTask);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  const projectInputRef = useRef(null);
  const taskInputRef = useRef(null);

  const projectSuggestions = getProjectSuggestions(projectHistory, categoryId, projectName);
  const taskSuggestions = getTaskSuggestions(projectHistory, categoryId, projectName, taskName);
  const recentCombos = getRecentCombinations(projectHistory, categoryId);

  useEffect(() => {
    projectInputRef.current?.focus();
  }, []);

  const handleSave = () => {
    onSave(projectName.trim(), taskName.trim());
  };

  return (
    <div className="project-task-input bg-white p-4 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      {/* Recent Combinations */}
      {recentCombos.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Senaste 10</h4>
          <div className="flex flex-wrap gap-2">
            {recentCombos.map((combo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProjectName(combo.projectName);
                  setTaskName(combo.taskName);
                  taskInputRef.current?.focus();
                }}
                className="text-xs bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded transition-colors"
              >
                {combo.projectName} / {combo.taskName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Project Name Input */}
      <div className="relative mb-3">
        <label className="block text-xs font-bold text-zinc-600 mb-1">Projekt</label>
        <input
          ref={projectInputRef}
          type="text"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            setShowProjectDropdown(true);
          }}
          onFocus={() => setShowProjectDropdown(true)}
          onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
          placeholder="t.ex. Tivoli 2"
          className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        {showProjectDropdown && projectSuggestions.length > 0 && projectName && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded shadow-lg max-h-40 overflow-y-auto">
            {projectSuggestions.map((proj, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProjectName(proj.name);
                  setShowProjectDropdown(false);
                  taskInputRef.current?.focus();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 flex justify-between items-center"
              >
                <span>{proj.name}</span>
                <span className="text-xs text-zinc-400">({proj.usageCount})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task Name Input */}
      <div className="relative mb-4">
        <label className="block text-xs font-bold text-zinc-600 mb-1">Uppgift</label>
        <input
          ref={taskInputRef}
          type="text"
          value={taskName}
          onChange={(e) => {
            setTaskName(e.target.value);
            setShowTaskDropdown(true);
          }}
          onFocus={() => setShowTaskDropdown(true)}
          onBlur={() => setTimeout(() => setShowTaskDropdown(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="t.ex. Skiss"
          className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        {showTaskDropdown && taskSuggestions.length > 0 && taskName && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded shadow-lg max-h-40 overflow-y-auto">
            {taskSuggestions.map((task, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTaskName(task);
                  setShowTaskDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
              >
                {task}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          Avbryt
        </button>
        <button
          onClick={handleSave}
          className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black transition-colors"
        >
          Spara
        </button>
      </div>
    </div>
  );
}

function ReportSidebar({ open, onClose, weeksData, currentWeekIndex, categories }) {
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterTask, setFilterTask] = useState('');
  const [weekStart, setWeekStart] = useState(currentWeekIndex);
  const [weekEnd, setWeekEnd] = useState(currentWeekIndex);

  const reportData = generateReport(weeksData, weekStart, weekEnd, {
    categoryId: filterCategory,
    projectName: filterProject,
    taskName: filterTask,
  });

  const handleExport = () => {
    const exportData = {
      dateRange: { weekStart, weekEnd },
      filters: { categoryId: filterCategory, projectName: filterProject, taskName: filterTask },
      ...reportData,
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projekt-rapport_v${weekStart}-${weekEnd}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[105]"
          onClick={onClose}
        />
      )}

      {/* Report Sidebar - Modernized */}
      <div
        className={`report-sidebar fixed top-0 left-0 h-full w-full sm:w-[420px] bg-zinc-50 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Modern Dark */}
        <div className="flex-none bg-zinc-900 p-5 border-b border-zinc-800 flex items-center gap-3">
          <AlertCircle className="text-white" size={20} />
          <h3 className="text-lg font-bold text-white tracking-tight flex-grow">Projektrapport</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Filters - Compact */}
        <div className="flex-none p-4 border-b border-zinc-200 bg-white">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900"
            >
              <option value="">Alla kategorier</option>
              {Object.values(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900"
            >
              <option value="">Alla projekt</option>
              {reportData.allProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterTask}
            onChange={(e) => setFilterTask(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900 mb-3"
          >
            <option value="">Alla uppgifter</option>
            {reportData.allTasks.map((task) => (
              <option key={task} value={task}>
                {task}
              </option>
            ))}
          </select>

          <div className="flex gap-2 items-center mb-2">
            <input
              type="number"
              min="1"
              value={weekStart}
              onChange={(e) => setWeekStart(parseInt(e.target.value) || 1)}
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900"
              placeholder="v"
            />
            <span className="text-zinc-400 text-xs">→</span>
            <input
              type="number"
              min="1"
              value={weekEnd}
              onChange={(e) => setWeekEnd(parseInt(e.target.value) || 1)}
              className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-900"
              placeholder="v"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setWeekStart(currentWeekIndex);
                setWeekEnd(currentWeekIndex);
              }}
              className="text-[10px] text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Nu
            </button>
            <button
              onClick={() => {
                setWeekStart(Math.max(1, currentWeekIndex - 3));
                setWeekEnd(currentWeekIndex);
              }}
              className="text-[10px] text-zinc-600 hover:text-zinc-900 font-medium"
            >
              4v
            </button>
            <button
              onClick={() => {
                setWeekStart(Math.max(1, currentWeekIndex - 11));
                setWeekEnd(currentWeekIndex);
              }}
              className="text-[10px] text-zinc-600 hover:text-zinc-900 font-medium"
            >
              12v
            </button>
          </div>
        </div>

        {/* Stats - Large Numbers */}
        <div className="flex-none p-4 border-b border-zinc-200 bg-white">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-white">{reportData.totalHours}<span className="text-sm font-normal">h</span></div>
              <div className="text-[10px] text-zinc-400 uppercase mt-1">Timmar</div>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-white">{reportData.totalPoints}</div>
              <div className="text-[10px] text-zinc-400 uppercase mt-1">Aktiviteter</div>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-black text-white">{reportData.byProject.length}</div>
              <div className="text-[10px] text-zinc-400 uppercase mt-1">Projekt</div>
            </div>
          </div>
        </div>

        {/* Report Data - Cleaner Cards */}
        <div className="flex-grow overflow-y-auto p-4">
          {reportData.byProject.length > 0 ? (
            <div className="space-y-3">
              {reportData.byProject.map((proj) => (
                <div key={proj.name} className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold text-zinc-900 mb-2">{proj.name}</div>
                  <div className="flex gap-4 text-xs text-zinc-600 mb-3">
                    <span className="font-bold">{proj.hours}h</span>
                    <span>{proj.pointCount} aktiviteter</span>
                  </div>
                  {proj.tasks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-zinc-100">
                      {proj.tasks.map((task) => (
                        <div key={task.name} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-zinc-700">{task.name}</span>
                          <span className="text-zinc-500">{task.hours}h · {task.pointCount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-400 italic py-12 text-sm">
              Inga projekt för vald period
            </div>
          )}
        </div>

        {/* Footer - Export */}
        <div className="flex-none p-4 border-t border-zinc-200 bg-white">
          <button
            onClick={handleExport}
            className="w-full bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Save size={16} />
            Exportera rapport (JSON)
          </button>
        </div>
      </div>
    </>
  );
}

export default function ElasticPlanner() {
  const [currentWeekIndex, setCurrentWeekIndex] = useState(getInitialWeekIndex);
  const [weeksData, setWeeksData] = useState(getInitialWeeksData);
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Fix corrupted category IDs (bug in v1.9.0-1.13.0 where COLOR_PALETTE.id overwrote category.id)
        const fixed = {};
        Object.entries(parsed).forEach(([key, cat]) => {
          fixed[key] = { ...cat, id: key };
        });
        return fixed;
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });

  const [draggedBlock, setDraggedBlock] = useState(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [editBlockModal, setEditBlockModal] = useState(null);
  const [logSidebarOpen, setLogSidebarOpen] = useState(false);
  const [selectedLogDay, setSelectedLogDay] = useState(null);
  const [logEntryModal, setLogEntryModal] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [templateDropdownDay, setTemplateDropdownDay] = useState(null);
  const [editingLogTime, setEditingLogTime] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [microMenuOpen, setMicroMenuOpen] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [selectedMicroCategory, setSelectedMicroCategory] = useState('life');
  const [selectedLogCategory, setSelectedLogCategory] = useState('life');
  const [addPointModalOpen, setAddPointModalOpen] = useState(false);
  const [pointText, setPointText] = useState('');
  const [pointTime, setPointTime] = useState('');
  const [pointCategory, setPointCategory] = useState('life');
  const [quickTrainingCount, setQuickTrainingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  const [presets, setPresets] = useState([
    { label: 'Hantlar (Set)', category: 'training', icon: 'zap' },
    { label: 'Abroller (Set)', category: 'training', icon: 'zap' },
    { label: 'Stretch (Kort)', category: 'life', icon: 'star' },
    { label: 'Promenad', category: 'life', icon: 'star' },
  ]);

  const [projectHistory, setProjectHistory] = useState(getInitialProjectHistory);
  const [reportSidebarOpen, setReportSidebarOpen] = useState(false);
  const [bankItems, setBankItems] = useState(() => {
    try {
      const saved = localStorage.getItem(BANK_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [bankOpen, setBankOpen] = useState(false);
  const [bankAddLabel, setBankAddLabel] = useState('');
  const [bankAddDuration, setBankAddDuration] = useState(1);
  const [bankAddCategory, setBankAddCategory] = useState('life');

  const fileInputRef = useRef(null);
  const realTodayIndex = (new Date().getDay() + 6) % 7;
  const isCurrentWeek = currentWeekIndex === getCurrentWeek();
  const todayIndex = isCurrentWeek ? realTodayIndex : -1; // -1 means no today indicator
  const currentData = weeksData[currentWeekIndex] || { calendar: [], points: {} };
  const { calendar, points } = currentData;

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weeksData));
  }, [weeksData]);

  useEffect(() => {
    localStorage.setItem(CURRENT_WEEK_KEY, String(currentWeekIndex));
  }, [currentWeekIndex]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(BANK_KEY, JSON.stringify(bankItems));
  }, [bankItems]);

  // Apply default template to new weeks
  useEffect(() => {
    if (!weeksData[currentWeekIndex]) {
      const defaultTemplate = localStorage.getItem(DEFAULT_TEMPLATE_KEY);
      if (defaultTemplate) {
        try {
          const template = JSON.parse(defaultTemplate);
          const newWeekData = { calendar: [], points: {} };

          // Apply template to all 7 days
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            template.blocks.forEach((block) => {
              newWeekData.calendar.push({
                ...block,
                id: `block-${Date.now()}-${Math.random()}`,
                day: dayIndex,
              });
            });

            newWeekData.points[dayIndex] = template.points.map((point) => ({
              ...point,
              id: `point-${Date.now()}-${Math.random()}`,
              day: dayIndex,
            }));
          }

          setWeeksData((prev) => ({
            ...prev,
            [currentWeekIndex]: newWeekData,
          }));
        } catch (e) {
          console.warn('Kunde inte tillämpa standardmall', e);
        }
      }
    }
  }, [currentWeekIndex, weeksData]);

  useEffect(() => {
    document.title = `Elastic Planner v${APP_VERSION}`;
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(now.getHours() + now.getMinutes() / 60);
    };
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLogSidebarOpen(false);
        setLogEntryModal(null);
        setNoteModal(null);
        setAddModal(null);
        setSettingsOpen(false);
        setMicroMenuOpen(false);
        setEditingLogId(null);
        setEditingLogTime(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockIds.length > 0) {
        const ids = new Set(selectedBlockIds);
        updateCurrentWeek(calendar.filter(b => !ids.has(b.id)), points);
        setSelectedBlockIds([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockIds, calendar, points]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !e.target.closest('.block-interactive') &&
        !e.target.closest('.action-menu') &&
        !e.target.closest('.add-modal') &&
        !e.target.closest('.bulk-menu') &&
        !e.target.closest('.note-modal') &&
        !e.target.closest('.log-sidebar') &&
        !e.target.closest('.log-entry-modal') &&
        !e.target.closest('.settings-modal') &&
        !e.target.closest('.micro-menu')
      ) {
        setSelectedBlockIds([]);
        setEditingLabelId(null);
        setAddModal(null);
        setNoteModal(null);
        setLogEntryModal(null);
        setSettingsOpen(false);
        setMicroMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!weeksData[currentWeekIndex]) {
      setWeeksData((prev) => ({ ...prev, [currentWeekIndex]: generateStandardWeek(currentWeekIndex) }));
    }
  }, [currentWeekIndex, weeksData]);

  const updateCurrentWeek = (newCalendar, newPoints) => {
    setWeeksData((prev) => ({
      ...prev,
      [currentWeekIndex]: {
        calendar: newCalendar,
        points: newPoints || prev[currentWeekIndex]?.points || {},
      },
    }));
  };

  // Template management functions
  const TEMPLATES_KEY = 'elastic-planner-templates';

  const listTemplates = () => {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : {};
  };

  const saveTemplate = (name, dayIndex) => {
    const templates = listTemplates();
    const dayBlocks = calendar.filter((b) => b.day === dayIndex);
    const dayPoints = points[dayIndex] || [];

    templates[name] = {
      name,
      blocks: dayBlocks.map((b) => ({ ...b, day: null })), // Remove day reference
      points: dayPoints.map((p) => ({ ...p, day: null })),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  };

  const applyTemplate = (templateName, dayIndex) => {
    const templates = listTemplates();
    const template = templates[templateName];
    if (!template) return;

    // Remove existing blocks and points for this day
    const newCalendar = calendar.filter((b) => b.day !== dayIndex);
    const newPoints = { ...points };
    delete newPoints[dayIndex];

    // Apply template blocks
    template.blocks.forEach((block) => {
      newCalendar.push({
        ...block,
        id: `block-${Date.now()}-${Math.random()}`,
        day: dayIndex,
      });
    });

    // Apply template points
    newPoints[dayIndex] = template.points.map((point) => ({
      ...point,
      id: `point-${Date.now()}-${Math.random()}`,
      day: dayIndex,
    }));

    updateCurrentWeek(newCalendar, newPoints);
    setTemplateDropdownDay(null);
  };

  const deleteTemplate = (templateName) => {
    const templates = listTemplates();
    delete templates[templateName];
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  };

  const saveAsDefaultTemplate = (dayIndex) => {
    const dayBlocks = calendar.filter((b) => b.day === dayIndex);
    const dayPoints = points[dayIndex] || [];

    const defaultTemplate = {
      name: `Mall sparad ${new Date().toLocaleDateString('sv-SE')}`,
      blocks: dayBlocks.map((b) => ({ ...b, day: null })),
      points: dayPoints.map((p) => ({ ...p, day: null })),
      setAt: new Date().toISOString(),
    };

    localStorage.setItem(DEFAULT_TEMPLATE_KEY, JSON.stringify(defaultTemplate));
    setTemplateDropdownDay(null);
  };

  const getDefaultTemplate = () => {
    try {
      const stored = localStorage.getItem(DEFAULT_TEMPLATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const clearDefaultTemplate = () => {
    if (confirm('Radera standardmallen?')) {
      localStorage.removeItem(DEFAULT_TEMPLATE_KEY);
    }
  };

  const resolveCollisions = (allBlocks, changedBlock) => {
    let blocks = [...allBlocks];
    let hasChanges = true;
    const MAX_LOOPS = 100;
    let loops = 0;

    while (hasChanges && loops < MAX_LOOPS) {
      hasChanges = false;
      loops++;
      blocks.sort((a, b) => a.start - b.start);
      for (let i = 0; i < blocks.length; i++) {
        const b1 = blocks[i];
        for (let j = i + 1; j < blocks.length; j++) {
          const b2 = blocks[j];
          if (b1.day === b2.day) {
            // Skip collision resolution for parallel blocks (they share a parallelId)
            if (b1.parallelId && b1.parallelId === b2.parallelId) {
              continue;
            }
            const b1End = b1.start + b1.duration;
            if (b2.start < b1End) {
              b2.start = b1End;
              hasChanges = true;
            }
          }
        }
      }
    }
    return blocks;
  };

  // Bank functions
  const addToBank = (blockId) => {
    const block = calendar.find(b => b.id === blockId);
    if (!block) return;

    const bankItem = {
      id: `bank-${Date.now()}`,
      label: block.label,
      type: block.type,
      duration: block.duration,
      projectName: block.projectName || null,
      taskName: block.taskName || null,
      addedAt: new Date().toISOString(),
    };

    setBankItems([...bankItems, bankItem]);
    updateCurrentWeek(calendar.filter(b => b.id !== blockId), points);
  };

  const removeFromBank = (bankItemId) => {
    setBankItems(bankItems.filter(item => item.id !== bankItemId));
  };

  const addBankItemToCalendar = (bankItemId, dayIndex, startHour) => {
    const bankItem = bankItems.find(item => item.id === bankItemId);
    if (!bankItem) return;

    const newBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      day: dayIndex,
      start: startHour,
      duration: bankItem.duration,
      type: bankItem.type,
      label: bankItem.label,
      status: 'planned',
      description: '',
      projectName: bankItem.projectName,
      taskName: bankItem.taskName,
    };

    const newCalendar = resolveCollisions([...calendar, newBlock], newBlock);
    updateCurrentWeek(newCalendar, points);
    removeFromBank(bankItemId);
  };

  const addQuickBankItem = () => {
    if (!bankAddLabel.trim()) return;

    const bankItem = {
      id: `bank-${Date.now()}`,
      label: bankAddLabel,
      type: bankAddCategory,
      duration: bankAddDuration,
      projectName: null,
      taskName: null,
      addedAt: new Date().toISOString(),
    };

    setBankItems([...bankItems, bankItem]);
    setBankAddLabel('');
    setBankAddDuration(1);
    setBankAddCategory('life');
  };

  const addPoint = (day, text, specificTime = null, categoryId = 'life', status = 'done', projectName = null, taskName = null) => {
    const currentPoints = points[day] || [];
    let timestamp;
    if (specificTime) {
      timestamp = specificTime;
    } else {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      timestamp = day === todayIndex ? currentHour : 12.0;
    }
    timestamp = Math.max(7, Math.min(23.9, timestamp));

    const newPoint = {
      id: `point-${Date.now()}`,
      day,
      timestamp,
      text,
      categoryId,
      status,  // 'planned' or 'done'
      projectName: projectName || null,
      taskName: taskName || null,
    };

    const newPoints = { ...points, [day]: [...currentPoints, newPoint] };
    updateCurrentWeek(calendar, newPoints);

    // Update project history if project info provided
    if (projectName && taskName) {
      const updatedHistory = updateProjectHistoryRecord(projectHistory, categoryId, projectName, taskName);
      setProjectHistory(updatedHistory);
    }
  };

  const removePoint = (day, pointId) => {
    const currentPoints = points[day] || [];
    const newDayPoints = currentPoints.filter((p) => p.id !== pointId);
    const newPoints = { ...points, [day]: newDayPoints };
    updateCurrentWeek(calendar, newPoints);
  };

  const togglePointStatus = (day, pointId) => {
    const currentPoints = points[day] || [];
    const newDayPoints = currentPoints.map((point) =>
      point.id === pointId
        ? { ...point, status: point.status === 'done' ? 'planned' : 'done' }
        : point
    );
    const newPoints = { ...points, [day]: newDayPoints };
    updateCurrentWeek(calendar, newPoints);
  };

  const updatePointCategory = (day, pointId, newCategoryId) => {
    const currentPoints = points[day] || [];
    const newDayPoints = currentPoints.map((point) =>
      point.id === pointId ? { ...point, categoryId: newCategoryId } : point
    );
    const newPoints = { ...points, [day]: newDayPoints };
    updateCurrentWeek(calendar, newPoints);
    setEditingLogId(null);
  };

  const updatePointTime = (day, pointId, newTime) => {
    const currentPoints = points[day] || [];
    const newDayPoints = currentPoints.map((point) =>
      point.id === pointId ? { ...point, timestamp: newTime } : point
    );
    const newPoints = { ...points, [day]: newDayPoints };
    updateCurrentWeek(calendar, newPoints);
    setEditingLogTime(null);
  };

  const handleResizeStart = (e, block) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggedBlock(block);
    setDropIndicator({ type: 'resize', startY: e.clientY, duration: block.duration, id: block.id });
    setSelectedBlockIds([]);
  };

  useEffect(() => {
    if (!dropIndicator || dropIndicator.type !== 'resize') return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dropIndicator.startY;
      const pixelsPerHour = 16 * HOUR_HEIGHT;
      const deltaHours = deltaY / pixelsPerHour;
      const rawNewDuration = dropIndicator.duration + deltaHours;
      const snappedDuration = Math.max(0.5, Math.round(rawNewDuration * 2) / 2);
      const updatedCalendar = calendar.map((b) => (b.id === dropIndicator.id ? { ...b, duration: snappedDuration } : b));
      updateCurrentWeek(updatedCalendar, points);
    };

    const handleMouseUp = () => {
      if (dropIndicator?.type !== 'resize') return;
      const block = calendar.find((b) => b.id === dropIndicator.id);
      if (block) {
        const newCalendar = autoParallelize(calendar, block);
        updateCurrentWeek(newCalendar, points);
      }
      setDraggedBlock(null);
      setDropIndicator(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dropIndicator, calendar, points]);

  const handleBlockClick = (e, blockId) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedBlockIds((prev) => (prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]));
    } else {
      setSelectedBlockIds((prev) => (prev.length === 1 && prev[0] === blockId ? [] : [blockId]));
    }
    setEditingLabelId(null);
  };

  const splitBlock = (block) => {
    if (block.duration < 1) return;
    const part1Duration = block.duration / 2;
    const part1 = { ...block, duration: part1Duration };
    const part2 = { ...block, id: `${block.id}-split`, start: block.start + part1Duration, duration: part1Duration };

    const newCalendar = calendar.filter((b) => b.id !== block.id);
    newCalendar.push(part1, part2);
    updateCurrentWeek(resolveCollisions(newCalendar, part1), points);
    setSelectedBlockIds([]);
  };

  const createParallelBlock = (block) => {
    // Create a shared parallelId for both blocks
    const parallelId = `parallel-${Date.now()}`;

    // Get the first available category (or 'life' as fallback)
    const defaultCategory = Object.keys(categories).length > 0 ? Object.keys(categories)[0] : 'life';

    // Create new parallel block with same day, start, duration as original
    const newBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      day: block.day,
      start: block.start,
      duration: block.duration,
      type: defaultCategory,
      label: 'Parallell',
      status: block.status,
      description: '',
      projectName: null,
      taskName: null,
      parallelId: parallelId,
    };

    // Update original block to have the same parallelId
    const updatedBlock = { ...block, parallelId: parallelId };

    // Replace original block and add new block (don't run resolveCollisions for parallel blocks)
    const newCalendar = calendar.map((b) => b.id === block.id ? updatedBlock : b);
    newCalendar.push(newBlock);

    updateCurrentWeek(newCalendar, points);
    setSelectedBlockIds([]);
  };

  const addNewBlock = (type, projectName = null, taskName = null) => {
    if (!addModal) return;
    const { day, hour } = addModal;
    const duration = 1;
    const newBlock = {
      id: `new-${Date.now()}`,
      day,
      start: hour,
      duration,
      type,
      label: categories[type].label,
      status: 'planned',
      description: '',
      projectName: projectName || null,
      taskName: taskName || null,
    };

    const newCalendar = [...calendar, newBlock];
    updateCurrentWeek(resolveCollisions(newCalendar, newBlock), points);

    // Update project history if project info provided
    if (projectName && taskName) {
      const updatedHistory = updateProjectHistoryRecord(projectHistory, type, projectName, taskName);
      setProjectHistory(updatedHistory);
    }

    setAddModal(null);
  };

  const handleMicroAdd = (label, categoryId = 'life') => {
    addPoint(todayIndex, label, null, categoryId);
    setMicroMenuOpen(false);
  };

  const handleCreatePoint = () => {
    if (!pointText.trim()) return;

    // Parse time (HH:MM format) to decimal
    let timestamp;
    if (pointTime) {
      const [hours, minutes] = pointTime.split(':').map(Number);
      timestamp = hours + minutes / 60;
    } else {
      // Default to current time
      timestamp = currentTime;
    }

    // Determine status based on time
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const status = timestamp > currentHour ? 'planned' : 'done';

    // Create point
    addPoint(todayIndex, pointText, timestamp, pointCategory, status);

    // Reset modal
    setPointText('');
    setPointTime('');
    setPointCategory('life');
    setQuickTrainingCount(0);
    setAddPointModalOpen(false);
  };

  const handleImportPlan = () => {
    // Hardcoded plan content (in future, read from file)
    const planContent = `# 10-dagars armhävningsplan
Type: plan
Start: 2026-01-08
Repeat: once
Category: training

## DAG 1
Armhävningar
- [x] 2×22 armhävningar
- [x] Bra. Stäng boken.

## DAG 2
Armhävningar
- [ ] 5×12
- [ ] 60 sek vila
- [ ] Perfekt form

Rörlighet
- [ ] Axlar, bröstrygg 5 min

## DAG 3
Löpning lätt
- [ ] 20–25 min lugnt
- [ ] Snacktempo

Armhävningar
- [ ] 3×15 lugnt

## DAG 4
Armhävningar volym
- [ ] 6×10
- [ ] Kort vila
- [ ] Sista repsen "nästan jobbiga"

Planka
- [ ] 2×60–90 sek

## DAG 5
Löpband intervall
- [ ] 4×400 m
- [ ] 12.0 km/h
- [ ] 90 sek gångvila

Ingen armhävningspress idag

## DAG 6
Armhävningar
- [ ] 4×14
- [ ] Samma tempo hela vägen
- [ ] Fokus: linje, andning

## DAG 7
VILA eller mycket lätt
- [ ] Promenad
- [ ] Rörlighet
- [ ] Inga tester

Detta är viktigt. Anpassning sker här.

## DAG 8
Armhävningar – testdag
- [ ] Uppvärmning
- [ ] 1 maxset
- [ ] Avbryt när tekniken hotas

Mål: 26–30

Oavsett siffra. Klart sen.

## DAG 9
Löpband skarpt
- [ ] Uppvärmning som vi pratade om
- [ ] 11.7 km/h – 2 km
- [ ] Ingen spurt

## DAG 10
Lätt armhävningspåminnelse
- [ ] 3×12
- [ ] Bara för att hålla nervsystemet "på"`;

    // Parse the plan
    const { metadata, days } = parsePlanMD(planContent);

    // Parse start date
    const startDate = new Date(metadata.start);

    // Create blocks and points for each day
    const newBlocks = [];
    const newPoints = [];
    days.forEach((day, dayIndex) => {
      // Calculate the date for this day
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + dayIndex);

      // Get day of week (0 = Monday, 6 = Sunday)
      const dayOfWeek = (dayDate.getDay() + 6) % 7;

      // Get ISO week number for this date
      const weekNum = getISOWeek(dayDate);

      // Process each section in the day
      day.sections.forEach((section, sectionIndex) => {
        const description = section.items.join('\n');

        if (section.type === 'block') {
          // Create block with specified time and duration
          const block = {
            id: `import-${Date.now()}-${dayIndex}-${sectionIndex}`,
            day: dayOfWeek,
            start: section.start,
            duration: section.duration,
            type: metadata.category,
            label: section.title,
            status: 'planned',
            description: description,
            projectName: null,
            taskName: null,
          };
          newBlocks.push({ block, weekNum });
        } else if (section.type === 'point') {
          // Create point with specified timestamp
          const point = {
            id: `import-point-${Date.now()}-${dayIndex}-${sectionIndex}`,
            day: dayOfWeek,
            timestamp: section.timestamp,
            text: section.title,
            categoryId: metadata.category,
            status: 'planned',
            projectName: null,
            taskName: null,
          };
          newPoints.push({ point, weekNum });
        } else {
          // Old format: create block without specified time
          const block = {
            id: `import-${Date.now()}-${dayIndex}-${sectionIndex}`,
            day: dayOfWeek,
            start: 8 + sectionIndex, // Stack sections at different hours
            duration: 1,
            type: metadata.category,
            label: section.title,
            status: 'planned',
            description: description,
            projectName: null,
            taskName: null,
          };
          newBlocks.push({ block, weekNum });
        }
      });
    });

    // Group blocks and points by week
    const blocksByWeek = {};
    const pointsByWeek = {};

    newBlocks.forEach(({ block, weekNum }) => {
      if (!blocksByWeek[weekNum]) blocksByWeek[weekNum] = [];
      blocksByWeek[weekNum].push(block);
    });

    newPoints.forEach(({ point, weekNum }) => {
      if (!pointsByWeek[weekNum]) pointsByWeek[weekNum] = {};
      if (!pointsByWeek[weekNum][point.day]) pointsByWeek[weekNum][point.day] = [];
      pointsByWeek[weekNum][point.day].push(point);
    });

    // Update weeks data
    const newWeeksData = { ...weeksData };

    // Add blocks
    Object.entries(blocksByWeek).forEach(([weekNum, blocks]) => {
      const weekIndex = parseInt(weekNum);
      if (!newWeeksData[weekIndex]) {
        newWeeksData[weekIndex] = { calendar: [], points: {} };
      }
      newWeeksData[weekIndex].calendar = [...newWeeksData[weekIndex].calendar, ...blocks];
    });

    // Add points
    Object.entries(pointsByWeek).forEach(([weekNum, weekPoints]) => {
      const weekIndex = parseInt(weekNum);
      if (!newWeeksData[weekIndex]) {
        newWeeksData[weekIndex] = { calendar: [], points: {} };
      }
      Object.entries(weekPoints).forEach(([dayIndex, dayPoints]) => {
        const existingPoints = newWeeksData[weekIndex].points[dayIndex] || [];
        newWeeksData[weekIndex].points[dayIndex] = [...existingPoints, ...dayPoints];
      });
    });

    setWeeksData(newWeeksData);
    setImportModalOpen(false);
  };

  const updateDescription = (blockId, text) => {
    const updateList = (list) => list.map((b) => (b.id === blockId ? { ...b, description: text } : b));
    updateCurrentWeek(updateList(calendar), points);
    setNoteModal(null);
  };

  const toggleStatus = (blockId) => {
    const toggle = (list) =>
      list.map((b) => (b.id === blockId ? { ...b, status: b.status === 'done' ? 'planned' : b.status === 'inactive' ? 'planned' : 'done' } : b));
    updateCurrentWeek(toggle(calendar), points);
    if (selectedBlockIds.length <= 1) setSelectedBlockIds([]);
  };

  const deleteBlock = (blockId) => {
    updateCurrentWeek(calendar.filter((b) => b.id !== blockId), points);
    setSelectedBlockIds([]);
  };

  const handleBulkDelete = () => {
    const ids = new Set(selectedBlockIds);
    const newCalendar = calendar.filter((b) => !ids.has(b.id));
    updateCurrentWeek(newCalendar, points);
    setSelectedBlockIds([]);
  };

  const handleBulkToggle = () => {
    const ids = new Set(selectedBlockIds);
    const toggle = (list) => list.map((b) => (ids.has(b.id) ? { ...b, status: 'done' } : b));
    updateCurrentWeek(toggle(calendar), points);
    setSelectedBlockIds([]);
  };

  const handleDragStart = (e, block) => {
    setDraggedBlock(block);
    setSelectedBlockIds([]);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dayIndex, hour) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const isBottomHalf = offsetY > rect.height / 2;
    const targetStart = isBottomHalf ? hour + 0.5 : hour;

    const hoverBlock = calendar.find((b) => b.day === dayIndex && b.start <= targetStart && b.start + b.duration > targetStart);

    if (hoverBlock && hoverBlock.type === draggedBlock.type && hoverBlock.id !== draggedBlock.id) {
      setDropIndicator({ day: dayIndex, hour: hoverBlock.start, type: 'merge', targetBlockId: hoverBlock.id });
    } else {
      setDropIndicator({ day: dayIndex, hour: targetStart, type: 'insert' });
    }
  };

  // Auto-parallelize: find overlapping blocks on the same day and make them parallel pairs
  const autoParallelize = (allBlocks, movedBlock) => {
    let blocks = [...allBlocks];
    const movedEnd = movedBlock.start + movedBlock.duration;

    // Find blocks on the same day that overlap with movedBlock (excluding itself and already-parallel partners)
    const overlapping = blocks.filter((b) =>
      b.id !== movedBlock.id &&
      b.day === movedBlock.day &&
      !(b.parallelId && b.parallelId === movedBlock.parallelId) &&
      b.start < movedEnd &&
      (b.start + b.duration) > movedBlock.start
    );

    if (overlapping.length > 0) {
      // Take the first overlapping block and make them parallel
      const partner = overlapping[0];
      const parallelId = `parallel-${Date.now()}`;

      blocks = blocks.map((b) => {
        if (b.id === movedBlock.id) return { ...b, parallelId };
        if (b.id === partner.id) return { ...b, parallelId };
        return b;
      });

      // For any remaining overlapping blocks beyond the first, still resolve collisions
      if (overlapping.length > 1) {
        blocks = resolveCollisions(blocks, movedBlock);
      }
      return blocks;
    }

    // No overlap – just resolve collisions normally
    return resolveCollisions(blocks, movedBlock);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedBlock || !dropIndicator || dropIndicator.type === 'resize') return;

    // Handle bank item drop
    if (draggedBlock.isFromBank) {
      addBankItemToCalendar(draggedBlock.id, dropIndicator.day, dropIndicator.hour);
      setDraggedBlock(null);
      setDropIndicator(null);
      return;
    }

    // Check if block is being dropped back to the same position
    const samePosition = dropIndicator.type === 'insert'
      && dropIndicator.day === draggedBlock.day
      && dropIndicator.hour === draggedBlock.start;

    if (samePosition) {
      // Cancel drag – leave everything as-is
      setDraggedBlock(null);
      setDropIndicator(null);
      return;
    }

    // Remove parallelId when dragging (unlink from old partner)
    const unlinkedBlock = { ...draggedBlock, parallelId: null };

    // Also unlink old partner if it existed
    let newCalendar = calendar.map((b) => {
      if (b.id === draggedBlock.id) return null; // will be re-added
      if (draggedBlock.parallelId && b.parallelId === draggedBlock.parallelId) {
        return { ...b, parallelId: null };
      }
      return b;
    }).filter(Boolean);

    if (dropIndicator.type === 'merge') {
      const target = newCalendar.find((b) => b.id === dropIndicator.targetBlockId);
      if (target) target.duration += unlinkedBlock.duration;
      newCalendar = resolveCollisions(newCalendar, target);
    } else {
      const newBlock = { ...unlinkedBlock, day: dropIndicator.day, start: dropIndicator.hour };
      newCalendar.push(newBlock);
      newCalendar = autoParallelize(newCalendar, newBlock);
    }

    updateCurrentWeek(newCalendar, points);
    setDraggedBlock(null);
    setDropIndicator(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(weeksData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planering_backup_v${APP_VERSION}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setWeeksData(imported);
        alert('Laddat!');
      } catch (err) {
        alert('Fel format!');
        console.error('Importfel', err);
      }
    };
    reader.readAsText(file);
  };

  // Count points per category for the week (defensive: ensure each day's value is an array)
  const weekPoints = Object.values(points || {}).filter(Array.isArray).flat();
  const pointsByCategory = Object.keys(categories).reduce((acc, catId) => {
    acc[catId] = weekPoints.filter((p) => p.categoryId === catId).length;
    return acc;
  }, {});
  const totalWeekPoints = weekPoints.length;

  // Cumulative flex: sum done hours vs target across ALL weeks for categories with targets
  const cumulativeFlex = {};
  Object.values(categories).forEach(cat => {
    if (!cat.targetHoursPerWeek) return;
    let totalDone = 0;
    let weekCount = 0;
    Object.values(weeksData).forEach(weekData => {
      if (!weekData.calendar) return;
      const weekDone = weekData.calendar
        .filter(b => b.type === cat.id && b.status === 'done')
        .reduce((a, b) => a + b.duration, 0);
      // Only count weeks that have any blocks for this category (to avoid counting empty weeks)
      if (weekDone > 0 || weekData.calendar.some(b => b.type === cat.id)) {
        totalDone += weekDone;
        weekCount++;
      }
    });
    const totalTarget = weekCount * cat.targetHoursPerWeek;
    cumulativeFlex[cat.id] = {
      totalDone: Math.round(totalDone * 10) / 10,
      totalTarget: Math.round(totalTarget * 10) / 10,
      diff: Math.round((totalDone - totalTarget) * 10) / 10,
      weekCount,
    };
  });

  // Calculate training goal progress for categories with weeklyGoalPoints
  const trainingGoals = {};
  Object.values(categories).forEach(cat => {
    if (!cat.weeklyGoalPoints) return;
    const trainingPoints = weekPoints.filter(p => p.categoryId === cat.id).length;
    const trainingBlockHours = calendar.filter(b => b.type === cat.id && b.status === 'done').reduce((a, b) => a + b.duration, 0);
    const currentGoalPoints = trainingPoints + Math.round(trainingBlockHours * 2);
    const weeklyGoal = cat.weeklyGoalPoints;
    const isGoalMet = currentGoalPoints >= weeklyGoal;
    trainingGoals[cat.id] = {
      currentPoints: currentGoalPoints,
      goalPoints: weeklyGoal,
      trainingPoints,
      trainingBlockHours,
      isGoalMet
    };
  });

  return (
    <div className="h-screen bg-zinc-50 font-sans text-zinc-900 select-none flex flex-col overflow-hidden">
      <header className="bg-white border-b border-zinc-200 shadow-sm flex-none z-50">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-full px-2 py-1">
              v{APP_VERSION}
            </span>
            <div className="flex items-center bg-zinc-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentWeekIndex(Math.max(1, currentWeekIndex - 1))}
                className="hover:bg-white rounded p-1"
                aria-label="Föregående vecka"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold w-20 text-center">V.{currentWeekIndex}</span>
              <button
                onClick={() => setCurrentWeekIndex(currentWeekIndex + 1)}
                className="hover:bg-white rounded p-1"
                aria-label="Nästa vecka"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={() => setCurrentWeekIndex(getCurrentWeek())}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              aria-label="Hoppa till idag"
            >
              Idag
            </button>
            <button
              onClick={() => setReportSidebarOpen(true)}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              aria-label="Öppna projektrapport"
            >
              📊 Rapport
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Inställningar"
            >
              <Settings size={16} />
            </button>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex gap-1">
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-900 px-2 py-1 hover:bg-blue-50 rounded"
              >
                📥 Import
              </button>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            {Object.values(categories).map(cat => {
              const done = Math.round(calendar.filter(b => b.type === cat.id && b.status === 'done').reduce((a, b) => a + b.duration, 0) * 10) / 10;
              const total = Math.round(calendar.filter(b => b.type === cat.id).reduce((a, b) => a + b.duration, 0) * 10) / 10;
              if (total === 0 && !cat.targetHoursPerWeek) return null;
              return <StatPill key={cat.id} label={cat.label} current={done} total={total} unit="h" target={cat.targetHoursPerWeek} warnBelowTarget={!!cat.targetHoursPerWeek} cumFlex={cumulativeFlex[cat.id]} />;
            })}
            {totalWeekPoints > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                  Punkter
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tighter text-yellow-600">{totalWeekPoints}</span>
                  <div className="flex gap-1 text-[9px]">
                    {Object.values(categories).map(cat => {
                      const count = weekPoints.filter(p => p.categoryId === cat.id).length;
                      if (count === 0) return null;
                      const isTraining = cat.id === 'training';
                      return <span key={cat.id} className={`${isTraining ? 'font-bold text-red-600' : cat.iconColor}`}>⚡{count}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}
            {Object.entries(trainingGoals).map(([catId, goal]) => {
              const cat = categories[catId];
              if (!cat) return null;
              const progress = Math.min(100, (goal.currentPoints / goal.goalPoints) * 100);
              return (
                <div key={catId} className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-red-400">Fys-mål</span>
                    {goal.isGoalMet && <span className="text-lg">🏆</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-red-600">{goal.currentPoints}</span>
                    <span className="text-[10px] text-zinc-400">/ {goal.goalPoints}p</span>
                  </div>
                  <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col overflow-hidden relative">
        <div className="flex-grow overflow-auto p-2">
          <div className="grid grid-cols-8 gap-0 min-w-[960px] border-l border-zinc-200 bg-white">
            <div className="col-span-1 border-r border-zinc-200 bg-white sticky left-0 z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
              <div className="h-10 border-b border-zinc-100 bg-zinc-50" />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="border-b border-zinc-50 text-[10px] font-medium text-zinc-400 pr-2 pt-1 text-right"
                  style={{ height: `${HOUR_HEIGHT}rem` }}
                >
                  {h}:00
                </div>
              ))}
            </div>

            {DAYS.map((dayName, dIndex) => {
              const isToday = dIndex === todayIndex;
              const dayBlocks = calendar.filter((b) => b.day === dIndex);
              const dayPoints = points[dIndex] || [];
              const groupedPoints = dayPoints.reduce((acc, point) => {
                const existingGroup = acc.find((g) => Math.abs(g.timestamp - point.timestamp) < 0.25);
                if (existingGroup) {
                  existingGroup.count++;
                  existingGroup.items.push(point);
                } else {
                  acc.push({ ...point, count: 1, items: [point] });
                }
                return acc;
              }, []);

              const pointCount = dayPoints.length;
              const isSuperDay = pointCount >= 4;
              const trainingPointCount = dayPoints.filter(p => p.categoryId === 'training').length;
              const hasTrainingFire = trainingPointCount >= 3;

              const dayCategoryStats = Object.entries(categories).map(([catId, cat]) => {
                const blocks = dayBlocks.filter((b) => b.type === catId);
                const doneHours = blocks.filter(b => b.status === 'done').reduce((a, b) => a + b.duration, 0);
                return { catId, label: cat.label, blocks, doneHours, hasDone: blocks.some(b => b.status === 'done') };
              }).filter(s => s.blocks.length > 0);

              return (
                <div
                  key={dIndex}
                  className={`col-span-1 relative border-r border-zinc-100 group ${isToday ? 'bg-blue-50/30' : ''}`}
                >
                  <div
                    className={`h-10 flex flex-col items-center justify-center border-b border-zinc-200 sticky top-0 z-20 ${isSuperDay ? 'bg-yellow-100 text-yellow-900 border-yellow-300' : isToday ? 'bg-blue-100/80 text-blue-900' : 'bg-zinc-50 text-zinc-500'} transition-colors duration-500`}
                  >
                    <div className="flex items-center justify-between w-full px-2">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col items-start leading-none">
                          <span className="text-xs font-bold uppercase">{dayName}</span>
                          <span className="text-[10px] font-normal opacity-70">{formatDate(getDateForDay(currentWeekIndex, dIndex))}</span>
                        </div>
                        {isToday && !isSuperDay && (
                          <span className="bg-blue-600 text-white text-[8px] font-bold px-1 rounded-sm">IDAG</span>
                        )}
                        {isSuperDay && (
                          <span className="bg-yellow-500 text-white text-[8px] font-bold px-1 rounded-sm flex items-center">
                            ⭐ PEPP!
                          </span>
                        )}
                        {hasTrainingFire && (
                          <span className="text-lg">🔥</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <button
                            onClick={() => setTemplateDropdownDay(templateDropdownDay === dIndex ? null : dIndex)}
                            className="p-0.5 rounded transition-all hover:scale-110 text-zinc-400 hover:text-zinc-600"
                            title="Mallar"
                          >
                            <FileText size={14} />
                          </button>
                          {templateDropdownDay === dIndex && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl p-2 w-48 z-[100] border border-zinc-200">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    const name = prompt('Mallnamn:');
                                    if (name) {
                                      saveTemplate(name, dIndex);
                                      setTemplateDropdownDay(null);
                                    }
                                  }}
                                  className="text-left px-2 py-1.5 hover:bg-zinc-50 rounded text-xs font-bold text-zinc-700"
                                >
                                  + Spara som mall
                                </button>
                                <button
                                  onClick={() => {
                                    saveAsDefaultTemplate(dIndex);
                                  }}
                                  className="text-left px-2 py-1.5 hover:bg-amber-50 rounded text-xs font-bold text-amber-700"
                                  title="Kommer att tillämpas på alla nya veckor"
                                >
                                  🗂️ Ställ in som veckomall
                                </button>
                                <div className="border-t border-zinc-100 my-1" />
                                {Object.keys(listTemplates()).length === 0 ? (
                                  <div className="text-xs text-zinc-400 italic px-2 py-1">Inga mallar</div>
                                ) : (
                                  Object.values(listTemplates()).map((template) => (
                                    <div key={template.name} className="flex items-center justify-between group/template">
                                      <button
                                        onClick={() => applyTemplate(template.name, dIndex)}
                                        className="flex-grow text-left px-2 py-1.5 hover:bg-blue-50 rounded text-xs font-bold text-zinc-700"
                                      >
                                        {template.name}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`Radera mall "${template.name}"?`)) {
                                            deleteTemplate(template.name);
                                            setTemplateDropdownDay(null);
                                          }
                                        }}
                                        className="opacity-0 group-hover/template:opacity-100 p-1 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedLogDay(dIndex);
                            setLogSidebarOpen(true);
                          }}
                          className={`p-0.5 rounded transition-all hover:scale-110 ${
                            pointCount > 0 ? 'text-yellow-500 font-bold' : 'text-zinc-300 hover:text-zinc-500'
                          }`}
                          aria-label="Öppna punkter"
                        >
                          <div className="flex items-center">
                            {pointCount > 0 ? pointCount : ''}
                            <Zap size={14} fill={pointCount > 0 ? 'currentColor' : 'none'} />
                          </div>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 text-[8px] font-bold opacity-70">
                      {dayCategoryStats.map(s => (
                        <span key={s.catId} className={s.hasDone ? 'text-black' : ''}>
                          {s.label.substring(0, 1)}:{s.doneHours}h
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="relative" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className="border-b border-zinc-50 w-full relative group/cell hover:bg-black/5 transition-colors"
                        style={{ height: `${HOUR_HEIGHT}rem` }}
                        onDragOver={(e) => handleDragOver(e, dIndex, h)}
                      >
                        {!calendar.some((b) => b.day === dIndex && b.start <= h && b.start + b.duration > h) && (
                          <button
                            onClick={() => setAddModal({ day: dIndex, hour: h })}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-zinc-300 hover:text-zinc-500"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    {dropIndicator && dropIndicator.day === dIndex && dropIndicator.type !== 'resize' && (
                      <div
                        className={`absolute left-0 right-0 pointer-events-none z-40 ${
                          dropIndicator.type === 'merge' ? 'border-2 border-blue-500 bg-blue-500/20' : 'h-0.5 bg-blue-600'
                        }`}
                        style={{
                          top: `${(dropIndicator.hour - 7) * HOUR_HEIGHT}rem`,
                          height:
                            dropIndicator.type === 'merge'
                              ? `${(calendar.find((b) => b.id === dropIndicator.targetBlockId)?.duration || 1) * HOUR_HEIGHT}rem`
                              : '2px',
                        }}
                      />
                    )}

                    {isToday && currentTime >= 7 && currentTime <= 24 && (
                      <div
                        className="absolute left-0 right-0 pointer-events-none z-50 flex items-center"
                        style={{ top: `${(currentTime - 7) * HOUR_HEIGHT}rem` }}
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full -ml-1" />
                        <div className="flex-grow h-0.5 bg-blue-600" />
                      </div>
                    )}

                    {calendar
                      .filter((b) => b.day === dIndex)
                      .map((block) => {
                        // Determine if this is a parallel block and its position
                        let isParallel = false;
                        let parallelPosition = null;

                        if (block.parallelId) {
                          isParallel = true;
                          // Find the partner block to determine order
                          const partner = calendar.find(b => b.id !== block.id && b.parallelId === block.parallelId && b.day === dIndex);
                          if (partner) {
                            // Compare by start time, then by ID for tie-breaking
                            if (block.start < partner.start || (block.start === partner.start && block.id < partner.id)) {
                              parallelPosition = 'left';
                            } else {
                              parallelPosition = 'right';
                            }
                          }
                        }

                        return (
                          <Block
                            key={block.id}
                            block={block}
                            isSelected={selectedBlockIds.includes(block.id)}
                            isEditing={editingLabelId === block.id}
                            isParallel={isParallel}
                            parallelPosition={parallelPosition}
                            onClick={(e) => handleBlockClick(e, block.id)}
                            onDragStart={(e) => {
                              // Remove parallelId when dragging
                              const unlinkedBlock = { ...block, parallelId: null };
                              handleDragStart(e, unlinkedBlock);
                            }}
                            onResizeStart={handleResizeStart}
                            categories={categories}
                            onUpdateLabel={(lbl) => {
                              const u = (l) => l.map((b) => (b.id === block.id ? { ...b, label: lbl } : b));
                              updateCurrentWeek(u(calendar), points);
                              setEditingLabelId(null);
                            }}
                            onAction={(action) => {
                              if (action === 'toggle') toggleStatus(block.id);
                              if (action === 'split') splitBlock(block);
                              if (action === 'parallel') createParallelBlock(block);
                              if (action === 'duplicate') {
                                const newBlock = { ...block, id: `block-${Date.now()}`, start: block.start + block.duration, status: 'planned', parallelId: null };
                                updateCurrentWeek(resolveCollisions([...calendar, newBlock], newBlock), points);
                              }
                              if (action === 'tobank') addToBank(block.id);
                              if (action === 'edit') {
                                setEditBlockModal({
                                  blockId: block.id,
                                  label: block.label || '',
                                  description: block.description || '',
                                  type: block.type,
                                  status: block.status,
                                  start: block.start,
                                  duration: block.duration,
                                  projectName: block.projectName || '',
                                  taskName: block.taskName || '',
                                });
                                setSelectedBlockIds([]);
                              }
                              if (action === 'delete') {
                                // If block has a parallelId, also remove the parallelId from its partner
                                if (block.parallelId) {
                                  const partner = calendar.find(b => b.id !== block.id && b.parallelId === block.parallelId);
                                  if (partner) {
                                    const updatedPartner = { ...partner, parallelId: null };
                                    const filtered = calendar.filter(b => b.id !== block.id);
                                    updateCurrentWeek(filtered.map(b => b.id === partner.id ? updatedPartner : b), points);
                                  } else {
                                    deleteBlock(block.id);
                                  }
                                } else {
                                  deleteBlock(block.id);
                                }
                              }
                              if (action === 'note') setNoteModal({ blockId: block.id, text: block.description || '' });
                              if (action === 'log') setLogEntryModal({ dayIndex: block.day, categoryId: block.type, blockStart: block.start });
                            }}
                          />
                        );
                      })}

                    {groupedPoints.map((group) => {
                      const category = categories[group.categoryId] || categories.life || Object.values(categories)[0];
                      const isPlanned = group.status === 'planned';
                      return (
                        <div
                          key={group.id}
                          className={`absolute z-[60] group/icon cursor-pointer hover:scale-110 transition-transform flex items-center justify-center ${isPlanned ? 'opacity-40' : ''}`}
                          style={{ top: `${(group.timestamp - 7) * HOUR_HEIGHT}rem`, right: '0px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogDay(dIndex);
                            setLogSidebarOpen(true);
                          }}
                        >
                          <div className={`bg-white rounded-full p-0.5 shadow-md border relative ${category.borderColor} ${isPlanned ? 'border-dashed' : ''}`}>
                            <div className={category.iconColor}>{getCategoryIcon(group.categoryId, 14, categories)}</div>
                            {group.count > 1 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-white">
                                {group.count}
                              </div>
                            )}
                          </div>
                          <div className="absolute right-full top-0 mr-2 bg-black/90 text-white text-[10px] p-2 rounded w-max opacity-0 group-hover/icon:opacity-100 pointer-events-none z-[70] shadow-xl">
                            <ul className="list-disc pl-3">
                              {group.items.map((item, idx) => (
                                <li key={idx} className={item.status === 'planned' ? 'text-zinc-400' : ''}>
                                  {item.status === 'planned' ? '○ ' : '● '}{item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedBlockIds.length > 1 && (
          <div className="bulk-menu absolute bottom-24 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-full px-6 py-3 shadow-2xl flex items-center gap-4 z-[60] animate-in slide-in-from-bottom-4">
            <span className="font-bold text-sm">{selectedBlockIds.length} markerade</span>
            <div className="h-4 w-px bg-white/20" />
            <button onClick={handleBulkToggle} className="flex items-center gap-2 hover:text-green-400 text-sm font-bold">
              <Check size={16} /> Klara
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-2 hover:text-red-400 text-sm font-bold">
              <Trash2 size={16} /> Radera
            </button>
            <div className="h-4 w-px bg-white/20" />
            <button onClick={() => setSelectedBlockIds([])}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {addModal && (
        <div className="add-modal fixed inset-0 bg-black/10 z-[100]" onClick={() => setAddModal(null)}>
          {!addModal.selectedCategory ? (
            <div
              className="absolute bg-white p-2 rounded-lg shadow-xl border border-zinc-200"
              style={{
                left: `${85 + (addModal.day * 150)}px`,
                top: `${150 + ((addModal.hour - 7) * HOUR_HEIGHT * 16)}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-1">
                {Object.values(categories).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAddModal({ ...addModal, selectedCategory: cat.id })}
                    className={`w-10 h-10 rounded-lg ${cat.bg} ${cat.text} flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform`}
                    title={cat.label}
                  >
                    {cat.label.substring(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
              <ProjectTaskInput
                categoryId={addModal.selectedCategory}
                projectHistory={projectHistory}
                onSave={(projectName, taskName) => {
                  addNewBlock(addModal.selectedCategory, projectName, taskName);
                }}
                onCancel={() => setAddModal(null)}
              />
            </div>
          )}
        </div>
      )}

      {noteModal && (
        <div className="note-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[110]" onClick={() => setNoteModal(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-50 p-3 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-zinc-500">Anteckningar</h3>
              <button onClick={() => setNoteModal(null)} className="text-zinc-400 hover:text-zinc-900">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              {(() => {
                const parsed = parseCheckboxes(noteModal.text);

                if (parsed.hasCheckboxes) {
                  return (
                    <div className="space-y-2">
                      {parsed.lines.map((line, idx) => {
                        if (line.type === 'checkbox') {
                          return (
                            <label key={idx} className="flex items-start gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={line.checked}
                                onChange={() => {
                                  const newText = toggleCheckbox(noteModal.text, idx);
                                  setNoteModal({ ...noteModal, text: newText });
                                }}
                                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className={`text-sm ${line.checked ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                                {line.text}
                              </span>
                            </label>
                          );
                        } else if (line.text.trim()) {
                          return (
                            <div key={idx} className="text-sm text-zinc-800 font-medium">
                              {line.text}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                }

                return (
                  <textarea
                    autoFocus
                    className="w-full h-32 p-3 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-800 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
                    placeholder="Vad ska göras? Hur gick det?&#10;&#10;Använd checkboxes:&#10;- [ ] Uppgift 1&#10;- [ ] Uppgift 2"
                    value={noteModal.text}
                    onChange={(e) => setNoteModal({ ...noteModal, text: e.target.value })}
                  />
                );
              })()}
            </div>
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  // Switch between checkbox view and edit view
                  const parsed = parseCheckboxes(noteModal.text);
                  if (parsed.hasCheckboxes) {
                    // Already has checkboxes, show textarea to edit raw markdown
                    setNoteModal({ ...noteModal, editMode: !noteModal.editMode });
                  }
                }}
                className="text-zinc-600 text-xs hover:text-zinc-900"
              >
                {parseCheckboxes(noteModal.text).hasCheckboxes ? '✏️ Redigera' : ''}
              </button>
              <button
                onClick={() => updateDescription(noteModal.blockId, noteModal.text)}
                className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black transition-colors"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {editBlockModal && (() => {
        const formatTime = (decimalHour) => {
          const h = Math.floor(decimalHour);
          const m = Math.round((decimalHour - h) * 60);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        };
        const parseTime = (timeStr) => {
          const [h, m] = timeStr.split(':').map(Number);
          return h + (m || 0) / 60;
        };
        const endTime = editBlockModal.start + editBlockModal.duration;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120]" onClick={() => setEditBlockModal(null)}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="bg-zinc-900 p-4 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase text-white flex items-center gap-2"><Edit3 size={14} /> Redigera block</h3>
                <button onClick={() => setEditBlockModal(null)} className="text-zinc-400 hover:text-white"><X size={16} /></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Namn</label>
                  <input
                    type="text"
                    autoFocus
                    value={editBlockModal.label}
                    onChange={(e) => setEditBlockModal({ ...editBlockModal, label: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Blocknamn"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Kategori</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categories).map(([id, cat]) => (
                      <button
                        key={id}
                        onClick={() => setEditBlockModal({ ...editBlockModal, type: id })}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          editBlockModal.type === id
                            ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-black`
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      <Clock size={10} className="inline mr-1" />Start
                    </label>
                    <input
                      type="time"
                      value={formatTime(editBlockModal.start)}
                      onChange={(e) => {
                        const newStart = parseTime(e.target.value);
                        if (newStart >= 7 && newStart < 24) {
                          setEditBlockModal({ ...editBlockModal, start: newStart });
                        }
                      }}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                      <Clock size={10} className="inline mr-1" />Slut
                    </label>
                    <input
                      type="time"
                      value={formatTime(endTime)}
                      onChange={(e) => {
                        const newEnd = parseTime(e.target.value);
                        const newDuration = newEnd - editBlockModal.start;
                        if (newDuration >= 0.5 && newEnd <= 24) {
                          setEditBlockModal({ ...editBlockModal, duration: Math.round(newDuration * 2) / 2 });
                        }
                      }}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Längd</label>
                    <div className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-600 font-mono text-center">
                      {editBlockModal.duration}h
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                  <div className="flex gap-2">
                    {[
                      { val: 'planned', label: 'Planerad', style: 'bg-blue-100 text-blue-700' },
                      { val: 'done', label: 'Klar', style: 'bg-green-100 text-green-700' },
                      { val: 'inactive', label: 'Inaktiv', style: 'bg-zinc-100 text-zinc-500' },
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => setEditBlockModal({ ...editBlockModal, status: s.val })}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          editBlockModal.status === s.val ? `${s.style} ring-2 ring-offset-1 ring-black` : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project & Task */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Projekt</label>
                    <input
                      type="text"
                      value={editBlockModal.projectName}
                      onChange={(e) => setEditBlockModal({ ...editBlockModal, projectName: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Projektnamn"
                      list="project-history-list"
                    />
                    <datalist id="project-history-list">
                      {projectHistory.map((p) => <option key={p} value={p} />)}
                    </datalist>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Uppgift</label>
                    <input
                      type="text"
                      value={editBlockModal.taskName}
                      onChange={(e) => setEditBlockModal({ ...editBlockModal, taskName: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Uppgiftsnamn"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Beskrivning / anteckningar</label>
                  <textarea
                    value={editBlockModal.description}
                    onChange={(e) => setEditBlockModal({ ...editBlockModal, description: e.target.value })}
                    className="w-full h-20 px-3 py-2 border border-zinc-200 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Vad ska göras? Anteckningar..."
                  />
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <button
                  onClick={() => setEditBlockModal(null)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                  Avbryt
                </button>
                <button
                  onClick={() => {
                    const updatedCalendar = calendar.map((b) => {
                      if (b.id !== editBlockModal.blockId) return b;
                      return {
                        ...b,
                        label: editBlockModal.label || b.label,
                        type: editBlockModal.type,
                        status: editBlockModal.status,
                        start: editBlockModal.start,
                        duration: editBlockModal.duration,
                        description: editBlockModal.description,
                        projectName: editBlockModal.projectName || null,
                        taskName: editBlockModal.taskName || null,
                      };
                    });
                    const block = updatedCalendar.find(b => b.id === editBlockModal.blockId);
                    updateCurrentWeek(resolveCollisions(updatedCalendar, block), points);
                    // Update project history
                    if (editBlockModal.projectName && !projectHistory.includes(editBlockModal.projectName)) {
                      const newHistory = [...projectHistory, editBlockModal.projectName];
                      setProjectHistory(newHistory);
                      localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(newHistory));
                    }
                    setEditBlockModal(null);
                  }}
                  className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black transition-colors"
                >
                  Spara
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Log Sidebar - Modernized */}
      <div
        className={`log-sidebar fixed top-0 right-0 h-full w-full sm:w-[380px] bg-zinc-50 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${
          logSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Modern Dark */}
        <div className="flex-none bg-zinc-900 p-5 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-white" size={20} />
            <h3 className="text-lg font-bold text-white tracking-tight">
              {selectedLogDay !== null ? DAYS[selectedLogDay] : ''}
            </h3>
          </div>
          <button onClick={() => setLogSidebarOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Point List - Cleaner spacing */}
        <div className="flex-grow overflow-y-auto p-4 bg-zinc-50">
          {selectedLogDay !== null && (points[selectedLogDay] || []).length === 0 ? (
            <div className="text-center text-zinc-400 italic py-12 text-sm">Inga punkter registrerade</div>
          ) : (
            selectedLogDay !== null && (
              <ul className="space-y-2.5">
                {(points[selectedLogDay] || [])
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((log) => {
                    const logCategory = categories[log.categoryId] || categories.life || Object.values(categories)[0];
                    const isEditing = editingLogId === log.id;
                    const isEditingTime = editingLogTime === log.id;
                    const hours = Math.floor(log.timestamp);
                    const minutes = Math.round((log.timestamp % 1) * 60);
                    const isPlanned = log.status === 'planned';
                    return (
                      <li key={log.id} className={`flex flex-col p-3 bg-white rounded-lg shadow-sm border-l-4 ${logCategory.border} group hover:shadow-md transition-shadow ${isPlanned ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <input
                            type="checkbox"
                            checked={log.status === 'done'}
                            onChange={() => togglePointStatus(selectedLogDay, log.id)}
                            className="mt-1 w-4 h-4 flex-shrink-0 cursor-pointer"
                            title={isPlanned ? 'Markera som klar' : 'Markera som planerad'}
                          />
                          <div
                            className="flex flex-col flex-grow cursor-pointer min-w-0"
                            onClick={() => setEditingLogId(isEditing ? null : log.id)}
                          >
                            <span className={`text-sm font-semibold leading-tight ${isPlanned ? 'text-zinc-500' : 'text-zinc-900'}`}>{log.text}</span>
                            {(log.projectName || log.taskName) && (
                              <span className="text-[11px] text-zinc-500 mt-1">
                                {log.projectName && log.taskName
                                  ? `${log.projectName} / ${log.taskName}`
                                  : log.projectName || log.taskName}
                              </span>
                            )}
                            {isEditingTime ? (
                              <div className="flex gap-1 items-center mt-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="number"
                                  min="7"
                                  max="23"
                                  value={hours}
                                  onChange={(e) => {
                                    const newHours = Math.max(7, Math.min(23, parseInt(e.target.value) || 0));
                                    updatePointTime(selectedLogDay, log.id, newHours + minutes / 60);
                                  }}
                                  className="w-12 px-1.5 py-1 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
                                />
                                <span className="text-xs font-mono text-zinc-400">:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={minutes.toString().padStart(2, '0')}
                                  onChange={(e) => {
                                    const newMinutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                                    updatePointTime(selectedLogDay, log.id, hours + newMinutes / 60);
                                  }}
                                  className="w-12 px-1.5 py-1 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded focus:outline-none focus:border-zinc-900"
                                />
                                <button
                                  onClick={() => setEditingLogTime(null)}
                                  className="ml-1 text-xs text-green-600 hover:text-green-800 font-bold"
                                >
                                  ✓
                                </button>
                              </div>
                            ) : (
                              <span
                                className="text-[11px] text-zinc-500 font-mono hover:text-zinc-900 cursor-pointer inline-block mt-1.5 bg-zinc-100 px-2 py-0.5 rounded"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLogTime(log.id);
                                }}
                              >
                                {hours}:{minutes.toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removePoint(selectedLogDay, log.id)}
                            className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-100">
                            {Object.values(categories).map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => updatePointCategory(selectedLogDay, log.id, cat.id)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  log.categoryId === cat.id ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-zinc-400` : `${cat.bg} ${cat.text} opacity-40 hover:opacity-70`
                                }`}
                                title={cat.label}
                              >
                                {getCategoryIcon(cat.id, 13, categories)}
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )
          )}
        </div>

        {/* Footer - Add New Log - Modernized */}
        {selectedLogDay !== null && (
          <div className="flex-none p-4 bg-white border-t border-zinc-200">
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-3 tracking-wide">Snabbval</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map((preset, i) => {
                const presetCategory = categories[preset.category] || categories.life || Object.values(categories)[0];
                return (
                  <button
                    key={i}
                    onClick={() => addPoint(selectedLogDay, preset.label, null, preset.category)}
                    className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm active:scale-95 flex gap-1.5 items-center"
                  >
                    <div className={`w-2 h-2 rounded-full ${presetCategory.bg}`} />
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mb-3">
              {Object.values(categories).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedLogCategory(cat.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedLogCategory === cat.id ? `${cat.bg} ${cat.text} ring-2 ring-zinc-900` : `${cat.bg} ${cat.text} opacity-50 hover:opacity-100`
                  }`}
                  title={cat.label}
                >
                  {getCategoryIcon(cat.id, 15, categories)}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.logInput.value;
                if (val) {
                  addPoint(selectedLogDay, val, null, selectedLogCategory);
                  e.target.reset();
                }
              }}
            >
              <input
                name="logInput"
                type="text"
                placeholder="Skriv aktivitet..."
                className="flex-grow bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 focus:bg-white"
              />
              <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors shadow-sm">
                <Plus size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Sidebar Overlay */}
      {logSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[105]"
          onClick={() => setLogSidebarOpen(false)}
        />
      )}

      {logEntryModal && (
        <div className="log-entry-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[110]" onClick={() => setLogEntryModal(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b flex justify-between items-center ${categories[logEntryModal.categoryId]?.bg || 'bg-zinc-100'} ${categories[logEntryModal.categoryId]?.text || 'text-zinc-900'}`}>
              <div className="flex items-center gap-2">
                {getCategoryIcon(logEntryModal.categoryId, 18, categories)}
                <h3 className="text-lg font-bold uppercase tracking-tight">Logga aktivitet</h3>
              </div>
              <button onClick={() => setLogEntryModal(null)} className="hover:opacity-70">
                <X size={20} />
              </button>
            </div>

            <form
              className="p-4"
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.logEntryInput.value;
                if (val) {
                  addPoint(logEntryModal.dayIndex, val, logEntryModal.blockStart, logEntryModal.categoryId);
                  setLogEntryModal(null);
                }
              }}
            >
              <input
                autoFocus
                name="logEntryInput"
                type="text"
                placeholder={`Vad gjorde du i ${categories[logEntryModal.categoryId]?.label || 'denna kategori'}?`}
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 mb-3"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setLogEntryModal(null)} className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900">
                  Avbryt
                </button>
                <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-black">
                  Logga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="import-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[120]" onClick={() => setImportModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-50 p-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-700">Importera Plan</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase text-zinc-400 mb-2">Tillgängliga Planer</h4>
                <div
                  onClick={() => handleImportPlan()}
                  className="p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded cursor-pointer transition-colors"
                >
                  <div className="font-bold text-sm text-zinc-800">10-dagars armhävningsplan</div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Start: 2026-01-08 • 10 dagar • Training
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mt-4">
                Klicka på en plan för att importera den till kalendern. Alla aktiviteter läggs in på rätt datum med checkboxes.
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="settings-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[120]" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-50 p-4 border-b border-zinc-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-lg font-bold text-zinc-700">Inställningar</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* Categories Section */}
              <h4 className="text-xs font-bold uppercase text-zinc-400 mb-3">Kategorier</h4>
              <ul className="space-y-3 mb-4">
                {Object.values(categories).map((cat) => {
                  const blocksInUse = calendar.filter(b => b.type === cat.id).length;
                  return (
                    <li key={cat.id} className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                      <div className="flex gap-2 items-end mb-2">
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) => {
                            setCategories(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], label: e.target.value }
                            }));
                          }}
                          className="flex-grow bg-white border border-zinc-300 rounded px-2 py-1 text-sm"
                          placeholder="Kategorinaam"
                        />
                        {blocksInUse === 0 && (
                          <button
                            onClick={() => {
                              const newCats = { ...categories };
                              delete newCats[cat.id];
                              setCategories(newCats);
                            }}
                            className="text-zinc-400 hover:text-red-500"
                            title="Radera kategori"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-xs font-bold text-zinc-600">Färg:</span>
                        <div className="flex gap-1 flex-wrap">
                          {COLOR_PALETTE.map(color => (
                            <button
                              key={color.id}
                              onClick={() => {
                                const { id: _cid, ...colorStyle } = color;
                                setCategories(prev => ({
                                  ...prev,
                                  [cat.id]: { ...prev[cat.id], ...colorStyle }
                                }));
                              }}
                              className={`w-5 h-5 rounded-full ${color.bg} border-2 ${cat.bg === color.bg ? 'border-black' : 'border-transparent'}`}
                              title={color.id}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-xs font-bold text-zinc-600">Ikon:</span>
                        <div className="flex gap-1 flex-wrap">
                          {ICON_OPTIONS.map(iconName => (
                            <button
                              key={iconName}
                              onClick={() => {
                                setCategories(prev => ({
                                  ...prev,
                                  [cat.id]: { ...prev[cat.id], icon: iconName }
                                }));
                              }}
                              className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                cat.icon === iconName ? 'bg-zinc-900 text-white ring-2 ring-zinc-400' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                              title={iconName}
                            >
                              {getCategoryIcon(cat.id, 12, { [cat.id]: { ...cat, icon: iconName } })}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center mb-2">
                        <span className="text-xs font-bold text-zinc-600">Måltimmar/v:</span>
                        <input
                          type="number"
                          min="0"
                          value={cat.targetHoursPerWeek ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            setCategories(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], targetHoursPerWeek: val }
                            }));
                          }}
                          className="w-16 bg-white border border-zinc-300 rounded px-2 py-1 text-sm"
                          placeholder="Opt."
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold text-zinc-600">Målantalpoäng/v:</span>
                        <input
                          type="number"
                          min="0"
                          value={cat.weeklyGoalPoints ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : null;
                            setCategories(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], weeklyGoalPoints: val }
                            }));
                          }}
                          className="w-16 bg-white border border-zinc-300 rounded px-2 py-1 text-sm"
                          placeholder="Opt."
                        />
                      </div>
                      {blocksInUse > 0 && (
                        <div className="text-[11px] text-zinc-500 mt-2">
                          {blocksInUse} block(ar) använder denna kategori
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => {
                  const newId = `custom-${Date.now()}`;
                  const { id: _colorId, ...colorProps } = COLOR_PALETTE[0];
                  setCategories(prev => ({
                    ...prev,
                    [newId]: {
                      id: newId,
                      label: 'Ny',
                      icon: 'Star',
                      targetHoursPerWeek: null,
                      weeklyGoalPoints: null,
                      ...colorProps
                    }
                  }));
                }}
                className="w-full py-2 border border-dashed border-zinc-300 text-zinc-400 rounded text-sm hover:text-zinc-600 hover:border-zinc-400 mb-4"
              >
                + Lägg till kategori
              </button>

              <hr className="my-4" />

              {/* Presets Section */}
              <h4 className="text-xs font-bold uppercase text-zinc-400 mb-3">Redigera Snabbval</h4>
              <ul className="space-y-2 mb-4">
                {presets.map((preset, i) => (
                  <li key={i} className="flex gap-2">
                    <input
                      className="flex-grow bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm"
                      value={preset.label}
                      onChange={(e) => {
                        const newPresets = [...presets];
                        newPresets[i].label = e.target.value;
                        setPresets(newPresets);
                      }}
                    />
                    <button onClick={() => setPresets(presets.filter((_, idx) => idx !== i))} className="text-zinc-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setPresets([...presets, { label: 'Ny aktivitet', category: 'training', icon: 'star' }])}
                className="w-full py-2 border border-dashed border-zinc-300 text-zinc-400 rounded text-sm hover:text-zinc-600 hover:border-zinc-400"
              >
                + Lägg till snabbval
              </button>

              <hr className="my-4" />

              {/* Default Template Section */}
              <h4 className="text-xs font-bold uppercase text-zinc-400 mb-3">Standardmall för nya veckor</h4>
              {(() => {
                const defaultTemplate = getDefaultTemplate();
                return (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                    {defaultTemplate ? (
                      <div>
                        <p className="text-sm font-bold text-amber-900 mb-2">{defaultTemplate.name}</p>
                        <p className="text-xs text-amber-700 mb-3">
                          Sparad: {new Date(defaultTemplate.setAt).toLocaleDateString('sv-SE')}
                        </p>
                        <button
                          onClick={clearDefaultTemplate}
                          className="w-full py-2 px-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded transition-colors"
                        >
                          Radera standardmall
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700">Ingen standardmall inställd. Spara en dagsmall och välj "Ställ in som veckomall".</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Report Sidebar */}
      <ReportSidebar
        open={reportSidebarOpen}
        onClose={() => setReportSidebarOpen(false)}
        weeksData={weeksData}
        currentWeekIndex={currentWeekIndex}
        categories={categories}
      />

      {/* Bank Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {bankOpen ? (
          <div className="bg-white border-t border-zinc-300 shadow-2xl max-h-[50vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-900">📦 Bank</h3>
                <button
                  onClick={() => setBankOpen(false)}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-600"
                >
                  <X size={20} />
                </button>
              </div>

              {bankItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {bankItems.map((item) => {
                    const cat = categories[item.type] || categories.life || Object.values(categories)[0];
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedBlock({ ...item, isFromBank: true });
                        }}
                        onDragEnd={() => setDraggedBlock(null)}
                        className="flex items-center gap-2 p-2 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 cursor-move transition-colors"
                      >
                        <div className={`w-3 h-3 rounded-full ${cat.bg}`} />
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-bold text-zinc-800 truncate">{item.label}</p>
                          {item.projectName && (
                            <p className="text-xs text-zinc-500">{item.projectName} {item.taskName ? `/ ${item.taskName}` : ''}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{item.duration}h</span>
                        <button
                          onClick={() => removeFromBank(item.id)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4 mb-4">Ingen objekt i banken</p>
              )}

              <div className="border-t border-zinc-200 pt-4 mt-4">
                <h4 className="text-xs font-bold uppercase text-zinc-400 mb-3">Lägg till till bank</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Aktivitetsetikett"
                    value={bankAddLabel}
                    onChange={(e) => setBankAddLabel(e.target.value)}
                    className="w-full px-2 py-1.5 border border-zinc-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && addQuickBankItem()}
                  />
                  <div className="flex gap-2">
                    <select
                      value={bankAddDuration}
                      onChange={(e) => setBankAddDuration(parseFloat(e.target.value))}
                      className="flex-grow px-2 py-1.5 border border-zinc-300 rounded text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value={0.5}>0.5h</option>
                      <option value={1}>1h</option>
                      <option value={1.5}>1.5h</option>
                      <option value={2}>2h</option>
                      <option value={3}>3h</option>
                      <option value={4}>4h</option>
                    </select>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(categories).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setBankAddCategory(cat.id)}
                        className={`flex-grow px-2 py-1.5 rounded text-xs font-bold transition-all ${
                          bankAddCategory === cat.id
                            ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-black`
                            : `${cat.bg} ${cat.text} opacity-50 hover:opacity-75`
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={addQuickBankItem}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded text-sm transition-colors"
                  >
                    Lägg till
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setBankOpen(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 font-bold rounded-t-lg shadow-2xl flex items-center justify-center gap-2 transition-colors"
            title="Öppna Bank"
          >
            <span>📦 Bank ({bankItems.length})</span>
          </button>
        )}
      </div>

      {/* Floating Action Button - Add Point */}
      <button
        onClick={() => setAddPointModalOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[100] transition-all hover:scale-110 active:scale-95"
        title="Lägg till punkt"
      >
        <Zap size={24} fill="currentColor" />
      </button>

      {/* Add Point Modal */}
      {addPointModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]" onClick={() => {
          setAddPointModalOpen(false);
          setQuickTrainingCount(0);
        }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900">Lägg till punkt</h2>
              <button onClick={() => {
                setAddPointModalOpen(false);
                setQuickTrainingCount(0);
              }} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>

            {/* Quick Training Section */}
            {presets.filter(p => p.category === 'training').length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase text-red-500 mb-2">🔥 Snabbträning</h3>
                <p className="text-[10px] text-zinc-500 mb-2">
                  {quickTrainingCount > 0 && <span className="font-bold text-red-600">{quickTrainingCount} aktiviteter registrerade denna session</span>}
                  {quickTrainingCount === 0 && <span>En-klick registrering</span>}
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {presets.filter(p => p.category === 'training').map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        addPoint(todayIndex, preset.label, currentTime, preset.category, 'done');
                        setQuickTrainingCount(quickTrainingCount + 1);
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-bold transition-all bg-red-600 text-white hover:bg-red-700 active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Presets */}
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase text-zinc-400 mb-2">Snabbval</h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset, i) => {
                  const presetCat = categories[preset.category] || categories.life || Object.values(categories)[0];
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setPointText(preset.label);
                        setPointCategory(preset.category);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${presetCat.bg} ${presetCat.text} hover:opacity-80`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Aktivitet</label>
                <input
                  type="text"
                  value={pointText}
                  onChange={(e) => setPointText(e.target.value)}
                  placeholder="T.ex. Armhävningar"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-yellow-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Tid</label>
                <input
                  type="time"
                  value={pointTime}
                  onChange={(e) => setPointTime(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-yellow-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {pointTime ? (
                    <>
                      {(() => {
                        const [hours, minutes] = pointTime.split(':').map(Number);
                        const selectedTime = hours + minutes / 60;
                        const now = new Date();
                        const currentHour = now.getHours() + now.getMinutes() / 60;
                        return selectedTime > currentHour ?
                          <span className="text-blue-600 font-bold">→ Planerad (framtid)</span> :
                          <span className="text-green-600 font-bold">→ Klar (nu/tidigare)</span>;
                      })()}
                    </>
                  ) : (
                    'Lämna tom för nuvarande tid'
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Kategori</label>
                <div className="flex gap-2">
                  {Object.values(categories).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setPointCategory(cat.id)}
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        pointCategory === cat.id
                          ? `${cat.bg} ${cat.text} ring-2 ring-offset-2 ring-zinc-400`
                          : `${cat.bg} ${cat.text} opacity-40 hover:opacity-70`
                      }`}
                    >
                      {getCategoryIcon(cat.id, 20, categories)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setAddPointModalOpen(false);
                  setQuickTrainingCount(0);
                }}
                className="flex-1 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreatePoint}
                disabled={!pointText.trim()}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lägg till
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, current, total, unit, target, warnBelowTarget, cumFlex }) {
  const isDone = current >= total;
  const showWarning = warnBelowTarget && total < target;
  const weekDiff = target ? Math.round((current - target) * 10) / 10 : null;

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
        {label}
        {showWarning && <AlertCircle size={10} className="text-red-500" />}
      </span>
      <div className={`flex items-baseline gap-1 ${showWarning ? 'text-red-600' : isDone ? 'text-green-600' : 'text-zinc-900'}`}>
        <span className="text-lg font-black tracking-tighter">{current}</span>
        <span className="text-[10px] font-medium text-zinc-400">
          / {total} {unit}
          {target && <span className="text-[8px] text-zinc-400 ml-1">(mål {target})</span>}
        </span>
      </div>
      {weekDiff !== null && (
        <span className={`text-[9px] font-bold ${weekDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          v: {weekDiff >= 0 ? '+' : ''}{weekDiff}{unit}
        </span>
      )}
      {cumFlex && cumFlex.weekCount > 1 && (
        <span className={`text-[9px] font-bold ${cumFlex.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          totalt: {cumFlex.diff >= 0 ? '+' : ''}{cumFlex.diff}{unit} ({cumFlex.weekCount}v)
        </span>
      )}
    </div>
  );
}

function Block({ block, isSelected, isEditing, onClick, onDragStart, onResizeStart, onAction, onUpdateLabel, categories = DEFAULT_CATEGORIES, isParallel = false, parallelPosition = null }) {
  const cat = categories[block.type];
  const isDone = block.status === 'done';
  const isInactive = block.status === 'inactive';

  const [localLabel, setLocalLabel] = useState(block.label);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  // Calculate positioning for parallel blocks
  let positionStyle = { top: `${(block.start - 7) * HOUR_HEIGHT}rem`, height: `${block.duration * HOUR_HEIGHT - 0.1}rem` };

  if (isParallel && parallelPosition === 'left') {
    positionStyle.left = '2px';
    positionStyle.right = '50%';
  } else if (isParallel && parallelPosition === 'right') {
    positionStyle.left = '50%';
    positionStyle.right = '2px';
  }

  if (isInactive)
    return (
      <div
        onClick={() => onAction('toggle')}
        className="absolute border-2 border-dashed border-zinc-300 text-zinc-400 rounded flex items-center justify-center text-[10px] font-bold uppercase cursor-pointer hover:border-zinc-400"
        style={{
          ...positionStyle,
          ...(isParallel ? {} : { left: '4px', right: '4px' })
        }}
      >
        {block.label}
      </div>
    );

  return (
    <>
      <div
        draggable={!isEditing}
        onDragStart={onDragStart}
        onClick={onClick}
        className={`
        block-interactive absolute z-10 flex flex-col overflow-hidden rounded-[2px] cursor-pointer transition-all duration-200 shadow-sm border-l-2
        ${isDone ? cat.doneStyle : `${cat.bg} ${cat.text} ${cat.border}`}
        ${isSelected ? 'ring-2 ring-black ring-offset-1 z-50' : 'hover:brightness-95 group/block'}
      `}
        style={{
          ...positionStyle,
          ...(isParallel ? {} : { left: '4px', right: '4px' })
        }}
      >
        <div className="flex justify-between items-start p-1.5 h-full relative">
          <div className="flex flex-col w-full h-full">
            <div className="flex justify-between w-full">
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onUpdateLabel(localLabel);
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    onBlur={() => onUpdateLabel(localLabel)}
                    className="w-full bg-transparent text-[10px] font-bold border-b border-white/50 focus:outline-none"
                  />
                </form>
              ) : (
                <div className="flex flex-col leading-none w-full">
                  <div className="flex justify-between items-start w-full pr-4">
                    <span className={`text-[10px] font-bold uppercase truncate ${isDone ? 'line-through decoration-zinc-300' : ''}`}>
                      {block.label}
                    </span>
                  </div>
                  {(block.projectName || block.taskName) && (
                    <span className="text-[9px] opacity-50 mt-0.5 truncate">
                      {block.projectName && block.taskName
                        ? `${block.projectName} / ${block.taskName}`
                        : block.projectName || block.taskName}
                    </span>
                  )}
                  {block.duration >= 0.5 && <span className="text-[9px] opacity-60 font-mono mt-0.5">{block.duration}h</span>}
                </div>
              )}
            </div>

            {block.description && (
              <div className={`mt-1 text-[9px] leading-tight opacity-70 ${isDone ? 'line-through' : ''}`}>
                {(() => {
                  const parsed = parseCheckboxes(block.description);
                  if (parsed.hasCheckboxes) {
                    const checkedCount = parsed.lines.filter(l => l.type === 'checkbox' && l.checked).length;
                    const totalCount = parsed.lines.filter(l => l.type === 'checkbox').length;
                    return (
                      <span className="font-mono">
                        ☑️ {checkedCount}/{totalCount}
                      </span>
                    );
                  }
                  return (
                    <div className="overflow-hidden text-ellipsis line-clamp-2">
                      {block.description}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className={`absolute top-1 right-1 flex flex-col gap-1 transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('toggle');
                }}
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isDone ? 'border-transparent bg-current opacity-100' : 'border-current'
                }`}
              >
                {isDone && <Check size={10} className={cat.bg.includes('white') ? 'text-zinc-900' : 'text-white'} strokeWidth={4} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('note');
                }}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 text-current"
              >
                <MessageSquare size={10} />
              </button>
            </div>
          )}
        </div>

        {!isEditing && (
          <div
            className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-black/10 transition-colors opacity-0 group-hover/block:opacity-100"
            onMouseDown={(e) => onResizeStart(e, block)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 bg-white/30 rounded-full" />
          </div>
        )}
      </div>

      {isSelected && !isEditing && (
        <div
          className="action-menu absolute left-1/2 -translate-x-1/2 z-[60] flex items-center gap-0.5 bg-zinc-900 text-white p-1 rounded shadow-xl"
          style={{ top: `${(block.start - 7) * HOUR_HEIGHT - 2.5}rem` }}
        >
          <span className="text-[10px] font-mono w-6 text-center">{block.duration}h</span>
          <div className="w-px h-3 bg-white/20 mx-1" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('note');
            }}
            className="p-1 hover:bg-white/20 rounded relative"
          >
            <AlignLeft size={12} />
            {block.description && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('log');
            }}
            className="p-1 hover:bg-white/20 rounded text-yellow-400"
            title="Logga aktivitet"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('split');
            }}
            className="p-1 hover:bg-white/20 rounded"
            title="Dela block"
          >
            <Scissors size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('parallel');
            }}
            className="p-1 hover:bg-white/20 rounded"
            title="Parallell block"
          >
            <SplitSquareHorizontal size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('duplicate');
            }}
            className="p-1 hover:bg-white/20 rounded"
            title="Duplicera block"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('tobank');
            }}
            className="p-1 hover:bg-white/20 rounded text-blue-400"
            title="Till Bank"
          >
            <span className="text-xs">📦</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('edit');
            }}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction('delete');
            }}
            className="p-1 text-red-400 hover:bg-red-900/30 rounded ml-1"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </>
  );
}
