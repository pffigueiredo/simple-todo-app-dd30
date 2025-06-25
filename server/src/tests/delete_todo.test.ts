
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const input: DeleteTodoInput = {
      id: createdTodo.id
    };

    const result = await deleteTodo(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo was deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteTodo(input);

    // Should return false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const [todo1] = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        completed: false
      })
      .returning()
      .execute();

    const [todo2] = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        completed: true
      })
      .returning()
      .execute();

    // Delete only the first todo
    const input: DeleteTodoInput = {
      id: todo1.id
    };

    const result = await deleteTodo(input);

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
    expect(remainingTodos[0].completed).toBe(true);
  });
});
