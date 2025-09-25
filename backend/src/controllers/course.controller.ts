import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createCourse(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    const instructorId = req.user.userId;
    if (!title || !description) {
      return res.status(400).json({ error: 'Missing title or description.' });
    }
    const course = await prisma.course.create({
      data: { title, description, instructorId },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course.' });
  }
}

export async function getCourses(req: Request, res: Response) {
  try {
    const courses = await prisma.course.findMany();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
}

export async function getCourseById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id: Number(id) } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course.' });
  }
}
