const STATE_STORAGE_KEYS = [
  "internal-sales-workspace-state-v4",
  "internal-sales-organiser-state-v3",
  "internal-sales-organiser-state-v2",
  "work-organiser-state-v1",
];
const STATE_STORAGE_KEY = STATE_STORAGE_KEYS[0];
const STATUS_ORDER = ["Open", "Waiting", "Closed"];
const ACTIVITY_TYPES = [
  "Follow-up",
  "Quotation",
  "New Enquiry",
  "Order Processing",
  "Payment Chase",
  "Meeting",
];
const STAGES = [
  "New Lead",
  "Quoted",
  "Negotiation",
  "Awaiting PO",
  "Won",
  "Lost",
];
const PRIORITIES = ["High", "Medium", "Low"];
const TEXT_FILE_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "html",
  "htm",
  "xml",
  "js",
  "ts",
  "css",
  "log",
  "eml",
  "rtf",
  "yml",
  "yaml",
]);
const MAX_DOCUMENT_CHARACTERS = 120000;
const MAX_DOCUMENT_COUNT = 20;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "this",
  "your",
  "you",
  "our",
  "their",
  "them",
  "have",
  "had",
  "can",
  "not",
  "but",
  "all",
  "any",
  "about",
  "into",
  "when",
  "what",
  "which",
  "please",
  "share",
  "thank",
  "regards",
]);

const defaultState = {
  tasks: [
    {
      id: "sample-1",
      title: "Send revised quotation",
      project: "Generator panel upgrade",
      account: "Bluewave Technical",
      contact: "Aisha Rahman",
      activityType: "Quotation",
      stage: "Quoted",
      priority: "High",
      dueDate: todayString(),
      lastContactDate: todayMinusDaysString(1),
      value: 14500,
      status: "Open",
      nextAction: "Send revised quotation and ask for approval",
      details: "Customer asked for delivery timeline and bulk price break for 3 units.",
      focus: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "sample-2",
      title: "Check PO status",
      project: "Cooling tower spares",
      account: "Northline Industries",
      contact: "Khaled Omar",
      activityType: "Follow-up",
      stage: "Awaiting PO",
      priority: "Medium",
      dueDate: todayPlusDaysString(1),
      lastContactDate: todayString(),
      value: 8200,
      status: "Waiting",
      nextAction: "Call customer and confirm finance approval",
      details: "Customer said finance approval should be ready tomorrow afternoon.",
      focus: false,
      createdAt: new Date().toISOString(),
    },
  ],
  notes: "Start with overdue work first. After every call, update the project name, next action, and promised date.",
  documents: [],
};

const state = loadState();

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const notes = document.getElementById("notes");
const todayDate = document.getElementById("todayDate");
const todaySummary = document.getElementById("todaySummary");
const statusFilter = document.getElementById("statusFilter");
const stageFilter = document.getElementById("stageFilter");
const priorityFilter = document.getElementById("priorityFilter");
const searchFilter = document.getElementById("searchFilter");
const nextStepReason = document.getElementById("nextStepReason");
const nextStepEmpty = document.getElementById("nextStepEmpty");
const nextStepContent = document.getElementById("nextStepContent");
const nextStepProject = document.getElementById("nextStepProject");
const nextStepTitle = document.getElementById("nextStepTitle");
const nextStepAccount = document.getElementById("nextStepAccount");
const nextStepAction = document.getElementById("nextStepAction");
const nextStepDue = document.getElementById("nextStepDue");
const emailDraft = document.getElementById("emailDraft");
const callDraft = document.getElementById("callDraft");
const copyTopEmail = document.getElementById("copyTopEmail");
const copyTopCall = document.getElementById("copyTopCall");
const documentUpload = document.getElementById("documentUpload");
const documentQuery = document.getElementById("documentQuery");
const documentSummary = document.getElementById("documentSummary");
const documentStorageNote = document.getElementById("documentStorageNote");
const documentList = document.getElementById("documentList");

const statElements = {
  open: document.getElementById("openTasks"),
  overdue: document.getElementById("overdueTasks"),
  quotedValue: document.getElementById("quotedValue"),
  documents: document.getElementById("documentCount"),
};

