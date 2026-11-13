import { useEffect, useState } from "react";
import api from "./services/api";
import WhiteboardManager from "./features/whiteboard/WhiteboardManager";
import "./App.css";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [selectedDocumentProjectId, setSelectedDocumentProjectId] = useState("");
  const [selectedWhiteboardProjectId, setSelectedWhiteboardProjectId] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [documentMessage, setDocumentMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskError, setTaskError] = useState("");
  const [taskForm, setTaskForm] = useState({
    project: "",
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    due_date: "",
    assigned_to: "",
  });
  const [workspaces, setWorkspaces] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [memberActionId, setMemberActionId] = useState(null);
  const [invitationActionId, setInvitationActionId] = useState(null);
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [error, setError] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    workspace: "",
    status: "ACTIVE",
  });

  function handleUnauthorized(err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.replace("/login");
      return true;
    }

    return false;
  }

  function getCurrentUserId() {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.user_id ?? payload.userId ?? null;
    } catch {
      return null;
    }
  }

  const currentUserId = getCurrentUserId();
  const currentMembership = members.find(
    (member) => String(member.user) === String(currentUserId)
  );
  const canManageMembers = ["OWNER", "ADMIN"].includes(currentMembership?.role);
  const isWorkspaceOwner = currentMembership?.role === "OWNER";

  async function loadInvitations(workspaceId = selectedWorkspaceId) {
    if (!workspaceId) {
      setInvitations([]);
      return;
    }
    setInvitationsLoading(true);
    try {
      const response = await api.get(`workspaces/${workspaceId}/invitations/pending/`);
      const data = response.data;
      setInvitations(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized(err);
        return;
      }
      setInvitations([]);
    } finally {
      setInvitationsLoading(false);
    }
  }

  async function handleChangeMemberRole(member, role) {
    if (!role || role === member.role) return;
    if (!window.confirm(`Change ${member.username}'s role to ${role}?`)) return;
    setMemberActionId(member.id);
    setMemberError("");
    setMemberMessage("");
    try {
      const response = await api.patch(
        `workspaces/${selectedWorkspaceId}/members/${member.id}/role/`,
        { role }
      );
      setMembers((previous) =>
        previous.map((item) => item.id === member.id ? response.data : item)
      );
      setMemberMessage(`${member.username}'s role updated to ${role}.`);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setMemberError(err.response?.data?.detail || "Role update nahi hua.");
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Remove ${member.username} from this workspace? Their account will not be deleted.`)) return;
    setMemberActionId(member.id);
    setMemberError("");
    setMemberMessage("");
    try {
      await api.delete(`workspaces/${selectedWorkspaceId}/members/${member.id}/`);
      setMembers((previous) => previous.filter((item) => item.id !== member.id));
      setMemberMessage(`${member.username} has been removed from this workspace.`);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setMemberError(err.response?.data?.detail || "Member remove nahi hua.");
    } finally {
      setMemberActionId(null);
    }
  }

  async function handleRevokeInvitation(invitation) {
    if (!window.confirm(`Revoke the pending invitation for ${invitation.email}?`)) return;
    setInvitationActionId(invitation.id);
    setMemberError("");
    setMemberMessage("");
    try {
      await api.post(`workspaces/${selectedWorkspaceId}/invitations/${invitation.id}/revoke/`);
      setInvitations((previous) => previous.filter((item) => item.id !== invitation.id));
      setMemberMessage(`Invitation for ${invitation.email} revoked.`);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setMemberError(err.response?.data?.detail || "Invitation revoke nahi hui.");
    } finally {
      setInvitationActionId(null);
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [projectResponse, workspaceResponse, taskResponse] =
        await Promise.all([
          api.get("projects/"),
          api.get("workspaces/"),
          api.get("tasks/"),
        ]);

      const projectData = projectResponse.data;
      const workspaceData = workspaceResponse.data;
      const taskData = taskResponse.data;

      const projectList = Array.isArray(projectData)
        ? projectData
        : projectData.results || [];

      const workspaceList = Array.isArray(workspaceData)
        ? workspaceData
        : workspaceData.results || [];
      const taskList = Array.isArray(taskData)
        ? taskData
        : taskData.results || [];

      setProjects(projectList);
      setWorkspaces(workspaceList);
      setTasks(taskList);

      setSelectedWorkspaceId((previous) => {
        const exists = workspaceList.some(
          (workspace) =>
            String(workspace.id) === String(previous)
        );

        if (exists) return String(previous);

        return workspaceList.length
          ? String(workspaceList[0].id)
          : "";
      });

      setForm((previous) => {
        const exists = workspaceList.some(
          (workspace) =>
            String(workspace.id) === String(previous.workspace)
        );

        return {
          ...previous,
          workspace: exists
            ? String(previous.workspace)
            : workspaceList.length
              ? String(workspaceList[0].id)
              : "",
        };
      });
    } catch (err) {
      if (handleUnauthorized(err)) return;

      setError("Data load nahi hua. Backend aur API check karo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Load members whenever the selected workspace changes.
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    async function loadMembers() {
      setMembersLoading(true);
      setMemberError("");
      try {
        const response = await api.get(
          `workspaces/${selectedWorkspaceId}/members/`
        );
        const data = response.data;
        const list = Array.isArray(data) ? data : data.results || [];
        if (!cancelled) setMembers(list);
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorized(err);
          return;
        }
        if (!cancelled) {
          setMemberError(
            err.response?.data?.detail ||
              "Workspace members load nahi hue."
          );
          setMembers([]);
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadMembers();
    loadInvitations(selectedWorkspaceId);
    return () => {
      cancelled = true;
    };
  }, [selectedWorkspaceId]);

  async function handleAddMember(event) {
    event.preventDefault();
    const email = memberEmail.trim();
    setMemberError("");
    setMemberMessage("");

    if (!selectedWorkspaceId) {
      setMemberError("Pehle workspace select karo.");
      return;
    }
    if (!email) {
      setMemberError("Email address enter karo.");
      return;
    }

    setMemberSaving(true);
    try {
      await api.post(
        `workspaces/${selectedWorkspaceId}/invitations/`,
        { email }
      );

      setMemberEmail("");
      setMemberMessage(
        `Invitation ${email} par create ho gayi. Invitee ko invitation link email/console output se open karke sign in ya register karna hoga.`
      );
    } catch (err) {
      if (handleUnauthorized(err)) return;

      const data = err.response?.data;
      let message = "Invitation send nahi hui. Please try again.";

      if (typeof data === "string") {
        message = data;
      } else if (typeof data?.email === "string") {
        message = data.email;
      } else if (Array.isArray(data?.email)) {
        message = data.email.join(" ");
      } else if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (data && typeof data === "object") {
        message = Object.values(data).flat().map(String).join(" ");
      } else if (err.message) {
        message = err.message;
      }

      // Existing-member / pending-invitation cases are informational,
      // so show them as a normal message instead of a red error.
      if (
        message.toLowerCase().includes("already a workspace member") ||
        message.toLowerCase().includes("already a member")
      ) {
        setMemberMessage(`${email} is already a member of this workspace.`);
      } else if (
        message.toLowerCase().includes("pending invitation already exists")
      ) {
        setMemberMessage(`An invitation for ${email} is already pending.`);
      } else {
        setMemberError(message);
      }
    } finally {
      setMemberSaving(false);
    }
  }

  // Create workspace
  async function handleCreateWorkspace(event) {
    event.preventDefault();
    setWorkspaceError("");

    const trimmedName = workspaceName.trim();

    if (!trimmedName) {
      setWorkspaceError("Workspace ka naam enter karo.");
      return;
    }

    setCreatingWorkspace(true);

    try {
      const response = await api.post("workspaces/", {
        name: trimmedName,
      });

      const newWorkspace = response.data;

      setWorkspaces((previous) => [
        ...previous,
        newWorkspace,
      ]);

      setSelectedWorkspaceId(String(newWorkspace.id));

      setForm((previous) => ({
        ...previous,
        workspace: String(newWorkspace.id),
      }));

      setWorkspaceName("");
      setShowWorkspaceForm(false);

      await loadData();

      setSelectedWorkspaceId(String(newWorkspace.id));

      setForm((previous) => ({
        ...previous,
        workspace: String(newWorkspace.id),
      }));
    } catch (err) {
      if (handleUnauthorized(err)) return;

      const data = err.response?.data;

      setWorkspaceError(
        typeof data === "string"
          ? data
          : data
            ? JSON.stringify(data)
            : "Workspace create nahi hua."
      );
    } finally {
      setCreatingWorkspace(false);
    }
  }

  // Open an empty form for creating a project
  function openCreateProjectForm() {
    setEditingProject(null);
    setError("");

    setForm({
      name: "",
      description: "",
      workspace: selectedWorkspaceId,
      status: "ACTIVE",
    });

    setShowForm(true);
  }

  // Open the form with existing project details
  function handleEditProject(project) {
    setEditingProject(project);
    setError("");

    setForm({
      name: project.name || "",
      description: project.description || "",
      workspace: String(project.workspace),
      status: project.status || "ACTIVE",
    });

    setShowForm(true);
  }
  
async function handleDeleteProject(project) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  setDeletingProjectId(project.id);
  setError("");

  try {
    await api.delete(`projects/${project.id}/`);

    setProjects((previous) =>
      previous.filter((item) => item.id !== project.id)
    );
  } catch (err) {
    if (handleUnauthorized(err)) return;

    if (err.response?.status === 403) {
      setError("Only workspace owners and admins can delete projects.");
    } else {
      setError(
        err.response?.data?.detail ||
          "Project delete nahi hua. Please try again."
      );
    }
  } finally {
    setDeletingProjectId(null);
  }
}

  // Create OR update project
  async function handleSubmitProject(event) {
    event.preventDefault();
    setError("");

    if (!form.workspace) {
      setError("Pehle ek workspace select karo.");
      return;
    }

    if (!form.name.trim()) {
      setError("Project name required hai.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      workspace: Number(form.workspace),
      status: form.status,
    };

    try {
      let response;

      if (editingProject) {
        // Update existing project
        response = await api.patch(
          `projects/${editingProject.id}/`,
          payload
        );

        setProjects((previous) =>
          previous.map((project) =>
            project.id === editingProject.id
              ? response.data
              : project
          )
        );
      } else {
        // Create a new project
        response = await api.post("projects/", payload);

        setProjects((previous) => [
          response.data,
          ...previous,
        ]);
      }

      const savedProject = response.data;

      setSelectedWorkspaceId(String(savedProject.workspace));

      setForm({
        name: "",
        description: "",
        workspace: String(savedProject.workspace),
        status: "ACTIVE",
      });

      setEditingProject(null);
      setShowForm(false);
    } catch (err) {
      if (handleUnauthorized(err)) return;

      const data = err.response?.data;

      setError(
        typeof data === "string"
          ? data
          : data
            ? JSON.stringify(data)
            : editingProject
              ? "Project update nahi hua."
              : "Project create nahi hua."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeProjectForm() {
    setShowForm(false);
    setEditingProject(null);
    setError("");
  }

  // Shared Documents & Notes
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setSelectedDocumentProjectId("");
      setDocuments([]);
      setSelectedDocument(null);
      setDocumentTitle("");
      setDocumentContent("");
      return;
    }

    const workspaceProjects = projects.filter(
      (project) => String(project.workspace) === String(selectedWorkspaceId)
    );
    setSelectedDocumentProjectId((previous) => {
      const stillExists = workspaceProjects.some(
        (project) => String(project.id) === String(previous)
      );
      return stillExists ? String(previous) : workspaceProjects.length ? String(workspaceProjects[0].id) : "";
    });

    setSelectedWhiteboardProjectId((previous) => {
      const stillExists = workspaceProjects.some(
        (project) => String(project.id) === String(previous)
      );
      return stillExists ? String(previous) : workspaceProjects.length ? String(workspaceProjects[0].id) : "";
    });
  }, [selectedWorkspaceId, projects]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      if (!selectedDocumentProjectId) {
        setDocuments([]);
        setSelectedDocument(null);
        setDocumentTitle("");
        setDocumentContent("");
        return;
      }

      setDocumentsLoading(true);
      setDocumentError("");
      try {
        const response = await api.get(`projects/${selectedDocumentProjectId}/documents/`);
        const data = response.data;
        const list = Array.isArray(data) ? data : data.results || [];
        if (!cancelled) {
          setDocuments(list);
          setSelectedDocument(null);
          setDocumentTitle("");
          setDocumentContent("");
        }
      } catch (err) {
        if (handleUnauthorized(err)) return;
        if (!cancelled) {
          setDocuments([]);
          setDocumentError(err.response?.data?.detail || "Documents load nahi hue.");
        }
      } finally {
        if (!cancelled) setDocumentsLoading(false);
      }
    }

    loadDocuments();
    return () => { cancelled = true; };
  }, [selectedDocumentProjectId]);

  function startNewDocument() {
    setSelectedDocument(null);
    setDocumentTitle("");
    setDocumentContent("");
    setDocumentError("");
    setDocumentMessage("");
    document.getElementById("documents-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function openDocument(documentItem) {
    setSelectedDocument(documentItem);
    setDocumentTitle(documentItem.title || "");
    setDocumentContent(documentItem.content || "");
    setDocumentError("");
    setDocumentMessage("");
  }

  async function handleSaveDocument(event) {
    event.preventDefault();
    setDocumentError("");
    setDocumentMessage("");

    if (!selectedDocumentProjectId) {
      setDocumentError("Pehle ek project select karo.");
      return;
    }
    if (!documentTitle.trim()) {
      setDocumentError("Document title required hai.");
      return;
    }

    setDocumentSaving(true);
    const payload = {
      title: documentTitle.trim(),
      content: documentContent,
    };

    try {
      let response;
      if (selectedDocument) {
        response = await api.patch(`documents/${selectedDocument.id}/`, payload);
        setDocuments((previous) => previous.map((item) => item.id === response.data.id ? response.data : item));
        setDocumentMessage("Document changes saved.");
      } else {
        response = await api.post(`projects/${selectedDocumentProjectId}/documents/`, payload);
        setDocuments((previous) => [response.data, ...previous]);
        setDocumentMessage("Document created successfully.");
      }
      setSelectedDocument(response.data);
      setDocumentTitle(response.data.title || "");
      setDocumentContent(response.data.content || "");
    } catch (err) {
      if (handleUnauthorized(err)) return;
      const data = err.response?.data;
      setDocumentError(data?.detail || (data ? JSON.stringify(data) : "Document save nahi hua."));
    } finally {
      setDocumentSaving(false);
    }
  }

  async function handleDeleteDocument(documentItem) {
    if (!window.confirm(`Delete document "${documentItem.title}"? This cannot be undone.`)) return;
    setDeletingDocumentId(documentItem.id);
    setDocumentError("");
    setDocumentMessage("");
    try {
      await api.delete(`documents/${documentItem.id}/`);
      setDocuments((previous) => previous.filter((item) => item.id !== documentItem.id));
      if (selectedDocument?.id === documentItem.id) {
        setSelectedDocument(null);
        setDocumentTitle("");
        setDocumentContent("");
      }
      setDocumentMessage("Document deleted.");
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setDocumentError(err.response?.data?.detail || "Document delete nahi hua.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  // Task CRUD
  function openCreateTaskForm() {
    setEditingTask(null);
    setTaskError("");
    setTaskForm({
      project: filteredProjects.length ? String(filteredProjects[0].id) : "",
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      due_date: "",
      assigned_to: "",
    });
    setShowTaskForm(true);
    document.getElementById("tasks-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function openEditTaskForm(task) {
    setEditingTask(task);
    setTaskError("");
    setTaskForm({
      project: String(task.project),
      title: task.title || "",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "MEDIUM",
      due_date: task.due_date || "",
      assigned_to: task.assigned_to ? String(task.assigned_to) : "",
    });
    setShowTaskForm(true);
  }

  async function handleSubmitTask(event) {
    event.preventDefault();
    setTaskError("");

    if (!taskForm.project) {
      setTaskError("Pehle is workspace ke liye project create karo.");
      return;
    }
    if (!taskForm.title.trim()) {
      setTaskError("Task title required hai.");
      return;
    }

    setTaskSaving(true);
    const payload = {
      project: Number(taskForm.project),
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      status: taskForm.status,
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
    };

    try {
      let response;
      if (editingTask) {
        response = await api.patch(`tasks/${editingTask.id}/`, payload);
        setTasks((previous) =>
          previous.map((task) => task.id === editingTask.id ? response.data : task)
        );
      } else {
        response = await api.post("tasks/", payload);
        setTasks((previous) => [response.data, ...previous]);
      }
      setShowTaskForm(false);
      setEditingTask(null);
    } catch (err) {
      if (handleUnauthorized(err)) return;
      const data = err.response?.data;
      setTaskError(
        data?.detail ||
        (data ? JSON.stringify(data) : "Task save nahi hua. Please try again.")
      );
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleDeleteTask(task) {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    setDeletingTaskId(task.id);
    setTaskError("");
    try {
      await api.delete(`tasks/${task.id}/`);
      setTasks((previous) => previous.filter((item) => item.id !== task.id));
    } catch (err) {
      if (handleUnauthorized(err)) return;
      setTaskError(
        err.response?.data?.detail ||
        "Task delete nahi hua. Task creator, workspace owner, ya admin permission required ho sakti hai."
      );
    } finally {
      setDeletingTaskId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.replace("/login");
  }

  const filteredProjects = projects.filter(
    (project) =>
      String(project.workspace) === String(selectedWorkspaceId)
  );

  const activeProjects = filteredProjects.filter(
    (project) => project.status === "ACTIVE"
  ).length;

  const selectedProjectIds = new Set(filteredProjects.map((project) => project.id));
  const filteredTasks = tasks.filter((task) => selectedProjectIds.has(task.project));
  const pendingTasks = filteredTasks.filter((task) => task.status !== "DONE").length;

  const selectedWorkspace = workspaces.find(
    (workspace) =>
      String(workspace.id) === String(selectedWorkspaceId)
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">ConvergeDesk</h2>

        <p className="section-label">WORKSPACE</p>

        <div className="workspace-switcher">
          <label htmlFor="workspace-switcher">
            Current workspace
          </label>

          <select
            id="workspace-switcher"
            value={selectedWorkspaceId}
            onChange={(event) => {
              const id = event.target.value;

              setSelectedWorkspaceId(id);

              setForm((previous) => ({
                ...previous,
                workspace: id,
              }));

              setError("");
            }}
          >
            <option value="">Select workspace</option>

            {workspaces.map((workspace) => (
              <option
                key={workspace.id}
                value={workspace.id}
              >
                {workspace.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="workspace-create-button"
            onClick={() => {
              setWorkspaceError("");
              setShowWorkspaceForm(true);
            }}
          >
            + Create workspace
          </button>

        </div>

        <button type="button" className="nav-item active">
          🏠 Overview
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={openCreateProjectForm}
        >
          📋 Projects
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => document.getElementById("tasks-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ✅ Tasks
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => document.getElementById("documents-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          📝 Documents
        </button>

        <button type="button" className="nav-item">
          📅 Meetings
        </button>

        <div className="sidebar-bottom">
          <p>Team workspace</p>
          <span>One space. One workflow.</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>Good morning 👋</h1>

            <p>
              {selectedWorkspace
                ? `Currently viewing: ${selectedWorkspace.name}`
                : "Create or select a workspace to get started."}
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="primary-button"
              onClick={openCreateProjectForm}
            >
              + New project
            </button>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="welcome-card">
          <div>
            <p className="eyebrow">CONVERGEDESK OVERVIEW</p>

            <h2>
              Everything your team needs, in one place.
            </h2>

            <p>
              Bring projects, tasks, documents and meetings
              together so your team can focus on building.
            </p>
          </div>

          <div className="welcome-icon">✦</div>
        </section>

        {error && !showForm && (
          <p className="project-error">{error}</p>
        )}

        <section className="stats-grid">
          <article className="stat-card">
            <span>Active projects</span>
            <h2>{loading ? "..." : activeProjects}</h2>
            <p>Active projects in this workspace</p>
          </article>

          <article className="stat-card">
            <span>Pending tasks</span>
            <h2>{loading ? "..." : pendingTasks}</h2>
            <p>Tasks that need attention</p>
          </article>

          <article className="stat-card">
            <span>Team members</span>
            <h2>{selectedWorkspaceId ? (membersLoading ? "..." : members.length) : "—"}</h2>
            <p>Workspace members</p>
          </article>

          <article className="stat-card">
            <span>Upcoming meetings</span>
            <h2>0</h2>
            <p>Your next team sessions</p>
          </article>
        </section>

        <section className="content-card" id="members-section" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h3>Workspace members</h3>
              <p>
                {selectedWorkspace
                  ? `People in ${selectedWorkspace.name}`
                  : "Select a workspace to view members"}
              </p>
            </div>
          </div>

          {!selectedWorkspaceId ? (
            <div className="empty-state">
              <h4>Select a workspace</h4>
              <p>Choose a workspace to view and add team members.</p>
            </div>
          ) : (
            <>
              {membersLoading ? (
                <p className="project-message">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="project-message">No members found.</p>
              ) : (
                <div className="project-list">
                  {members.map((member) => (
                    <article className="project-item" key={member.id}>
                      <div className="project-details">
                        <h4>{member.username}</h4>
                        <p>{member.email || "No email available"}</p>
                      </div>
                      <div className="project-actions">
                        {member.role === "OWNER" ? (
                          <span className="project-status">OWNER</span>
                        ) : canManageMembers ? (
                          <>
                            <select
                              aria-label={`Role for ${member.username}`}
                              value={member.role}
                              disabled={!isWorkspaceOwner || memberActionId === member.id}
                              onChange={(event) => handleChangeMemberRole(member, event.target.value)}
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                              type="button"
                              className="delete-project-button"
                              disabled={memberActionId === member.id}
                              onClick={() => handleRemoveMember(member)}
                            >
                              {memberActionId === member.id ? "Working..." : "Remove"}
                            </button>
                          </>
                        ) : (
                          <span className="project-status">{member.role}</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {canManageMembers && (
                <div style={{ marginTop: "20px" }}>
                  <h4>Pending invitations</h4>
                  {invitationsLoading ? (
                    <p className="project-message">Loading invitations...</p>
                  ) : invitations.length === 0 ? (
                    <p className="project-message">No pending invitations.</p>
                  ) : (
                    <div className="project-list">
                      {invitations.map((invitation) => (
                        <article className="project-item" key={invitation.id}>
                          <div className="project-details">
                            <h4>{invitation.email}</h4>
                            <p>
                              Invited by {invitation.invited_by_username || "workspace admin"}
                              {invitation.expires_at ? ` · Expires ${new Date(invitation.expires_at).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                          <div className="project-actions">
                            <span className="project-status">PENDING</span>
                            <button
                              type="button"
                              className="delete-project-button"
                              disabled={invitationActionId === invitation.id}
                              onClick={() => handleRevokeInvitation(invitation)}
                            >
                              {invitationActionId === invitation.id ? "Revoking..." : "Revoke"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleAddMember} style={{ marginTop: "18px" }}>
                <label htmlFor="member-email">Invite team member by email</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                  <input
                    id="member-email"
                    type="email"
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    style={{ flex: "1", minWidth: "180px" }}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={memberSaving || !selectedWorkspaceId}
                  >
                    {memberSaving ? "Sending invite..." : "+ Send invitation"}
                  </button>
                </div>
              </form>
              {memberError && <p className="project-error">{memberError}</p>}
              {memberMessage && <p className="project-message">{memberMessage}</p>}
            </>
          )}
        </section>

        <section className="content-card" id="documents-section" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h3>Shared Documents &amp; Notes</h3>
              <p>Project notes saved to your workspace database.</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={startNewDocument}
              disabled={!filteredProjects.length}
            >
              + New document
            </button>
          </div>

          {!selectedWorkspaceId ? (
            <div className="empty-state">
              <h4>Select a workspace</h4>
              <p>Choose a workspace before opening its documents.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <h4>Create a project first</h4>
              <p>Documents belong to a project. Create a project to get started.</p>
            </div>
          ) : (
            <>
              <label htmlFor="document-project-select">Project</label>
              <select
                id="document-project-select"
                value={selectedDocumentProjectId}
                onChange={(event) => {
                  setSelectedDocumentProjectId(event.target.value);
                  setSelectedDocument(null);
                  setDocumentTitle("");
                  setDocumentContent("");
                  setDocumentMessage("");
                  setDocumentError("");
                }}
                style={{ display: "block", width: "100%", margin: "8px 0 18px" }}
              >
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>

              {documentError && <p className="project-error">{documentError}</p>}
              {documentMessage && <p className="project-message">{documentMessage}</p>}

              <div className="project-list" style={{ marginBottom: "20px" }}>
                {documentsLoading ? (
                  <p className="project-message">Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p className="project-message">No documents in this project yet. Create your first note below.</p>
                ) : documents.map((item) => (
                  <article className="project-item" key={item.id}>
                    <div className="project-details">
                      <h4>{item.title}</h4>
                      <p>{(item.content || "No content yet.").slice(0, 160)}{(item.content || "").length > 160 ? "…" : ""}</p>
                      <span className="project-workspace">
                        Updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : "recently"}
                      </span>
                    </div>
                    <div className="project-actions">
                      <button type="button" className="edit-project-button" onClick={() => openDocument(item)}>
                        ✏️ Open
                      </button>
                      <button
                        type="button"
                        className="delete-project-button"
                        disabled={deletingDocumentId === item.id}
                        onClick={() => handleDeleteDocument(item)}
                      >
                        {deletingDocumentId === item.id ? "Deleting..." : "🗑️ Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <form onSubmit={handleSaveDocument}>
                <h4>{selectedDocument ? "Edit document" : "Create a document"}</h4>
                <label htmlFor="document-title">Title</label>
                <input
                  id="document-title"
                  value={documentTitle}
                  onChange={(event) => setDocumentTitle(event.target.value)}
                  placeholder="e.g. Project meeting notes"
                  maxLength={200}
                  required
                />
                <label htmlFor="document-content" style={{ marginTop: "12px", display: "block" }}>Content</label>
                <textarea
                  id="document-content"
                  value={documentContent}
                  onChange={(event) => setDocumentContent(event.target.value)}
                  placeholder="Write your project notes here..."
                  rows={8}
                  style={{ width: "100%", resize: "vertical", marginTop: "8px" }}
                />
                <div className="modal-actions" style={{ marginTop: "12px" }}>
                  {selectedDocument && (
                    <button type="button" className="cancel-button" onClick={startNewDocument}>
                      New note instead
                    </button>
                  )}
                  <button type="submit" className="primary-button" disabled={documentSaving || documentsLoading}>
                    {documentSaving ? "Saving..." : selectedDocument ? "Save changes" : "Create document"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        <section className="content-card" id="whiteboards-section" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h3>Real-Time Collaborative Whiteboards</h3>
              <p>Visual brainstorm boards synchronized live across your engineering team.</p>
            </div>
          </div>

          {!selectedWorkspaceId ? (
            <div className="empty-state">
              <h4>Select a workspace</h4>
              <p>Choose a workspace before opening its whiteboards.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <h4>Create a project first</h4>
              <p>Whiteboards belong to a project. Create a project to start drawing.</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <label htmlFor="whiteboard-project-select" style={{ fontWeight: "600", fontSize: "14px" }}>
                  Project:
                </label>
                <select
                  id="whiteboard-project-select"
                  value={selectedWhiteboardProjectId}
                  onChange={(e) => setSelectedWhiteboardProjectId(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWhiteboardProjectId && (
                <WhiteboardManager projectId={selectedWhiteboardProjectId} />
              )}
            </div>
          )}
        </section>

        <section className="content-card" id="tasks-section" style={{ marginBottom: "24px" }}>
          <div className="card-heading">
            <div>
              <h3>Tasks</h3>
              <p>{selectedWorkspace ? `Tasks in ${selectedWorkspace.name}` : "Select a workspace first"}</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={openCreateTaskForm}
              disabled={!selectedWorkspaceId || filteredProjects.length === 0}
            >
              + New task
            </button>
          </div>

          {taskError && !showTaskForm && <p className="project-error">{taskError}</p>}

          {loading ? (
            <p className="project-message">Loading tasks...</p>
          ) : !selectedWorkspaceId ? (
            <div className="empty-state">
              <h4>Select a workspace</h4>
              <p>Choose a workspace to view its tasks.</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <h4>Create a project first</h4>
              <p>Tasks are organized under projects, so create a project before adding tasks.</p>
              <button type="button" className="primary-button" onClick={openCreateProjectForm}>
                + Create project
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h4>No tasks yet</h4>
              <p>Create your first task for a project in this workspace.</p>
              <button type="button" className="primary-button" onClick={openCreateTaskForm}>
                + Create task
              </button>
            </div>
          ) : (
            <div className="project-list">
              {filteredTasks.map((task) => {
                const taskProject = filteredProjects.find((project) => project.id === task.project);
                return (
                  <article className="project-item" key={task.id}>
                    <div className="project-details">
                      <h4>{task.title}</h4>
                      <p>{task.description || "No description added."}</p>
                      <span className="project-workspace">
                        {taskProject?.name || `Project #${task.project}`}
                        {task.due_date ? ` · Due ${task.due_date}` : ""}
                        {task.assigned_to_username ? ` · Assigned to ${task.assigned_to_username}` : " · Unassigned"}
                      </span>
                    </div>
                    <div className="project-actions">
                      <span className={`project-status status-${(task.status || "TODO").toLowerCase()}`}>
                        {(task.status || "TODO").replace("_", " ")}
                      </span>
                      <span className={`project-status status-${(task.priority || "MEDIUM").toLowerCase()}`}>
                        {task.priority || "MEDIUM"} priority
                      </span>
                      <button type="button" className="edit-project-button" onClick={() => openEditTaskForm(task)}>
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="delete-project-button"
                        onClick={() => handleDeleteTask(task)}
                        disabled={deletingTaskId === task.id}
                      >
                        {deletingTaskId === task.id ? "Deleting..." : "🗑️ Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="bottom-grid">
          <article className="content-card">
            <div className="card-heading">
              <div>
                <h3>Recent projects</h3>

                <p>
                  {selectedWorkspace
                    ? selectedWorkspace.name
                    : "No workspace selected"}
                </p>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={loadData}
                disabled={loading}
              >
                Refresh ↻
              </button>
            </div>

            {loading ? (
              <p className="project-message">
                Loading projects...
              </p>
            ) : !selectedWorkspaceId ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h4>Select a workspace</h4>
                <p>
                  Select an existing workspace or create a new one.
                </p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h4>No projects in this workspace yet</h4>
                <p>
                  Create your first project to get started.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={openCreateProjectForm}
                >
                  + Create project
                </button>
              </div>
            ) : (
              <div className="project-list">
                {filteredProjects.map((project) => (
                  <article
                    className="project-item"
                    key={project.id}
                  >
                    <div className="project-details">
                      <h4>{project.name}</h4>

                      <p>
                        {project.description ||
                          "No description added."}
                      </p>

                      <span className="project-workspace">
                        {project.workspace_name ||
                          `Workspace #${project.workspace}`}
                      </span>
                    </div>

                    <div className="project-actions">
                      <span
                        className={`project-status status-${(
                          project.status || "ACTIVE"
                        ).toLowerCase()}`}
                      >
                        {(project.status || "ACTIVE").replace(
                          "_",
                          " "
                        )}
                      </span>

                      <button
                        type="button"
                        className="edit-project-button"
                        onClick={() => handleEditProject(project)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="delete-project-button"
                        onClick={() => handleDeleteProject(project)}
                        disabled={deletingProjectId === project.id}
                      >
                        {deletingProjectId === project.id
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="content-card">
            <div className="card-heading">
              <h3>Quick access</h3>
            </div>

            <div className="quick-link">
              📝 <span>Team documents</span> →
            </div>

            <div className="quick-link">
              ✅ <span>My tasks</span> →
            </div>

            <div className="quick-link">
              📅 <span>Meetings</span> →
            </div>

            <div className="quick-link" role="button" tabIndex={0} onClick={() => document.getElementById("members-section")?.scrollIntoView({ behavior: "smooth" })}>
              👥 <span>Team members</span> →
            </div>
          </article>
        </section>
      </main>

      {/* Create workspace modal */}
      {showWorkspaceForm && (
        <div className="modal-overlay">
          <form
            className="project-modal"
            onSubmit={handleCreateWorkspace}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">WORKSPACE SETTINGS</p>
                <h2>Create a workspace</h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowWorkspaceForm(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <label htmlFor="workspace-name">
              Workspace name
            </label>

            <input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) =>
                setWorkspaceName(event.target.value)
              }
              placeholder="e.g. AI Development Team"
              maxLength={150}
              required
              autoFocus
            />

            {workspaceError && (
              <p className="project-error">{workspaceError}</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowWorkspaceForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={creatingWorkspace}
              >
                {creatingWorkspace
                  ? "Creating..."
                  : "Create workspace"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create/edit task modal */}
      {showTaskForm && (
        <div className="modal-overlay">
          <form className="project-modal" onSubmit={handleSubmitTask}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{editingTask ? "EDIT TASK" : "YOUR WORKSPACE"}</p>
                <h2>{editingTask ? "Edit task" : "Create a task"}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => { setShowTaskForm(false); setEditingTask(null); setTaskError(""); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <label htmlFor="task-title">Task title</label>
            <input
              id="task-title"
              value={taskForm.title}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="e.g. Build login API"
              maxLength={200}
              required
              autoFocus
            />

            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={taskForm.description}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, description: event.target.value }))}
              placeholder="Describe what needs to be done"
              rows={3}
            />

            <label htmlFor="task-project">Project</label>
            <select
              id="task-project"
              value={taskForm.project}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, project: event.target.value }))}
              required
            >
              <option value="">Select a project</option>
              {filteredProjects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <label htmlFor="task-status">Status</label>
            <select
              id="task-status"
              value={taskForm.status}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, status: event.target.value }))}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>

            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={taskForm.priority}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, priority: event.target.value }))}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>

            <label htmlFor="task-due-date">Due date (optional)</label>
            <input
              id="task-due-date"
              type="date"
              value={taskForm.due_date}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, due_date: event.target.value }))}
            />

            <label htmlFor="task-assignee">Assign to (optional)</label>
            <select
              id="task-assignee"
              value={taskForm.assigned_to}
              onChange={(event) => setTaskForm((previous) => ({ ...previous, assigned_to: event.target.value }))}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user} value={member.user}>
                  {member.username} ({member.role})
                </option>
              ))}
            </select>

            {taskError && <p className="project-error">{taskError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => { setShowTaskForm(false); setEditingTask(null); setTaskError(""); }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={taskSaving || filteredProjects.length === 0}>
                {taskSaving ? "Saving..." : editingTask ? "Save changes" : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reusable create/edit project modal */}
      {showForm && (
        <div className="modal-overlay">
          <form
            className="project-modal"
            onSubmit={handleSubmitProject}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {editingProject ? "EDIT PROJECT" : "YOUR WORKSPACE"}
                </p>

                <h2>
                  {editingProject
                    ? "Edit project"
                    : "Create a project"}
                </h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeProjectForm}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <label htmlFor="project-name">
              Project name
            </label>

            <input
              id="project-name"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Website redesign"
              maxLength={150}
              required
            />

            <label htmlFor="project-description">
              Description
            </label>

            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="What will your team build?"
              rows={3}
            />

            <label htmlFor="project-workspace">
              Workspace
            </label>

            <select
              id="project-workspace"
              value={form.workspace}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  workspace: event.target.value,
                }))
              }
              required
            >
              <option value="">Select a workspace</option>

              {workspaces.map((workspace) => (
                <option
                  key={workspace.id}
                  value={workspace.id}
                >
                  {workspace.name}
                </option>
              ))}
            </select>

            <label htmlFor="project-status">
              Status
            </label>

            <select
              id="project-status"
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {error && (
              <p className="project-error">{error}</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={closeProjectForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving || workspaces.length === 0}
              >
                {saving
                  ? "Saving..."
                  : editingProject
                    ? "Save changes"
                    : "Create project"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Dashboard;