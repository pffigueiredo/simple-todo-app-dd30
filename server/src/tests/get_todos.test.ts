
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        { title: 'First todo', completed: false },
        { title: 'Second todo', completed: true },
        { title: 'Third todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].completed).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by created_at descending', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'First todo', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Second todo', completed: true })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Third todo', completed: false })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    // Most recent todo should be first
    expect(result[0].title).toEqual('Third todo');
    expect(result[1].title).toEqual('Second todo');
    expect(result[2].title).toEqual('First todo');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return todos with correct data types', async () => {
    await db.insert(todosTable)
      .values({ title: 'Test todo', completed: true })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    const todo = result[0];

    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.title).toEqual('Test todo');
    expect(todo.completed).toBe(true);
  });
});
