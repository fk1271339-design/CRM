import { requireAuth } from "@/lib/auth";
import { getTasks } from "@/actions/tasks";
import { TasksClientPage } from "@/components/tasks/tasks-client";

export default async function TasksPage() {
  await requireAuth();
  const tasks = await getTasks();

  return <TasksClientPage initialTasks={tasks} />;
}