const taskTemplate = document.getElementById("taskTemplate");
const documentTemplate = document.getElementById("documentTemplate");

initialise();

function initialise() {
  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  notes.value = state.notes;

  taskForm.addEventListener("submit", handleTaskSubmit);
  notes.addEventListener("input", handleNotesChange);
  statusFilter.addEventListener("change", render);
  stageFilter.addEventListener("change", render);
  priorityFilter.addEventListener("change", render);
  searchFilter.addEventListener("input", render);
  documentQuery.addEventListener("input", renderDocuments);
  documentUpload.addEventListener("change", handleDocumentUpload);
  copyTopEmail.addEventListener("click", () => copyText(copyTopEmail, emailDraft.value));
  copyTopCall.addEventListener("click", () => copyText(copyTopCall, callDraft.value));

  render();
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(taskForm);

  const task = normaliseTask({
    id: createItemId("task"),
    title: String(formData.get("title")).trim(),
    project: String(formData.get("project")).trim(),
    account: String(formData.get("account")).trim(),
    contact: String(formData.get("contact")).trim(),
    activityType: String(formData.get("activityType")),
    stage: String(formData.get("stage")),
    priority: String(formData.get("priority")),
    dueDate: String(formData.get("dueDate")),
    lastContactDate: String(formData.get("lastContactDate")),
    value: Number(formData.get("value")) || 0,
    status: String(formData.get("status")),
    nextAction: String(formData.get("nextAction")).trim(),
    details: String(formData.get("details")).trim(),
    focus: formData.get("focus") === "on",
    createdAt: new Date().toISOString(),
  });

  state.tasks.unshift(task);
  persist();
  taskForm.reset();
  document.getElementById("activityType").value = "Follow-up";
  document.getElementById("stage").value = "New Lead";
  document.getElementById("priority").value = "Medium";
  document.getElementById("status").value = "Open";
  render();
}

function handleNotesChange(event) {
  state.notes = event.target.value;
  persist();
}

async function handleDocumentUpload(event) {
  const files = Array.from(event.target.files || []);

  if (files.length === 0) {
    return;
  }

  documentStorageNote.classList.add("hidden");
  documentStorageNote.textContent = "";

  for (const file of files) {
    const documentRecord = await buildDocumentRecord(file);
    state.documents.unshift(documentRecord);
  }

  state.documents = state.documents.slice(0, MAX_DOCUMENT_COUNT);
  documentUpload.value = "";
  persist();
  render();
}

function render() {
  renderSummary();
  renderNextStep();
  renderTasks();
  renderDocuments();
}

function renderSummary() {
  const activeTasks = getActiveTasks();
  const overdueCount = activeTasks.filter((task) => isOverdue(task)).length;
  const dueTodayCount = activeTasks.filter((task) => isDueToday(task.dueDate)).length;
  const openValue = activeTasks.reduce((sum, task) => sum + (Number(task.value) || 0), 0);
  const bestTask = getBestTask();

  statElements.open.textContent = String(activeTasks.length);
  statElements.overdue.textContent = String(overdueCount);
  statElements.quotedValue.textContent = formatCurrency(openValue);
  statElements.documents.textContent = String(state.documents.length);

  if (overdueCount > 0 && bestTask) {
    todaySummary.textContent = `${overdueCount} overdue follow-up${overdueCount === 1 ? "" : "s"}. Start with ${buildShortTaskName(bestTask)}.`;
    return;
  }

  if (dueTodayCount > 0 && bestTask) {
    todaySummary.textContent = `${dueTodayCount} follow-up${dueTodayCount === 1 ? "" : "s"} due today. Start with ${buildShortTaskName(bestTask)}.`;
    return;
  }

  if (bestTask) {
    todaySummary.textContent = `Next clear step: ${bestTask.nextAction || bestTask.title}.`;
    return;
  }

  todaySummary.textContent = "Pipeline is clear. Add a new enquiry, quotation, or follow-up.";
}

