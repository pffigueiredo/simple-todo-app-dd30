
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle a todo from incomplete to complete', async () => {
    // Create a todo that is initially incomplete
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    const result = await toggleTodo(input);

    // Should be toggled to complete
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should toggle a todo from complete to incomplete', async () => {
    // Create a todo that is initially complete
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        completed: true
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    const result = await toggleTodo(input);

    // Should be toggled to incomplete
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Todo');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the toggle in the database', async () => {
    // Create a todo that is initially incomplete
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Persistence Test',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    await toggleTodo(input);

    // Query the database to verify the change was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].title).toEqual('Persistence Test');
  });

  it('should throw error for non-existent todo', async () => {
    const input: ToggleTodoInput = { id: 999 };

    await expect(toggleTodo(input)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should toggle multiple times correctly', async () => {
    // Create a todo
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Multiple Toggle Test',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;
    const input: ToggleTodoInput = { id: todoId };

    // First toggle: false -> true
    const firstToggle = await toggleTodo(input);
    expect(firstToggle.completed).toBe(true);

    // Second toggle: true -> false
    const secondToggle = await toggleTodo(input);
    expect(secondToggle.completed).toBe(false);

    // Third toggle: false -> true
    const thirdToggle = await toggleTodo(input);
    expect(thirdToggle.completed).toBe(true);
  });
});
