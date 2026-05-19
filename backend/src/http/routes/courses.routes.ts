import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { CourseRepository } from '../../domain/course/CourseRepository';
import { listCourses } from '../../domain/use-cases/listCourses';
import { createCourse } from '../../domain/use-cases/createCourse';
import { updateCourse } from '../../domain/use-cases/updateCourse';
import { deleteCourse } from '../../domain/use-cases/deleteCourse';
import { createCourseSchema, updateCourseSchema } from '../schemas';
import { throwOnInvalid } from '../validatorHook';

export interface CoursesDeps { repo: CourseRepository; }

export function buildCoursesRoutes(deps: CoursesDeps) {
  const r = new Hono();

  r.get('/', async (c) => {
    const items = await listCourses(deps)();
    return c.json({ items });
  });

  r.post('/', zValidator('json', createCourseSchema, throwOnInvalid), async (c) => {
    const body = c.req.valid('json');
    const course = await createCourse(deps)(body);
    return c.json({ course }, 201);
  });

  r.put('/:id', zValidator('json', updateCourseSchema, throwOnInvalid), async (c) => {
    const body = c.req.valid('json');
    const course = await updateCourse(deps)({ courseId: c.req.param('id'), name: body.name });
    return c.json({ course });
  });

  r.delete('/:id', async (c) => {
    await deleteCourse(deps)({ courseId: c.req.param('id') });
    return c.body(null, 204);
  });

  return r;
}