function renderNextStep() {
  const bestTask = getBestTask();

  if (!bestTask) {
    nextStepEmpty.classList.remove("hidden");
    nextStepContent.classList.add("hidden");
    nextStepReason.textContent = "The workspace will choose the clearest next task for you.";
    emailDraft.value = "";
    callDraft.value = "";
    return;
  }

  nextStepEmpty.classList.add("hidden");
  nextStepContent.classList.remove("hidden");

  nextStepReason.textContent = buildNextStepReason(bestTask);
  nextStepProject.textContent = bestTask.project ? `Project: ${bestTask.project}` : "Project: Not added yet";
  nextStepTitle.textContent = bestTask.title;
  nextStepAccount.textContent = buildAccountLine(bestTask);
  nextStepAction.textContent = bestTask.nextAction || "Add a short next action.";
  nextStepDue.textContent = buildDueLabel(bestTask);
  emailDraft.value = buildEmailDraft(bestTask);
  callDraft.value = buildCallScript(bestTask);
}

function renderTasks() {
  const tasks = getFilteredTasks();
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.append(createEmptyState("No tasks match the current filters."));
    return;
  }

  const fragment = document.createDocumentFragment();

  tasks.forEach((task) => {
    const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
    taskNode.classList.toggle("overdue", isOverdue(task));
    taskNode.classList.toggle("closed", !isActiveTask(task));

    const projectLine = taskNode.querySelector(".task-project");
    if (task.project) {
      projectLine.textContent = `Project: ${task.project}`;
      projectLine.classList.remove("hidden");
    }

    taskNode.querySelector(".task-title").textContent = task.title;
    taskNode.querySelector(".task-account").textContent = buildAccountLine(task);
    taskNode.querySelector(".task-next-action").textContent = `Next action: ${task.nextAction || "Add next action"}`;
    taskNode.querySelector(".task-details").textContent = task.details || "No notes added yet.";

    const focusPill = taskNode.querySelector(".focus-pill");
    if (task.focus && isActiveTask(task)) {
      focusPill.classList.remove("hidden");
    }

    const alertPill = taskNode.querySelector(".alert-pill");
    if (isOverdue(task)) {
      alertPill.classList.remove("hidden");
    }

    setPill(taskNode, ".activity-pill", task.activityType, "#8c5f14");
    setPill(taskNode, ".stage-pill", task.stage, "#28425d");
    setPill(taskNode, ".priority-pill", `${task.priority} priority`, getPriorityColor(task.priority));
    setPill(taskNode, ".status-pill", task.status, getStatusColor(task.status));
    setPill(taskNode, ".due-pill", buildDueLabel(task), getDueColor(task));
    setPill(taskNode, ".contact-pill", buildLastContactLabel(task.lastContactDate), "#5e7081");
    setPill(taskNode, ".value-pill", formatCurrency(Number(task.value) || 0), "#28735d");

    taskNode.querySelector(".toggle-status").addEventListener("click", () => advanceTaskStatus(task.id));
    taskNode.querySelector(".toggle-focus").addEventListener("click", () => toggleTaskFocus(task.id));
    taskNode.querySelector(".copy-email").addEventListener("click", (event) => {
      copyText(event.currentTarget, buildEmailDraft(task));
    });
    taskNode.querySelector(".copy-call").addEventListener("click", (event) => {
      copyText(event.currentTarget, buildCallScript(task));
    });
    taskNode.querySelector(".delete-task").addEventListener("click", () => deleteTask(task.id));

    fragment.append(taskNode);
  });

  taskList.append(fragment);
}

