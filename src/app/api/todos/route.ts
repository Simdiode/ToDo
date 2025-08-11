import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { NextResponse } from 'next/server'

// GET all todos
export async function GET() {
  const todos = await prisma.todo.findMany();
  return Response.json(todos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title } = body;

  if (!title) {
    return Response.json({ error: 'Missing title or description' }, { status: 400 });
  }

  const todo = await prisma.todo.create({
    data: {
      title,
    },
  });

  return Response.json(todo, { status: 201 });
}