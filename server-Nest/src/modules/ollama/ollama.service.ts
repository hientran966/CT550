import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { ProjectService } from '../project/project.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class OllamaService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
  ) {}

  async askOllama(prompt: string) {
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const model = process.env.OLLAMA_MODEL;

    if (!baseUrl || !model) {
      throw new InternalServerErrorException('Thieu cau hinh OLLAMA trong .env');
    }

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    const result: any = await response.json();
    return result.response;
  }

  async taskCreate(payload: any) {
    const { projectId, userId, taskCount } = payload;
    if (!taskCount || !projectId || !userId) {
      throw new BadRequestException('Thieu thong tin');
    }

    const project = await this.projectService.findById(Number(projectId));
    if (!project) throw new BadRequestException('Khong tim thay du an.');

    const prompt = `
Ban la tro ly quan ly du an.
Du an: ${project.name}
Mo ta: ${project.description || '(khong co mo ta)'}
Task hien co: ${project.tasks || '(khong co task)'}

Hay liet ke ${Number(taskCount) > 0 ? taskCount : 'cac'} task cu the can thuc hien de hoan thanh du an nay.

Chi tra ve JSON hop le:
[
  { "title": "Ten task 1", "description": "Mo ta ngan" },
  { "title": "Ten task 2", "description": "Mo ta ngan" }
]
Khong them giai thich, tieu de, hoac van ban khac ngoai JSON.
`;

    const rawTasks = await this.askOllama(prompt);
    let taskList: any[];

    try {
      const jsonMatch = rawTasks.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const parsed = JSON.parse(jsonMatch[0]);
      taskList = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return rawTasks;
    }

    const createdTasks: any[] = [];
    for (const task of taskList) {
      createdTasks.push(
        await this.taskService.create({
          title: task.title,
          description: task.description,
          start_date: new Date(),
          due_date: new Date(),
          created_by: userId,
          project_id: projectId,
        }),
      );
    }

    return { tasks: createdTasks };
  }
}