function renderDocuments() {
  const documents = getFilteredDocuments();
  const query = documentQuery.value.trim();

  documentList.innerHTML = "";
  documentSummary.textContent = buildDocumentSummaryLine(documents.length, state.documents.length, query);

  if (state.storageMessage) {
    documentStorageNote.textContent = state.storageMessage;
    documentStorageNote.classList.remove("hidden");
  } else {
    documentStorageNote.textContent = "";
    documentStorageNote.classList.add("hidden");
  }

  if (documents.length === 0) {
    const message = state.documents.length === 0
      ? "No uploaded files yet. Add a text file to search inside it."
      : "No uploaded files match this search.";
    documentList.append(createEmptyState(message));
    return;
  }

  const fragment = document.createDocumentFragment();

  documents.forEach((documentRecord) => {
    const documentNode = documentTemplate.content.firstElementChild.cloneNode(true);
    documentNode.querySelector(".document-name").textContent = documentRecord.name;
    documentNode.querySelector(".document-meta").textContent = buildDocumentMetaLine(documentRecord);
    documentNode.querySelector(".document-preview").textContent = documentRecord.summary;
    documentNode.querySelector(".document-keywords").textContent = buildKeywordLine(documentRecord.keywords);

    const statusNode = documentNode.querySelector(".document-status");
    statusNode.textContent = buildDocumentStatus(documentRecord);
    statusNode.classList.add(getDocumentStatusClass(documentRecord));

    const snippetNode = documentNode.querySelector(".document-snippet");
    const snippet = buildDocumentSnippet(documentRecord, query);
    if (snippet) {
      snippetNode.textContent = snippet;
      snippetNode.classList.remove("hidden");
    }

    documentNode.querySelector(".copy-document").addEventListener("click", (event) => {
      copyText(event.currentTarget, buildDocumentCopyText(documentRecord, query));
    });
    documentNode.querySelector(".delete-document").addEventListener("click", () => deleteDocument(documentRecord.id));

    fragment.append(documentNode);
  });

  documentList.append(fragment);
}

