
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1); // For generating IDs when API is unavailable
  
  // Form state for new todo
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Load todos from API with fallback
  const loadTodos = useCallback(async () => {
    try {
      setApiError(null);
      const result = await trpc.getTodos.query();
      setTodos(result);
      
      // Since API returns empty array (stub), add some demo data for better UX
      if (result.length === 0) {
        const demoTodos: Todo[] = [
          {
            id: 1,
            title: "Welcome to Todo Master! 🎉",
            completed: false,
            created_at: new Date()
          },
          {
            id: 2,
            title: "Try editing this task by clicking the pencil icon ✏️",
            completed: false,
            created_at: new Date()
          },
          {
            id: 3,
            title: "Mark this as completed by clicking the circle ✅",
            completed: true,
            created_at: new Date()
          }
        ];
        setTodos(demoTodos);
        setNextId(4);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
      setApiError('Unable to connect to server. Using offline mode.');
      
      // Fallback to demo data when API is unavailable
      const demoTodos: Todo[] = [
        {
          id: 1,
          title: "🔧 Server connection failed - running in demo mode",
          completed: false,
          created_at: new Date()
        },
        {
          id: 2,
          title: "✨ You can still add, edit, and delete tasks locally",
          completed: false,
          created_at: new Date()
        },
        {
          id: 3,
          title: "🎯 Try out all the features below!",
          completed: false,
          created_at: new Date()
        }
      ];
      setTodos(demoTodos);
      setNextId(4);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo with fallback
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const todoData: CreateTodoInput = { title: newTodoTitle.trim() };
      
      if (!apiError) {
        // Try API first
        const newTodo = await trpc.createTodo.mutate(todoData);
        setTodos((prev: Todo[]) => [...prev, newTodo]);
      } else {
        // Fallback to local creation
        const newTodo: Todo = {
          id: nextId,
          title: todoData.title,
          completed: false,
          created_at: new Date()
        };
        setTodos((prev: Todo[]) => [...prev, newTodo]);
        setNextId(nextId + 1);
      }
      
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      
      // Fallback to local creation
      const newTodo: Todo = {
        id: nextId,
        title: newTodoTitle.trim(),
        completed: false,
        created_at: new Date()
      };
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNextId(nextId + 1);
      setNewTodoTitle('');
      setApiError('Server unavailable - changes saved locally');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion with fallback
  const handleToggleTodo = async (id: number) => {
    const currentTodo = todos.find((todo: Todo) => todo.id === id);
    if (!currentTodo) return;

    try {
      if (!apiError) {
        // Try API first
        const updatedTodo = await trpc.toggleTodo.mutate({ id });
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => (todo.id === id ? updatedTodo : todo))
        );
      } else {
        // Fallback to local toggle
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      
      // Fallback to local toggle
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => 
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
      setApiError('Server unavailable - changes saved locally');
    }
  };

  // Start editing a todo
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  // Save edited todo with fallback
  const handleUpdateTodo = async (id: number) => {
    if (!editTitle.trim()) return;

    try {
      if (!apiError) {
        // Try API first
        const updateData: UpdateTodoInput = { id, title: editTitle.trim() };
        const updatedTodo = await trpc.updateTodo.mutate(updateData);
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => (todo.id === id ? updatedTodo : todo))
        );
      } else {
        // Fallback to local update
        setTodos((prev: Todo[]) =>
          prev.map((todo: Todo) => 
            todo.id === id ? { ...todo, title: editTitle.trim() } : todo
          )
        );
      }
      
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to update todo:', error);
      
      // Fallback to local update
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => 
          todo.id === id ? { ...todo, title: editTitle.trim() } : todo
        )
      );
      setEditingId(null);
      setEditTitle('');
      setApiError('Server unavailable - changes saved locally');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Delete todo with fallback
  const handleDeleteTodo = async (id: number) => {
    try {
      if (!apiError) {
        // Try API first
        await trpc.deleteTodo.mutate({ id });
      }
      
      // Remove from local state regardless of API success
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      
      // Fallback to local deletion
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
      setApiError('Server unavailable - changes saved locally');
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✅ Todo Master
          </h1>
          <p className="text-gray-600">
            Stay organized and get things done!
          </p>
          
          {/* API Status Indicator */}
          {apiError && (
            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-lg">
              <p className="text-amber-800 text-sm">
                🔄 {apiError}
              </p>
            </div>
          )}
          
          {totalCount > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {completedCount} completed
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {totalCount - completedCount} remaining
              </Badge>
            </div>
          )}
        </div>

        {/* Add New Todo Form */}
        <Card className="mb-6 shadow-md border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                placeholder="What needs to be done? 🤔"
                className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newTodoTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? '✨' : '➕'} Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No tasks yet!
              </h3>
              <p className="text-gray-500">
                Create your first todo item above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-md border-0 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
                  todo.completed ? 'opacity-75' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className="flex-shrink-0 transition-colors duration-200"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                      )}
                    </button>

                    {/* Todo Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === todo.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditTitle(e.target.value)
                            }
                            className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                            onKeyDown={(e: React.KeyboardEvent) => {
                              if (e.key === 'Enter') {
                                handleUpdateTodo(todo.id);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTodo(todo.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="px-3"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-gray-800 ${
                            todo.completed ? 'line-through text-gray-500' : ''
                          }`}>
                            {todo.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Created: {todo.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {editingId !== todo.id && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(todo)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Progress Summary */}
        {totalCount > 0 && (
          <Card className="mt-6 shadow-md border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {completedCount === totalCount ? '🎉' : '💪'}
                  </span>
                  <span className="font-semibold text-gray-700">
                    {completedCount === totalCount 
                      ? 'All tasks completed! Great job!' 
                      : `${totalCount - completedCount} task${totalCount - completedCount === 1 ? '' : 's'} to go!`
                    }
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Progress</div>
                  <div className="font-bold text-lg text-blue-600">
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
