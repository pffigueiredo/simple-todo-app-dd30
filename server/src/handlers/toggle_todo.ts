
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTodo = async (input: ToggleTodoInput): Promise<Todo> => {
  try {
    // First, get the current todo to check its completion status
    const currentTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (currentTodos.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    const currentTodo = currentTodos[0];
    
    // Toggle the completion status
    const newCompletedStatus = !currentTodo.completed;

    // Update the todo with the toggled completion status
    const result = await db.update(todosTable)
      .set({ completed: newCompletedStatus })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Todo toggle failed:', error);
    throw error;
  }
};