function getFilteredTasks() {
  const query = searchFilter.value.trim().toLowerCase();

  return state.tasks
    .filter((task) => {
      const matchesStatus = statusFilter.value === "All" || task.status === statusFilter.value;
      const matchesStage = stageFilter.value === "All" || task.stage === stageFilter.value;
      const matchesPriority = priorityFilter.value === "All" || task.priority === priorityFilter.value;
      const matchesQuery =
        query === "" ||
        [
          task.title,
          task.project,
          task.account,
          task.contact,
          task.nextAction,
          task.details,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesStage && matchesPriority && matchesQuery;
    })
    .sort(compareTasks);
}

function getFilteredDocuments() {
  const query = documentQuery.value.trim().toLowerCase();

  return state.documents
    .filter((documentRecord) => {
      if (query === "") {
        return true;
      }

      return [
        documentRecord.name,
        documentRecord.summary,
        documentRecord.text,
        documentRecord.keywords.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(compareDocuments);
}

function getActiveTasks() {
  return state.tasks.filter(isActiveTask).sort(compareTasks);
}

function getBestTask() {
  const activeTasks = getActiveTasks();
  return activeTasks.length > 0 ? activeTasks[0] : null;
}

function advanceTaskStatus(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task) {
    return;
  }

  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const nextIndex = currentIndex === STATUS_ORDER.length - 1 ? 0 : currentIndex + 1;
  task.status = STATUS_ORDER[nextIndex];

  if (task.status === "Closed") {
    task.focus = false;
  }

  persist();
  render();
}

function toggleTaskFocus(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);

  if (!task || !isActiveTask(task)) {
    return;
  }

  task.focus = !task.focus;
  persist();
  render();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  persist();
  render();
}

function deleteDocument(documentId) {
  state.documents = state.documents.filter((documentRecord) => documentRecord.id !== documentId);
  persist();
  renderDocuments();
  renderSummary();
}

function loadState() {
  for (const key of STATE_STORAGE_KEYS) {
    try {
      const rawState = localStorage.getItem(key);
      if (rawState) {
        return normaliseState(JSON.parse(rawState));
      }
    } catch {
      continue;
    }
  }

  return normaliseState(defaultState);
}

function normaliseState(rawState) {
  const tasks = Array.isArray(rawState.tasks) && rawState.tasks.length > 0
    ? rawState.tasks.map(normaliseTask)
    : cloneValue(defaultState.tasks).map(normaliseTask);
  const documents = Array.isArray(rawState.documents)
    ? rawState.documents.map(normaliseDocument)
    : [];

  return {
    tasks,
    notes: typeof rawState.notes === "string" ? rawState.notes : defaultState.notes,
    documents,
    storageMessage: "",
  };
}

function normaliseTask(rawTask) {
  const task = {
    id: cleanString(rawTask.id) || createItemId("task"),
    title: cleanString(rawTask.title),
    project: cleanString(rawTask.project),
    account: cleanString(rawTask.account),
    contact: cleanString(rawTask.contact),
    activityType: ACTIVITY_TYPES.includes(rawTask.activityType) ? rawTask.activityType : "Follow-up",
    stage: STAGES.includes(rawTask.stage) ? rawTask.stage : "New Lead",
    priority: PRIORITIES.includes(rawTask.priority) ? rawTask.priority : "Medium",
    dueDate: cleanDate(rawTask.dueDate),
    lastContactDate: cleanDate(rawTask.lastContactDate),
    value: Number(rawTask.value) > 0 ? Number(rawTask.value) : 0,
    status: normaliseStatus(rawTask.status),
    nextAction: cleanString(rawTask.nextAction),
    details: cleanString(rawTask.details),
    focus: Boolean(rawTask.focus),
    createdAt: cleanString(rawTask.createdAt) || new Date().toISOString(),
  };

  if ((task.stage === "Won" || task.stage === "Lost") && task.status === "Open") {
    task.status = "Closed";
  }

  if (!isActiveTask(task)) {
    task.focus = false;
  }

  if (!task.title) {
    task.title = buildAutoTitle(task);
  }

  if (!task.nextAction) {
    task.nextAction = buildDefaultNextAction(task);
  }

  return task;
}

function normaliseDocument(rawDocument) {
  return {
    id: cleanString(rawDocument.id) || createItemId("document"),
    name: cleanString(rawDocument.name) || "Unnamed file",
    type: cleanString(rawDocument.type),
    extension: cleanString(rawDocument.extension),
    size: Number(rawDocument.size) > 0 ? Number(rawDocument.size) : 0,
    uploadedAt: cleanString(rawDocument.uploadedAt) || new Date().toISOString(),
    readable: Boolean(rawDocument.readable),
    partial: Boolean(rawDocument.partial),
    text: cleanString(rawDocument.text),
    summary: cleanString(rawDocument.summary),
    keywords: Array.isArray(rawDocument.keywords) ? rawDocument.keywords.map(cleanString).filter(Boolean) : [],
  };
}

function persist() {
  const snapshot = {
    tasks: state.tasks,
    notes: state.notes,
    documents: state.documents.slice(0, MAX_DOCUMENT_COUNT),
  };

  state.storageMessage = "";

  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    const trimmedDocuments = [...snapshot.documents];

    while (trimmedDocuments.length > 0) {
      trimmedDocuments.pop();

      try {
        state.documents = trimmedDocuments;
        localStorage.setItem(
          STATE_STORAGE_KEY,
          JSON.stringify({
            tasks: state.tasks,
            notes: state.notes,
            documents: trimmedDocuments,
          })
        );
        state.storageMessage = "Browser storage was full, so the oldest uploaded files were removed.";
        return;
      } catch {
        continue;
      }
    }

    state.storageMessage = "Browser storage is full. New files were not saved.";
  }
}

async function buildDocumentRecord(file) {
  const extension = getFileExtension(file.name);
  const readable = isReadableTextFile(file, extension);
  const baseRecord = {
    id: createItemId("document"),
    name: file.name,
    type: file.type || "",
    extension,
    size: file.size || 0,
    uploadedAt: new Date().toISOString(),
    readable,
    partial: false,
    text: "",
    summary: "",
    keywords: [],
  };

  if (!readable) {
    return {
      ...baseRecord,
      summary: "File stored by name only. To read inside PDF, DOCX, image, or spreadsheet files, this browser version needs a parser or AI backend.",
    };
  }

  try {
    const rawText = await readFileAsText(file);
    const cleanedText = cleanDocumentText(rawText);
    const partial = cleanedText.length > MAX_DOCUMENT_CHARACTERS;
    const text = cleanedText.slice(0, MAX_DOCUMENT_CHARACTERS);

    return {
      ...baseRecord,
      partial,
      text,
      summary: buildDocumentPreview(text, partial),
      keywords: extractKeywords(text),
    };
  } catch {
    return {
      ...baseRecord,
      readable: false,
      summary: "This file could not be read in the browser. Try a plain text version or add backend processing later.",
    };
  }
}

function buildAccountLine(task) {
  const company = task.account || "No company added";
  return task.contact ? `${company} | ${task.contact}` : company;
}

function buildShortTaskName(task) {
  return task.account || task.project || task.title;
}

function buildAutoTitle(task) {
  const subject = task.account || task.project || task.contact || "customer";

  switch (task.activityType) {
    case "Quotation":
      return `Send quotation to ${subject}`;
    case "New Enquiry":
      return `Reply to ${subject} enquiry`;
    case "Order Processing":
      return `Process order for ${subject}`;
    case "Payment Chase":
      return `Follow up payment with ${subject}`;
    case "Meeting":
      return `Follow up after meeting with ${subject}`;
    default:
      return `Follow up with ${subject}`;
  }
}

function buildDefaultNextAction(task) {
  switch (task.activityType) {
    case "Quotation":
      return "Send quotation and ask for feedback";
    case "New Enquiry":
      return "Reply to enquiry and share details";
    case "Order Processing":
      return "Check order status and update customer";
    case "Payment Chase":
      return "Ask for payment update";
    case "Meeting":
      return "Send follow-up after meeting";
    default:
      return "Call customer and ask for update";
  }
}

function buildDueLabel(task) {
  if (!task.dueDate) {
    return "No follow-up date";
  }

  if (isOverdue(task)) {
    return `Overdue since ${formatDate(task.dueDate)}`;
  }

  if (isDueToday(task.dueDate)) {
    return "Follow-up today";
  }

  return `Follow-up ${formatDate(task.dueDate)}`;
}

function buildLastContactLabel(rawDate) {
  return rawDate ? `Last contact ${formatDate(rawDate)}` : "No last contact date";
}

function buildNextStepReason(task) {
  if (isOverdue(task)) {
    return "This task is overdue, so do this first.";
  }

  if (task.focus) {
    return "You marked this as top priority, so it stays first.";
  }

  if (isDueToday(task.dueDate)) {
    return "This task is due today.";
  }

  return "This is the clearest next step in your active pipeline.";
}

function buildEmailDraft(task) {
  const greeting = task.contact ? `Dear ${task.contact},` : "Hello,";
  const subjectTarget = task.project || task.account || task.title;
  const projectLine = task.project ? ` for ${task.project}` : "";
  const updateLine = task.dueDate
    ? `I would appreciate your update by ${formatDate(task.dueDate)}.`
    : "Please share your update when convenient.";

  return [
    `Subject: ${buildEmailSubject(task, subjectTarget)}`,
    "",
    greeting,
    "",
    "I hope you are well.",
    "",
    `${buildEmailReason(task)}${projectLine}.`,
    `My next step is: ${task.nextAction}.`,
    updateLine,
    "",
    "Please let me know if you need any further information.",
    "",
    "Best regards,",
    "[Your Name]",
  ].join("\n");
}

function buildCallScript(task) {
  const introName = task.contact || "there";
  const projectLine = task.project ? ` for project ${task.project}` : "";

  return [
    `Hello ${introName}, this is [Your Name] from [Your Company].`,
    "",
    `I am calling about ${task.account || "the current requirement"}${projectLine}.`,
    `${buildCallReason(task)}`,
    `My next step is: ${task.nextAction}.`,
    "Could you please share the latest update?",
    "",
    "Thank you.",
  ].join("\n");
}

function buildEmailSubject(task, subjectTarget) {
  switch (task.activityType) {
    case "Quotation":
      return `Quotation follow-up - ${subjectTarget}`;
    case "New Enquiry":
      return `Enquiry follow-up - ${subjectTarget}`;
    case "Order Processing":
      return `Order update - ${subjectTarget}`;
    case "Payment Chase":
      return `Payment follow-up - ${subjectTarget}`;
    case "Meeting":
      return `Follow-up after meeting - ${subjectTarget}`;
    default:
      return `Follow-up - ${subjectTarget}`;
  }
}

function buildEmailReason(task) {
  switch (task.activityType) {
    case "Quotation":
      return "I am writing to follow up on the quotation shared";
    case "New Enquiry":
      return "I am writing to follow up on your enquiry";
    case "Order Processing":
      return "I am writing to check the order status";
    case "Payment Chase":
      return "I am following up regarding the payment update";
    case "Meeting":
      return "I am writing to follow up after our meeting";
    default:
      return "I am writing to follow up on our previous discussion";
  }
}

function buildCallReason(task) {
  switch (task.activityType) {
    case "Quotation":
      return "I want to check whether the quotation is approved or if any change is needed.";
    case "New Enquiry":
      return "I want to confirm the requirement and the next step.";
    case "Order Processing":
      return "I want to confirm the order status and any pending point.";
    case "Payment Chase":
      return "I want to check the payment status.";
    case "Meeting":
      return "I want to follow up on the discussion from our meeting.";
    default:
      return "I want to check the current update from your side.";
  }
}

function buildDocumentPreview(text, partial) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((line) => shortenText(line, 140));
  let preview = lines.join(" ");

  if (!preview) {
    preview = "Readable file added, but there was very little visible text.";
  }

  if (partial) {
    preview += " Only the first part of this file was stored to keep the browser fast.";
  }

  return preview;
}

