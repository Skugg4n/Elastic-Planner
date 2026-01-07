import React, { useEffect, useRef, useState } from 'react';
import { AlignLeft, AlertCircle, Briefcase, Check, ChevronLeft, ChevronRight, Coffee, Edit3, MessageSquare, PenTool, Plus, Save, Scissors, Settings, Star, Trash2, Upload, X, Zap } from 'lucide-react';

const APP_VERSION = '1.6.4';
const HOURS = Array.from({ length: 18 }, (_, i) => i + 7); // 07:00 - 24:00
const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const HOUR_HEIGHT = 4; // rem. 4rem = 1h.
const LOCAL_STORAGE_KEY = 'elastic-planner-weeks';
const CURRENT_WEEK_KEY = 'elastic-planner-current-week';
const PROJECT_HISTORY_KEY = 'elastic-planner-project-history';

const CATEGORIES = {
  creative: {
    id: 'creative',
    label: 'Bok',
    bg: 'bg-zinc-900',
    text: 'text-white',
    border: 'border-zinc-900',
    doneStyle: 'bg-zinc-100 text-zinc-500 border-zinc-300 line-through opacity-75',
    iconColor: 'text-zinc-900',
    borderColor: 'border-zinc-900',
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
  },
};

const getCategoryIcon = (categoryId, size = 14) => {
  switch (categoryId) {
    case 'job':
      return <Briefcase size={size} />;
    case 'creative':
      return <PenTool size={size} />;
    case 'training':
      return <Zap size={size} fill="currentColor" />;
    case 'life':
      return <Coffee size={size} />;
    default:
      return <Star size={size} />;
  }
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

  return { calendar: blocks, bank: [], logs: {} };
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
    return {
      projects: { creative: {}, job: {}, training: {}, life: {} },
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

  return {
    projects: { creative: {}, job: {}, training: {}, life: {} },
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
    logs: [],
  };

  for (let weekNum = weekStart; weekNum <= weekEnd; weekNum++) {
    const weekData = weeksData[weekNum];
    if (!weekData) continue;

    // Aggregate blocks from calendar
    aggregated.blocks.push(...(weekData.calendar || []));

    // Aggregate logs
    Object.values(weekData.logs || {}).forEach((dayLogs) => {
      aggregated.logs.push(...dayLogs);
    });
  }

  return aggregated;
};

const generateReport = (weeksData, weekStart, weekEnd, filters) => {
  const { categoryId, projectName, taskName } = filters;
  const data = aggregateWeeksData(weeksData, weekStart, weekEnd);

  // Filter data
  let filteredBlocks = data.blocks;
  let filteredLogs = data.logs;

  if (categoryId) {
    filteredBlocks = filteredBlocks.filter((b) => b.type === categoryId);
    filteredLogs = filteredLogs.filter((l) => l.categoryId === categoryId);
  }

  if (projectName) {
    filteredBlocks = filteredBlocks.filter((b) => b.projectName === projectName);
    filteredLogs = filteredLogs.filter((l) => l.projectName === projectName);
  }

  if (taskName) {
    filteredBlocks = filteredBlocks.filter((b) => b.taskName === taskName);
    filteredLogs = filteredLogs.filter((l) => l.taskName === taskName);
  }

  // Calculate totals
  const totalHours = filteredBlocks.reduce((sum, b) => sum + (b.status === 'done' ? b.duration : 0), 0);
  const totalLogs = filteredLogs.length;

  // Group by project
  const projectMap = {};

  filteredBlocks.forEach((block) => {
    if (!block.projectName) return;
    if (!projectMap[block.projectName]) {
      projectMap[block.projectName] = {
        name: block.projectName,
        hours: 0,
        logCount: 0,
        tasks: {},
      };
    }
    if (block.status === 'done') {
      projectMap[block.projectName].hours += block.duration;
      if (block.taskName) {
        if (!projectMap[block.projectName].tasks[block.taskName]) {
          projectMap[block.projectName].tasks[block.taskName] = { name: block.taskName, hours: 0, logCount: 0 };
        }
        projectMap[block.projectName].tasks[block.taskName].hours += block.duration;
      }
    }
  });

  filteredLogs.forEach((log) => {
    if (!log.projectName) return;
    if (!projectMap[log.projectName]) {
      projectMap[log.projectName] = {
        name: log.projectName,
        hours: 0,
        logCount: 0,
        tasks: {},
      };
    }
    projectMap[log.projectName].logCount++;
    if (log.taskName) {
      if (!projectMap[log.projectName].tasks[log.taskName]) {
        projectMap[log.projectName].tasks[log.taskName] = { name: log.taskName, hours: 0, logCount: 0 };
      }
      projectMap[log.projectName].tasks[log.taskName].logCount++;
    }
  });

  const byProject = Object.values(projectMap)
    .map((proj) => ({
      ...proj,
      tasks: Object.values(proj.tasks),
    }))
    .sort((a, b) => b.hours - a.hours);

  // Get all unique project and task names for filter dropdowns
  const allProjects = [...new Set([...data.blocks.map((b) => b.projectName), ...data.logs.map((l) => l.projectName)])].filter(Boolean).sort();

  const allTasks = [
    ...new Set([...data.blocks.map((b) => b.taskName), ...data.logs.map((l) => l.taskName)]),
  ].filter(Boolean).sort();

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    totalLogs,
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
        className={`report-sidebar fixed top-0 left-0 h-full w-[420px] bg-zinc-50 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${
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
              <div className="text-2xl font-black text-white">{reportData.totalLogs}</div>
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
                    <span>{proj.logCount} aktiviteter</span>
                  </div>
                  {proj.tasks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-zinc-100">
                      {proj.tasks.map((task) => (
                        <div key={task.name} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-zinc-700">{task.name}</span>
                          <span className="text-zinc-500">{task.hours}h · {task.logCount}</span>
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

  const [draggedBlock, setDraggedBlock] = useState(null);
  const [sourceContainer, setSourceContainer] = useState(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [logSidebarOpen, setLogSidebarOpen] = useState(false);
  const [selectedLogDay, setSelectedLogDay] = useState(null);
  const [logEntryModal, setLogEntryModal] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogTime, setEditingLogTime] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [microMenuOpen, setMicroMenuOpen] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [selectedMicroCategory, setSelectedMicroCategory] = useState('life');
  const [selectedLogCategory, setSelectedLogCategory] = useState('life');
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

  const fileInputRef = useRef(null);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const currentData = weeksData[currentWeekIndex] || { calendar: [], bank: [], logs: {} };
  const { calendar, bank, logs } = currentData;

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weeksData));
  }, [weeksData]);

  useEffect(() => {
    localStorage.setItem(CURRENT_WEEK_KEY, String(currentWeekIndex));
  }, [currentWeekIndex]);

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
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const updateCurrentWeek = (newCalendar, newBank, newLogs) => {
    setWeeksData((prev) => ({
      ...prev,
      [currentWeekIndex]: {
        calendar: newCalendar,
        bank: newBank,
        logs: newLogs || prev[currentWeekIndex]?.logs || {},
      },
    }));
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

  const addToLog = (day, text, specificTime = null, categoryId = 'life', projectName = null, taskName = null) => {
    const currentLogs = logs[day] || [];
    let timestamp;
    if (specificTime) {
      timestamp = specificTime;
    } else {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      timestamp = day === todayIndex ? currentHour : 12.0;
    }
    timestamp = Math.max(7, Math.min(23.9, timestamp));

    const newEntry = {
      id: Date.now(),
      text,
      timestamp,
      categoryId,
      // Keep type for backwards compatibility during migration
      type: categoryId === 'training' ? 'zap' : 'star',
      projectName: projectName || null,
      taskName: taskName || null,
    };

    const newLogs = { ...logs, [day]: [...currentLogs, newEntry] };
    updateCurrentWeek(calendar, bank, newLogs);

    // Update project history if project info provided
    if (projectName && taskName) {
      const updatedHistory = updateProjectHistoryRecord(projectHistory, categoryId, projectName, taskName);
      setProjectHistory(updatedHistory);
    }
  };

  const removeFromLog = (day, entryId) => {
    const currentLogs = logs[day] || [];
    const newDayLogs = currentLogs.filter((e) => e.id !== entryId);
    const newLogs = { ...logs, [day]: newDayLogs };
    updateCurrentWeek(calendar, bank, newLogs);
  };

  const updateLogCategory = (day, entryId, newCategoryId) => {
    const currentLogs = logs[day] || [];
    const newDayLogs = currentLogs.map((log) =>
      log.id === entryId
        ? { ...log, categoryId: newCategoryId, type: newCategoryId === 'training' ? 'zap' : 'star' }
        : log
    );
    const newLogs = { ...logs, [day]: newDayLogs };
    updateCurrentWeek(calendar, bank, newLogs);
    setEditingLogId(null);
  };

  const updateLogTime = (day, entryId, newTime) => {
    const currentLogs = logs[day] || [];
    const newDayLogs = currentLogs.map((log) =>
      log.id === entryId ? { ...log, timestamp: newTime } : log
    );
    const newLogs = { ...logs, [day]: newDayLogs };
    updateCurrentWeek(calendar, bank, newLogs);
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
      updateCurrentWeek(updatedCalendar, bank, logs);
    };

    const handleMouseUp = () => {
      if (dropIndicator?.type !== 'resize') return;
      const block = calendar.find((b) => b.id === dropIndicator.id);
      if (block) {
        const newCalendar = resolveCollisions(calendar, block);
        updateCurrentWeek(newCalendar, bank, logs);
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
  }, [dropIndicator, calendar, bank, logs]);

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

    if (calendar.find((b) => b.id === block.id)) {
      const newCalendar = calendar.filter((b) => b.id !== block.id);
      newCalendar.push(part1, part2);
      updateCurrentWeek(resolveCollisions(newCalendar, part1), bank, logs);
    } else {
      const newBank = bank.filter((b) => b.id !== block.id);
      newBank.push(part1, part2);
      updateCurrentWeek(calendar, newBank, logs);
    }
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
      label: CATEGORIES[type].label,
      status: 'planned',
      description: '',
      projectName: projectName || null,
      taskName: taskName || null,
    };

    const newCalendar = [...calendar, newBlock];
    updateCurrentWeek(resolveCollisions(newCalendar, newBlock), bank, logs);

    // Update project history if project info provided
    if (projectName && taskName) {
      const updatedHistory = updateProjectHistoryRecord(projectHistory, type, projectName, taskName);
      setProjectHistory(updatedHistory);
    }

    setAddModal(null);
  };

  const handleMicroAdd = (label, categoryId = 'life') => {
    addToLog(todayIndex, label, null, categoryId);
    setMicroMenuOpen(false);
  };

  const updateDescription = (blockId, text) => {
    const updateList = (list) => list.map((b) => (b.id === blockId ? { ...b, description: text } : b));
    if (calendar.find((b) => b.id === blockId)) updateCurrentWeek(updateList(calendar), bank, logs);
    else updateCurrentWeek(calendar, updateList(bank), logs);
    setNoteModal(null);
  };

  const toggleStatus = (blockId) => {
    const toggle = (list) =>
      list.map((b) => (b.id === blockId ? { ...b, status: b.status === 'done' ? 'planned' : b.status === 'inactive' ? 'planned' : 'done' } : b));
    if (calendar.find((b) => b.id === blockId)) updateCurrentWeek(toggle(calendar), bank, logs);
    else updateCurrentWeek(calendar, toggle(bank), logs);
    if (selectedBlockIds.length <= 1) setSelectedBlockIds([]);
  };

  const deleteBlock = (blockId) => {
    if (calendar.find((b) => b.id === blockId)) {
      updateCurrentWeek(calendar.filter((b) => b.id !== blockId), bank, logs);
    } else {
      updateCurrentWeek(calendar, bank.filter((b) => b.id !== blockId), logs);
    }
    setSelectedBlockIds([]);
  };

  const handleBulkDelete = () => {
    const ids = new Set(selectedBlockIds);
    const newCalendar = calendar.filter((b) => !ids.has(b.id));
    const newBank = bank.filter((b) => !ids.has(b.id));
    updateCurrentWeek(newCalendar, newBank, logs);
    setSelectedBlockIds([]);
  };

  const handleBulkToggle = () => {
    const ids = new Set(selectedBlockIds);
    const toggle = (list) => list.map((b) => (ids.has(b.id) ? { ...b, status: 'done' } : b));
    updateCurrentWeek(toggle(calendar), toggle(bank), logs);
    setSelectedBlockIds([]);
  };

  const handleDragStart = (e, block, source) => {
    setDraggedBlock(block);
    setSourceContainer(source);
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

  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedBlock || !dropIndicator || dropIndicator.type === 'resize') return;

    let newCalendar = sourceContainer === 'calendar' ? calendar.filter((b) => b.id !== draggedBlock.id) : [...calendar];
    let newBank = sourceContainer === 'bank' ? bank.filter((b) => b.id !== draggedBlock.id) : [...bank];

    if (dropIndicator.type === 'merge') {
      const target = newCalendar.find((b) => b.id === dropIndicator.targetBlockId);
      if (target) target.duration += draggedBlock.duration;
      newCalendar = resolveCollisions(newCalendar, target);
    } else {
      const newBlock = { ...draggedBlock, day: dropIndicator.day, start: dropIndicator.hour };
      newCalendar.push(newBlock);
      newCalendar = resolveCollisions(newCalendar, newBlock);
    }

    updateCurrentWeek(newCalendar, newBank, logs);
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

  const doneBok = calendar
    .filter((b) => b.type === 'creative' && b.status === 'done')
    .reduce((acc, b) => acc + b.duration, 0);
  const totalBok = [...calendar, ...bank]
    .filter((b) => b.type === 'creative')
    .reduce((acc, b) => acc + b.duration, 0);
  const doneJob = calendar
    .filter((b) => b.type === 'job' && b.status === 'done')
    .reduce((acc, b) => acc + b.duration, 0);
  const totalJob = [...calendar, ...bank]
    .filter((b) => b.type === 'job')
    .reduce((acc, b) => acc + b.duration, 0);

  // Count logs per category for the week
  const weekLogs = Object.values(logs).flat();
  const logsByCategory = {
    training: weekLogs.filter((l) => l.categoryId === 'training').length,
    job: weekLogs.filter((l) => l.categoryId === 'job').length,
    creative: weekLogs.filter((l) => l.categoryId === 'creative').length,
    life: weekLogs.filter((l) => l.categoryId === 'life').length,
  };
  const totalWeekLogs = weekLogs.length;

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
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex gap-1">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 px-2 py-1 hover:bg-zinc-100 rounded"
              >
                <Save size={14} /> Spara
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-900 px-2 py-1 hover:bg-zinc-100 rounded"
              >
                <Upload size={14} /> Ladda
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <StatPill label="Bok" current={doneBok} total={totalBok} unit="h" />
            <StatPill label="Jobb" current={doneJob} total={totalJob} unit="h" target={24} warnBelowTarget />
            {totalWeekLogs > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-1">
                  Loggat
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black tracking-tighter text-yellow-600">{totalWeekLogs}</span>
                  <div className="flex gap-1 text-[9px]">
                    {logsByCategory.training > 0 && <span className="text-red-600">⚡{logsByCategory.training}</span>}
                    {logsByCategory.job > 0 && <span className="text-blue-600">💼{logsByCategory.job}</span>}
                    {logsByCategory.creative > 0 && <span className="text-zinc-900">✏️{logsByCategory.creative}</span>}
                    {logsByCategory.life > 0 && <span className="text-emerald-600">☕{logsByCategory.life}</span>}
                  </div>
                </div>
              </div>
            )}
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
              const dayLogs = logs[dIndex] || [];
              const groupedLogs = dayLogs.reduce((acc, log) => {
                const existingGroup = acc.find((g) => Math.abs(g.timestamp - log.timestamp) < 0.25);
                if (existingGroup) {
                  existingGroup.count++;
                  existingGroup.items.push(log);
                } else {
                  acc.push({ ...log, count: 1, items: [log] });
                }
                return acc;
              }, []);

              const logCount = dayLogs.length;
              const isSuperDay = logCount >= 4;

              const dayJob = dayBlocks.filter((b) => b.type === 'job');
              const dayBok = dayBlocks.filter((b) => b.type === 'creative');

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
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLogDay(dIndex);
                          setLogSidebarOpen(true);
                        }}
                        className={`p-0.5 rounded transition-all hover:scale-110 ${
                          logCount > 0 ? 'text-yellow-500 font-bold' : 'text-zinc-300 hover:text-zinc-500'
                        }`}
                        aria-label="Öppna logg"
                      >
                        <div className="flex items-center">
                          {logCount > 0 ? logCount : ''}
                          <Zap size={14} fill={logCount > 0 ? 'currentColor' : 'none'} />
                        </div>
                      </button>
                    </div>
                    <div className="flex gap-1 text-[8px] font-bold opacity-70">
                      <span className={dayBok.some((b) => b.status === 'done') ? 'text-black' : ''}>
                        B:{dayBok.reduce((a, b) => a + (b.status === 'done' ? b.duration : 0), 0)}h
                      </span>
                      <span className={dayJob.some((b) => b.status === 'done') ? 'text-black' : ''}>
                        J:{dayJob.reduce((a, b) => a + (b.status === 'done' ? b.duration : 0), 0)}h
                      </span>
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
                      .map((block) => (
                        <Block
                          key={block.id}
                          block={block}
                          isSelected={selectedBlockIds.includes(block.id)}
                          isEditing={editingLabelId === block.id}
                          onClick={(e) => handleBlockClick(e, block.id)}
                          onDragStart={(e) => handleDragStart(e, block, 'calendar')}
                          onResizeStart={handleResizeStart}
                          onUpdateLabel={(lbl) => {
                            const u = (l) => l.map((b) => (b.id === block.id ? { ...b, label: lbl } : b));
                            updateCurrentWeek(u(calendar), bank, logs);
                            setEditingLabelId(null);
                          }}
                          onAction={(action) => {
                            if (action === 'toggle') toggleStatus(block.id);
                            if (action === 'split') splitBlock(block);
                            if (action === 'edit') setEditingLabelId(block.id);
                            if (action === 'delete') deleteBlock(block.id);
                            if (action === 'note') setNoteModal({ blockId: block.id, text: block.description || '' });
                            if (action === 'log') setLogEntryModal({ dayIndex: block.day, categoryId: block.type, blockStart: block.start });
                          }}
                        />
                      ))}

                    {groupedLogs.map((group) => {
                      const category = CATEGORIES[group.categoryId] || CATEGORIES.life;
                      return (
                        <div
                          key={group.id}
                          className="absolute z-[60] group/icon cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                          style={{ top: `${(group.timestamp - 7) * HOUR_HEIGHT}rem`, right: '0px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLogDay(dIndex);
                            setLogSidebarOpen(true);
                          }}
                        >
                          <div className={`bg-white rounded-full p-0.5 shadow-md border relative ${category.borderColor}`}>
                            <div className={category.iconColor}>{getCategoryIcon(group.categoryId, 14)}</div>
                            {group.count > 1 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm border border-white">
                                {group.count}
                              </div>
                            )}
                          </div>
                          <div className="absolute right-full top-0 mr-2 bg-black/90 text-white text-[10px] p-2 rounded w-max opacity-0 group-hover/icon:opacity-100 pointer-events-none z-[70] shadow-xl">
                            <ul className="list-disc pl-3">
                              {group.items.map((item, idx) => (
                                <li key={idx}>{item.text}</li>
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

        <div
          className="flex-none bg-zinc-100 border-t border-zinc-200 p-2 min-h-[80px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!draggedBlock || sourceContainer === 'bank') return;
            updateCurrentWeek(
              calendar.filter((b) => b.id !== draggedBlock.id),
              [...bank, { ...draggedBlock, day: null, start: null }],
              logs,
            );
            setDraggedBlock(null);
            setDropIndicator(null);
          }}
        >
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-2 items-center mr-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 [writing-mode:vertical-rl] rotate-180 flex items-center justify-center h-12 w-4">
                BANKEN
              </span>

              <div className="relative micro-menu">
                <button
                  onClick={() => setMicroMenuOpen(!microMenuOpen)}
                  className="w-6 h-6 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                  title="Lägg till stjärna/prestation"
                >
                  <Zap size={14} fill="currentColor" />
                </button>

                {microMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-2 w-56 z-[100] animate-in slide-in-from-bottom-2 border border-zinc-200">
                    <div className="flex justify-between items-center mb-2 px-2 border-b border-zinc-100 pb-1">
                      <h4 className="text-[10px] font-bold uppercase text-zinc-400">Logga nu ({DAYS[todayIndex]})</h4>
                      <button onClick={() => setSettingsOpen(true)} className="text-zinc-300 hover:text-zinc-500">
                        <Settings size={12} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      {presets.map((preset, i) => {
                        const presetCategory = CATEGORIES[preset.category] || CATEGORIES.life;
                        return (
                          <button
                            key={i}
                            onClick={() => handleMicroAdd(preset.label, preset.category)}
                            className="text-left px-2 py-1.5 hover:bg-zinc-50 rounded text-xs font-bold flex items-center gap-2 transition-colors"
                          >
                            <div className={`w-2 h-2 rounded-full ${presetCategory.bg}`} />
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-zinc-100 pt-2">
                      <div className="flex gap-1 mb-2 px-2">
                        {Object.values(CATEGORIES).map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedMicroCategory(cat.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              selectedMicroCategory === cat.id ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-zinc-400` : `${cat.bg} ${cat.text} opacity-40 hover:opacity-70`
                            }`}
                            title={cat.label}
                          >
                            {getCategoryIcon(cat.id, 12)}
                          </button>
                        ))}
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = e.target.elements.microInput.value;
                          if (val) {
                            handleMicroAdd(val, selectedMicroCategory);
                            e.target.reset();
                          }
                        }}
                        className="flex gap-1"
                      >
                        <input
                          name="microInput"
                          type="text"
                          placeholder="Egen aktivitet..."
                          className="flex-grow bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                        />
                        <button type="submit" className="bg-zinc-900 text-white px-2 py-1 rounded text-xs hover:bg-black">
                          <Plus size={14} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 items-center flex-grow">
              {bank.length === 0 && <span className="text-xs text-zinc-300 italic">Dra pass hit...</span>}
              {bank.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block, 'bank')}
                  onClick={(e) => handleBlockClick(e, block.id)}
                  className={`flex-shrink-0 w-24 h-12 flex flex-col justify-center items-center rounded text-xs cursor-grab shadow-sm border ${
                    CATEGORIES[block.type].bg
                  } ${CATEGORIES[block.type].text} ${CATEGORIES[block.type].border} ${
                    selectedBlockIds.includes(block.id) ? 'ring-2 ring-black' : ''
                  }`}
                >
                  <span className="font-bold truncate w-full text-center px-1">{block.label}</span>
                  <span className="opacity-70 text-[10px]">{block.duration}h</span>
                </div>
              ))}
            </div>
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
        <div className="add-modal fixed inset-0 bg-black/10 flex items-center justify-center z-[100]" onClick={() => setAddModal(null)}>
          {!addModal.selectedCategory ? (
            <div className="bg-white p-3 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">Välj kategori</h3>
              <div className="grid grid-cols-2 gap-2 w-48">
                {Object.values(CATEGORIES).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setAddModal({ ...addModal, selectedCategory: cat.id })}
                    className={`p-2 rounded text-xs font-bold text-left ${cat.bg} ${cat.text}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-50 p-3 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-zinc-500">Anteckningar</h3>
              <button onClick={() => setNoteModal(null)} className="text-zinc-400 hover:text-zinc-900">
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                autoFocus
                className="w-full h-32 p-3 bg-zinc-50 border border-zinc-200 rounded-md text-sm text-zinc-800 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
                placeholder="Vad ska göras? Hur gick det?"
                value={noteModal.text}
                onChange={(e) => setNoteModal({ ...noteModal, text: e.target.value })}
              />
            </div>
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex justify-end">
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

      {/* Log Sidebar - Modernized */}
      <div
        className={`log-sidebar fixed top-0 right-0 h-full w-[380px] bg-zinc-50 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col ${
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

        {/* Log List - Cleaner spacing */}
        <div className="flex-grow overflow-y-auto p-4 bg-zinc-50">
          {selectedLogDay !== null && (logs[selectedLogDay] || []).length === 0 ? (
            <div className="text-center text-zinc-400 italic py-12 text-sm">Inga aktiviteter loggade</div>
          ) : (
            selectedLogDay !== null && (
              <ul className="space-y-2.5">
                {(logs[selectedLogDay] || [])
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((log) => {
                    const logCategory = CATEGORIES[log.categoryId] || CATEGORIES.life;
                    const isEditing = editingLogId === log.id;
                    const isEditingTime = editingLogTime === log.id;
                    const hours = Math.floor(log.timestamp);
                    const minutes = Math.round((log.timestamp % 1) * 60);
                    return (
                      <li key={log.id} className={`flex flex-col p-3 bg-white rounded-lg shadow-sm border-l-4 ${logCategory.border} group hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-start gap-2">
                          <div
                            className="flex flex-col flex-grow cursor-pointer min-w-0"
                            onClick={() => setEditingLogId(isEditing ? null : log.id)}
                          >
                            <span className="text-sm font-semibold text-zinc-900 leading-tight">{log.text}</span>
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
                                    updateLogTime(selectedLogDay, log.id, newHours + minutes / 60);
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
                                    updateLogTime(selectedLogDay, log.id, hours + newMinutes / 60);
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
                            onClick={() => removeFromLog(selectedLogDay, log.id)}
                            className="text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {isEditing && (
                          <div className="flex gap-1.5 mt-3 pt-3 border-t border-zinc-100">
                            {Object.values(CATEGORIES).map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => updateLogCategory(selectedLogDay, log.id, cat.id)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                  log.categoryId === cat.id ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-zinc-400` : `${cat.bg} ${cat.text} opacity-40 hover:opacity-70`
                                }`}
                                title={cat.label}
                              >
                                {getCategoryIcon(cat.id, 13)}
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
                const presetCategory = CATEGORIES[preset.category] || CATEGORIES.life;
                return (
                  <button
                    key={i}
                    onClick={() => addToLog(selectedLogDay, preset.label, null, preset.category)}
                    className="bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm active:scale-95 flex gap-1.5 items-center"
                  >
                    <div className={`w-2 h-2 rounded-full ${presetCategory.bg}`} />
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mb-3">
              {Object.values(CATEGORIES).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedLogCategory(cat.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    selectedLogCategory === cat.id ? `${cat.bg} ${cat.text} ring-2 ring-zinc-900` : `${cat.bg} ${cat.text} opacity-50 hover:opacity-100`
                  }`}
                  title={cat.label}
                >
                  {getCategoryIcon(cat.id, 15)}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const val = e.target.elements.logInput.value;
                if (val) {
                  addToLog(selectedLogDay, val, null, selectedLogCategory);
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
            <div className={`p-4 border-b flex justify-between items-center ${CATEGORIES[logEntryModal.categoryId]?.bg || 'bg-zinc-100'} ${CATEGORIES[logEntryModal.categoryId]?.text || 'text-zinc-900'}`}>
              <div className="flex items-center gap-2">
                {getCategoryIcon(logEntryModal.categoryId, 18)}
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
                  addToLog(logEntryModal.dayIndex, val, logEntryModal.blockStart, logEntryModal.categoryId);
                  setLogEntryModal(null);
                }
              }}
            >
              <input
                autoFocus
                name="logEntryInput"
                type="text"
                placeholder={`Vad gjorde du i ${CATEGORIES[logEntryModal.categoryId]?.label || 'denna kategori'}?`}
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

      {settingsOpen && (
        <div className="settings-modal fixed inset-0 bg-black/50 flex items-center justify-center z-[120]" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-50 p-4 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-700">Inställningar</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
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
        categories={CATEGORIES}
      />
    </div>
  );
}

function StatPill({ label, current, total, unit, target, warnBelowTarget }) {
  const isDone = current >= total;
  const showWarning = warnBelowTarget && total < target;

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
          {showWarning && <span className="text-[8px] text-red-500 ml-1 font-bold">(Mål {target})</span>}
        </span>
      </div>
    </div>
  );
}

function Block({ block, isSelected, isEditing, onClick, onDragStart, onResizeStart, onAction, onUpdateLabel }) {
  const cat = CATEGORIES[block.type];
  const isDone = block.status === 'done';
  const isInactive = block.status === 'inactive';

  const [localLabel, setLocalLabel] = useState(block.label);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  if (isInactive)
    return (
      <div
        onClick={() => onAction('toggle')}
        className="absolute left-1 right-1 border-2 border-dashed border-zinc-300 text-zinc-400 rounded flex items-center justify-center text-[10px] font-bold uppercase cursor-pointer hover:border-zinc-400"
        style={{ top: `${(block.start - 7) * HOUR_HEIGHT}rem`, height: `${block.duration * HOUR_HEIGHT - 0.1}rem` }}
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
        block-interactive absolute left-1 right-1 z-10 flex flex-col overflow-hidden rounded-[2px] cursor-pointer transition-all duration-200 shadow-sm border-l-2
        ${isDone ? cat.doneStyle : `${cat.bg} ${cat.text} ${cat.border}`}
        ${isSelected ? 'ring-2 ring-black ring-offset-1 z-50' : 'hover:brightness-95 group/block'}
      `}
        style={{ top: `${(block.start - 7) * HOUR_HEIGHT}rem`, height: `${block.duration * HOUR_HEIGHT - 0.1}rem` }}
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
              <div className={`mt-1 text-[9px] leading-tight opacity-70 overflow-hidden text-ellipsis line-clamp-2 ${isDone ? 'line-through' : ''}`}>
                {block.description}
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

        {!isDone && !isEditing && (
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
          >
            <Scissors size={12} />
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
