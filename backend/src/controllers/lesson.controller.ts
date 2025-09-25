import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function uploadLesson(req: Request, res: Response) {
  try {
    const { title, courseId } = req.body;
    const videoUrl = req.file?.path;
    if (!title || !courseId || !videoUrl) {
      return res.status(400).json({ error: 'Missing fields or video file.' });
    }
    const lesson = await prisma.lesson.create({
      data: { title, videoUrl, courseId: Number(courseId) },
    });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload lesson.' });
  }
}

export async function getLessonsByCourse(req: Request, res: Response) {
  try {
    const { courseId } = req.params;
    const lessons = await prisma.lesson.findMany({
      where: { courseId: Number(courseId) },
    });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lessons.' });
  }
}