function buildDocumentSummaryLine(filteredCount, totalCount, query) {
  if (totalCount === 0) {
    return "No uploaded files yet.";
  }

  if (!query) {
    return `${totalCount} file${totalCount === 1 ? "" : "s"} stored in the browser.`;
  }

  return `${filteredCount} match${filteredCount === 1 ? "" : "es"} found in ${totalCount} file${totalCount === 1 ? "" : "s"}.`;
}

function buildDocumentMetaLine(documentRecord) {
  return `${formatFileSize(documentRecord.size)} | ${formatDateTime(documentRecord.uploadedAt)}`;
}

function buildDocumentStatus(documentRecord) {
  if (!documentRecord.readable) {
    return "Metadata only";
  }

  if (documentRecord.partial) {
    return "Readable (partial)";
  }

  return "Readable";
}

function getDocumentStatusClass(documentRecord) {
  if (!documentRecord.readable) {
    return "metadata";
  }

  return documentRecord.partial ? "partial" : "readable";
}

function buildKeywordLine(keywords) {
  return keywords.length > 0
    ? `Keywords: ${keywords.join(", ")}`
    : "Keywords: not enough text yet";
}

function buildDocumentSnippet(documentRecord, rawQuery) {
  const query = rawQuery.trim().toLowerCase();

  if (!query || !documentRecord.text) {
    return "";
  }

  const haystack = documentRecord.text.toLowerCase();
  const matchIndex = haystack.indexOf(query);

  if (matchIndex === -1) {
    return "";
  }

  const start = Math.max(0, matchIndex - 110);
  const end = Math.min(documentRecord.text.length, matchIndex + query.length + 150);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < documentRecord.text.length ? "..." : "";
  return `${prefix}${documentRecord.text.slice(start, end).trim()}${suffix}`;
}

