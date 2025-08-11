'use client';
import { useEffect, useMemo, useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from 'next-themes';
import { Moon, Sun, Trash2, CheckSquare, XSquare, Filter } from "lucide-react";
// NOTE: You can keep your animated list if it supports change callbacks.
// import { PlayfulTodolist } from '@/components/animate-ui/ui-elements/playful-todolist';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

type FilterKind = 'all' | 'active' | 'completed';

const STORAGE_V2 = 'todos.v2';
const LEGACY_STORAGE = 'todos'; // string[] in your old code

export default function Todo() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState<Task[] | null>(null); // null = loading
  const [filter, setFilter] = useState<FilterKind>('all');

  // ---- bootstrap + migrate ----
  useEffect(() => {
    try {
      const v2 = localStorage.getItem(STORAGE_V2);
      if (v2) {
        setTasks(safeParse<Task[]>(v2) ?? []);
        return;
      }
      // migrate legacy string[] -> Task[]
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE);
      if (legacyRaw) {
        const legacy = safeParse<string[]>(legacyRaw) ?? [];
        const migrated: Task[] = legacy.map(s => makeTask(s));
        localStorage.setItem(STORAGE_V2, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_STORAGE);
        setTasks(migrated);
      } else {
        setTasks([]);
      }
    } catch {
      setTasks([]);
    }
  }, []);

  // cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_V2 && e.newValue) {
        const incoming = safeParse<Task[]>(e.newValue);
        if (incoming) setTasks(incoming);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = (next: Task[]) => {
    setTasks(next);
    try { localStorage.setItem(STORAGE_V2, JSON.stringify(next)); } catch {}
  };

  // ---- derived ----
  const visible = useMemo(() => {
    if (!tasks) return [];
    if (filter === 'active') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks?.length ?? 0;
    const completed = tasks?.filter(t => t.completed).length ?? 0;
    return { total, completed, active: total - completed };
  }, [tasks]);

  // ---- actions ----
  const handleAdd = () => {
    const t = normalize(task);
    if (!t) return;
    const exists = (tasks ?? []).some(x => normalize(x.title) === t);
    if (exists) {
      setTask('');
      return; // dedupe exact text
    }
    const next = [makeTask(t), ...(tasks ?? [])]; // newest first
    persist(next);
    setTask('');
  };

  const handleToggle = (id: string, checked: boolean) => {
    if (!tasks) return;
    const next = tasks.map(t => t.id === id ? { ...t, completed: checked, updatedAt: Date.now() } : t);
    persist(next);
  };

  const handleDelete = (id: string) => {
    if (!tasks) return;
    const next = tasks.filter(t => t.id !== id);
    persist(next);
  };

  const clearCompleted = () => {
    if (!tasks) return;
    persist(tasks.filter(t => !t.completed));
  };

  const completeAll = () => {
    if (!tasks) return;
    persist(tasks.map(t => t.completed ? t : ({ ...t, completed: true, updatedAt: Date.now() })));
  };

  const uncheckAll = () => {
    if (!tasks) return;
    persist(tasks.map(t => t.completed ? ({ ...t, completed: false, updatedAt: Date.now() }) : t));
  };

  // ---- UI ----
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Todo List</h1>
        <ModeToggle />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Textarea
          placeholder="Write a todo (Enter to add, Shift+Enter for newline)"
          className="h-[18vh] w-full"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <div className="flex sm:flex-col gap-2">
          <Button onClick={handleAdd} disabled={!normalize(task)}>Add</Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> {cap(filter)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('completed')}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="secondary" onClick={completeAll}><CheckSquare className="mr-2 h-4 w-4" />Complete all</Button>
          <Button variant="secondary" onClick={uncheckAll}><XSquare className="mr-2 h-4 w-4" />Uncheck all</Button>
          <Button variant="destructive" onClick={clearCompleted}><Trash2 className="mr-2 h-4 w-4" />Clear completed</Button>
        </div>
      </div>

      {tasks === null ? (
        <p className="opacity-60">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="opacity-60">No todos yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((t) => (
            <li key={t.id} className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                checked={t.completed}
                onCheckedChange={(v) => handleToggle(t.id, Boolean(v))}
              />
              <div className="flex-1 break-words">
                <p className={t.completed ? "line-through opacity-60" : ""}>{t.title}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="text-sm opacity-70">
        {stats.active} active • {stats.completed} completed • {stats.total} total
      </div>

      {/* If your PlayfulTodolist exposes toggle/delete callbacks, you can swap the list above: */}
      {/* 
      <PlayfulTodolist
        checkboxItems={visible.map((t, idx) => ({ id: idx, label: t.title, defaultChecked: t.completed }))}
        onDelete={(idx: number) => handleDelete(visible[idx].id)}
        onToggle={(idx: number, checked: boolean) => handleToggle(visible[idx].id, checked)}
        onCheckedChange={(idx: number, checked: boolean) => handleToggle(visible[idx].id, checked)}
      />
      */}
    </main>
  );
}

 function ModeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---- helpers ----
function makeTask(title: string): Task {
  return {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
function normalize(s: string) { return s.trim().replace(/\s+/g, ''); }
function safeParse<T>(raw: string): T | null { try { return JSON.parse(raw) as T; } catch { return null; } }
function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
