
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title only', async () => {
    // Create test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        completed: false
      })
      .returning()
      .execute();

    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update completion status only', async () => {
    // Create test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both title and completion status', async () => {
    // Create test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        completed: false
      })
      .returning()
      .execute();

    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create test todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Original Title',
        completed: false
      })
      .returning()
      .execute();

    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Title',
      completed: true
    };

    await updateTodo(updateInput);

    // Verify changes were saved to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].completed).toEqual(true);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle updating completed status to false', async () => {
    // Create completed todo
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        completed: true
      })
      .returning()
      .execute();

    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await updateTodo(updateInput);

    expect(result.completed).toEqual(false);
    expect(result.title).toEqual('Completed Todo'); // Should remain unchanged
  });
});