function buildDocumentCopyText(documentRecord, query) {
  const parts = [
    `File: ${documentRecord.name}`,
    `Status: ${buildDocumentStatus(documentRecord)}`,
    `Summary: ${documentRecord.summary}`,
  ];
  const snippet = buildDocumentSnippet(documentRecord, query);

  if (snippet) {
    parts.push(`Match: ${snippet}`);
  }

  return parts.join("\n");
}

function compareTasks(leftTask, rightTask) {
  const leftScore = getTaskScore(leftTask);
  const rightScore = getTaskScore(rightTask);

  for (let index = 0; index < leftScore.length; index += 1) {
    if (leftScore[index] !== rightScore[index]) {
      return leftScore[index] - rightScore[index];
    }
  }

  return 0;
}

function compareDocuments(leftDocument, rightDocument) {
  return Date.parse(rightDocument.uploadedAt) - Date.parse(leftDocument.uploadedAt);
}

function getTaskScore(task) {
  return [
    isActiveTask(task) ? 0 : 1,
    isOverdue(task) ? 0 : 1,
    task.focus ? 0 : 1,
    isDueToday(task.dueDate) ? 0 : 1,
    getPriorityRank(task.priority),
    getDueTimestamp(task.dueDate),
    -1 * (Number(task.value) || 0),
    -1 * Date.parse(task.createdAt || new Date().toISOString()),
  ];
}

