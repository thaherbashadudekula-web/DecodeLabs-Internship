/**
 * Verification Test Suite for Pulse API
 * Validates all endpoints, status codes, and two-pass validation constraints.
 */

const http = require("http");
const app = require("./server");

let server;
const PORT = 3099;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: PORT,
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("Starting Pulse API Automated Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = "") {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      if (details) console.error(`     Details:`, details);
      failed++;
    }
  }

  // 1. Health check
  const healthRes = await request({ path: "/api/health", method: "GET" });
  assert(healthRes.status === 200 && healthRes.body.status === "ok", "GET /api/health returns 200 OK");

  // 2. GET /api/tasks
  const tasksRes = await request({ path: "/api/tasks", method: "GET" });
  assert(tasksRes.status === 200 && Array.isArray(tasksRes.body), "GET /api/tasks returns 200 and array");

  // 3. GET /api/tasks?status=open
  const openTasksRes = await request({ path: "/api/tasks?status=open", method: "GET" });
  assert(
    openTasksRes.status === 200 && openTasksRes.body.every(t => t.status === "open"),
    "GET /api/tasks?status=open filters tasks by status"
  );

  // 4. GET /api/tasks/:id valid
  const task1Res = await request({ path: "/api/tasks/1", method: "GET" });
  assert(task1Res.status === 200 && task1Res.body.id === 1, "GET /api/tasks/1 returns 200 and task 1");

  // 5. GET /api/tasks/:id non-existent (404)
  const task999Res = await request({ path: "/api/tasks/999", method: "GET" });
  assert(task999Res.status === 404, "GET /api/tasks/999 returns 404 Not Found");

  // 6. GET /api/tasks/:id invalid id format (400)
  const taskBadIdRes = await request({ path: "/api/tasks/abc", method: "GET" });
  assert(taskBadIdRes.status === 400 && taskBadIdRes.body.error === "Validation failed", "GET /api/tasks/abc returns 400 Bad Request");

  // 7. POST /api/tasks valid (201)
  const newTaskRes = await request(
    { path: "/api/tasks", method: "POST" },
    { title: "Test automated task", projectId: 1, priority: "high", status: "open" }
  );
  assert(
    newTaskRes.status === 201 && newTaskRes.body.title === "Test automated task" && newTaskRes.body.id > 0,
    "POST /api/tasks returns 201 Created and newly created task"
  );
  const createdTaskId = newTaskRes.body.id;

  // 8. POST /api/tasks validation failure - syntactic (missing fields & bad types)
  const taskFailSyntactic = await request(
    { path: "/api/tasks", method: "POST" },
    { title: "", projectId: "not-a-number" }
  );
  assert(
    taskFailSyntactic.status === 400 &&
    taskFailSyntactic.body.error === "Validation failed" &&
    Array.isArray(taskFailSyntactic.body.details) &&
    taskFailSyntactic.body.details.length >= 2,
    "POST /api/tasks with bad types returns 400 with details array"
  );

  // 9. POST /api/tasks validation failure - semantic (invalid priority and invalid projectId)
  const taskFailSemantic = await request(
    { path: "/api/tasks", method: "POST" },
    { title: "Valid title", projectId: 99999, priority: "super-urgent" }
  );
  assert(
    taskFailSemantic.status === 400 &&
    taskFailSemantic.body.details.some(d => d.includes("priority")) &&
    taskFailSemantic.body.details.some(d => d.includes("projectId")),
    "POST /api/tasks with invalid priority/projectId returns semantic validation errors"
  );

  // 10. PUT /api/tasks/:id valid (200)
  const updateTaskRes = await request(
    { path: `/api/tasks/${createdTaskId}`, method: "PUT" },
    { status: "done", priority: "low" }
  );
  assert(
    updateTaskRes.status === 200 && updateTaskRes.body.status === "done" && updateTaskRes.body.priority === "low",
    "PUT /api/tasks/:id returns 200 OK and updated task"
  );

  // 11. DELETE /api/tasks/:id valid (204)
  const delTaskRes = await request({ path: `/api/tasks/${createdTaskId}`, method: "DELETE" });
  assert(delTaskRes.status === 204 && delTaskRes.body === null, "DELETE /api/tasks/:id returns 204 No Content with empty body");

  // Verify it's gone
  const getDeletedRes = await request({ path: `/api/tasks/${createdTaskId}`, method: "GET" });
  assert(getDeletedRes.status === 404, "GET deleted task returns 404 Not Found");

  // 12. GET /api/projects
  const projectsRes = await request({ path: "/api/projects", method: "GET" });
  assert(projectsRes.status === 200 && Array.isArray(projectsRes.body), "GET /api/projects returns 200 and array");

  // 13. GET /api/projects/:id
  const project1Res = await request({ path: "/api/projects/1", method: "GET" });
  assert(project1Res.status === 200 && project1Res.body.id === 1, "GET /api/projects/1 returns 200 and project 1");

  // 14. GET /api/projects/:id/tasks
  const project1Tasks = await request({ path: "/api/projects/1/tasks", method: "GET" });
  assert(
    project1Tasks.status === 200 && Array.isArray(project1Tasks.body) && project1Tasks.body.every(t => t.projectId === 1),
    "GET /api/projects/1/tasks returns tasks belonging to project 1"
  );

  // 15. GET /api/projects/:id/tasks for non-existent project (404)
  const project999Tasks = await request({ path: "/api/projects/999/tasks", method: "GET" });
  assert(project999Tasks.status === 404, "GET /api/projects/999/tasks returns 404 Not Found");

  // 16. POST /api/projects valid (201)
  const newProjRes = await request(
    { path: "/api/projects", method: "POST" },
    { name: "Brand New Initiative", progress: 25 }
  );
  assert(
    newProjRes.status === 201 && newProjRes.body.name === "Brand New Initiative" && newProjRes.body.progress === 25,
    "POST /api/projects returns 201 Created and project"
  );
  const createdProjId = newProjRes.body.id;

  // 17. POST /api/projects validation failure
  const projFailRes = await request(
    { path: "/api/projects", method: "POST" },
    { name: "", progress: 150 }
  );
  assert(
    projFailRes.status === 400 &&
    projFailRes.body.details.some(d => d.includes("name")) &&
    projFailRes.body.details.some(d => d.includes("progress")),
    "POST /api/projects returns 400 Bad Request on invalid name and progress > 100"
  );

  // 18. PUT /api/projects/:id valid (200)
  const updateProjRes = await request(
    { path: `/api/projects/${createdProjId}`, method: "PUT" },
    { progress: 85 }
  );
  assert(
    updateProjRes.status === 200 && updateProjRes.body.progress === 85,
    "PUT /api/projects/:id returns 200 OK and updated progress"
  );

  // 19. DELETE /api/projects/:id valid (204)
  const delProjRes = await request({ path: `/api/projects/${createdProjId}`, method: "DELETE" });
  assert(delProjRes.status === 204 && delProjRes.body === null, "DELETE /api/projects/:id returns 204 No Content");

  // 20. Catch-all 404 for unknown route
  const unknownRes = await request({ path: "/api/unknown-endpoint", method: "GET" });
  assert(unknownRes.status === 404 && unknownRes.body.error === "Not Found", "Unknown route returns 404 Not Found");

  console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
  return failed === 0;
}

server = app.listen(PORT, async () => {
  try {
    const success = await runTests();
    server.close(() => {
      process.exit(success ? 0 : 1);
    });
  } catch (err) {
    console.error("Test execution error:", err);
    server.close(() => {
      process.exit(1);
    });
  }
});