function getPriorityRank(priority) {
  switch (priority) {
    case "High":
      return 0;
    case "Medium":
      return 1;
    default:
      return 2;
  }
}

function getDueTimestamp(rawDate) {
  if (!rawDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(`${rawDate}T00:00:00`).getTime();
}

function setPill(node, selector, text, color) {
  const pill = node.querySelector(selector);
  pill.textContent = text;
  pill.style.color = color;
}

function createEmptyState(message) {
  const element = document.createElement("div");
  element.className = "empty-state";
  element.textContent = message;
  return element;
}

function isActiveTask(task) {
  return task.status !== "Closed";
}

function isDueToday(rawDate) {
  return Boolean(rawDate) && rawDate === todayString();
}

function isOverdue(task) {
  return Boolean(task.dueDate) && task.dueDate < todayString() && isActiveTask(task);
}

function getDueColor(task) {
  if (isOverdue(task)) {
    return "#b34b3b";
  }

  if (isDueToday(task.dueDate)) {
    return "#a36a11";
  }

  return "#5e7081";
}

function getPriorityColor(priority) {
  switch (priority) {
    case "High":
      return "#b34b3b";
    case "Medium":
      return "#a36a11";
    default:
      return "#28735d";
  }
}

function getStatusColor(status) {
  switch (status) {
    case "Waiting":
      return "#8c5f14";
    case "Closed":
      return "#28735d";
    default:
      return "#2b597e";
  }
}

function normaliseStatus(rawStatus) {
  if (STATUS_ORDER.includes(rawStatus)) {
    return rawStatus;
  }

  if (rawStatus === "Done" || rawStatus === "Won" || rawStatus === "Lost") {
    return "Closed";
  }

  if (rawStatus === "In Progress" || rawStatus === "To Do") {
    return "Open";
  }

  return "Open";
}

function isReadableTextFile(file, extension) {
  if (file.type.startsWith("text/")) {
    return true;
  }

  return TEXT_FILE_EXTENSIONS.has(extension);
}

function getFileExtension(filename) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsText(file);
  });
}

function cleanDocumentText(rawText) {
  return rawText
    .replace(/\r/g, "")
    .replace(/\u0000/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractKeywords(text) {
  const frequencyMap = new Map();
  const words = text.toLowerCase().match(/[a-z0-9]{3,}/g) || [];

  words.forEach((word) => {
    if (STOP_WORDS.has(word)) {
      return;
    }

    frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
  });

  return Array.from(frequencyMap.entries())
    .sort((leftWord, rightWord) => rightWord[1] - leftWord[1])
    .slice(0, 6)
    .map(([word]) => word);
}

async function copyText(button, text) {
  if (!text) {
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showCopyFeedback(button, "Copied");
  } catch {
    try {
      fallbackCopyText(text);
      showCopyFeedback(button, "Copied");
    } catch {
      showCopyFeedback(button, "Copy failed");
    }
  }
}

function fallbackCopyText(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

function showCopyFeedback(button, nextLabel) {
  if (!button.dataset.defaultLabel) {
    button.dataset.defaultLabel = button.textContent;
  }

  button.textContent = nextLabel;

  window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel;
  }, 1200);
}

function formatDate(rawDate) {
  if (!rawDate) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${rawDate}T00:00:00`));
}

function formatDateTime(rawDate) {
  if (!rawDate) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(rawDate));
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function shortenText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDate(value) {
  if (typeof value !== "string") {
    return "";
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : "";
}

function createItemId(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayPlusDaysString(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayMinusDaysString(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
