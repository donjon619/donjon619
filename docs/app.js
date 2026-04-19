const STATE_STORAGE_KEYS = [
  "internal-sales-command-center-state-v5",
  "internal-sales-workspace-state-v4",
  "internal-sales-organiser-state-v3",
  "internal-sales-organiser-state-v2",
  "work-organiser-state-v1",
];
const STATE_STORAGE_KEY = STATE_STORAGE_KEYS[0];
const AI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DB_NAME = "internal-sales-workspace-db";
const DB_VERSION = 1;
const BLOB_STORE_NAME = "document-blobs";

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
  "tsv",
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
const SPREADSHEET_EXTENSIONS = new Set(["xls", "xlsx", "xlsm"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp"]);

const MAX_DOCUMENT_CHARACTERS = 140000;
const MAX_DOCUMENT_COUNT = 24;
const MAX_PDF_PAGES = 20;
const MAX_AI_DOCUMENTS = 8;
const MAX_AI_TOTAL_CHARACTERS = 110000;
const MAX_AI_TEXT_DOCUMENT_LENGTH = 28000;
const MAX_AI_BINARY_FILES = 3;
const MAX_AI_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AI_PDF_BYTES = 10 * 1024 * 1024;

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
  ai: {
    model: "gpt-4.1",
    baseUrl: AI_DEFAULT_BASE_URL,
    rememberKey: false,
    apiKey: "",
    lastQuestion: "",
    lastAnswer: "",
    lastSources: [],
    lastAnalysedAt: "",
  },
};

const state = loadState();
const uiState = {
  aiBusy: false,
  aiStatusMessage: "",
  aiStatusTone: "",
};

let sessionApiKey = "";
let databasePromise = null;

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
const todayOpenCount = document.getElementById("todayOpenCount");
const todayOverdueCount = document.getElementById("todayOverdueCount");
const todayFileCount = document.getElementById("todayFileCount");

const aiApiKey = document.getElementById("aiApiKey");
const rememberAiKey = document.getElementById("rememberAiKey");
const aiModel = document.getElementById("aiModel");
const aiBaseUrl = document.getElementById("aiBaseUrl");
const saveAiSettings = document.getElementById("saveAiSettings");
const clearAiSettings = document.getElementById("clearAiSettings");
const aiQuestion = document.getElementById("aiQuestion");
const useSmartPrompt = document.getElementById("useSmartPrompt");
const analyseDocuments = document.getElementById("analyseDocuments");
const aiStatus = document.getElementById("aiStatus");
const aiAnswerCard = document.getElementById("aiAnswerCard");
const aiAnswer = document.getElementById("aiAnswer");
const aiSources = document.getElementById("aiSources");
const copyAiAnswer = document.getElementById("copyAiAnswer");

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
  configureLibraries();

  todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  notes.value = state.notes;
  aiModel.value = state.ai.model;
  aiBaseUrl.value = state.ai.baseUrl;
  rememberAiKey.checked = state.ai.rememberKey;
  aiQuestion.value = state.ai.lastQuestion;

  if (state.ai.rememberKey && state.ai.apiKey) {
    aiApiKey.value = state.ai.apiKey;
  }

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
  saveAiSettings.addEventListener("click", handleAiSettingsSave);
  clearAiSettings.addEventListener("click", handleAiSettingsClear);
  useSmartPrompt.addEventListener("click", handleUseSmartPrompt);
  analyseDocuments.addEventListener("click", handleDocumentAnalysis);
  copyAiAnswer.addEventListener("click", () => copyText(copyAiAnswer, state.ai.lastAnswer));

  render();
  syncStoredDocumentAvailability();
}

function configureLibraries() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
}

async function syncStoredDocumentAvailability() {
  if (!supportsIndexedDb()) {
    return;
  }

  let changed = false;

  await Promise.all(
    state.documents.map(async (documentRecord) => {
      try {
        const blob = await getDocumentBlob(documentRecord.id);
        const blobStored = Boolean(blob);
        if (documentRecord.blobStored !== blobStored) {
          documentRecord.blobStored = blobStored;
          changed = true;
        }
      } catch {
        if (documentRecord.blobStored) {
          documentRecord.blobStored = false;
          changed = true;
        }
      }
    })
  );

  if (changed) {
    persist();
  }

  renderDocuments();
  renderAiPanel();
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
  const incomingFiles = Array.from(event.target.files || []);

  if (incomingFiles.length === 0) {
    return;
  }

  const availableSlots = Math.max(0, MAX_DOCUMENT_COUNT - state.documents.length);
  const files = incomingFiles.slice(0, availableSlots);

  if (availableSlots === 0) {
    state.storageMessage = `This browser workspace keeps up to ${MAX_DOCUMENT_COUNT} files. Delete an old file before adding a new one.`;
    renderDocuments();
    event.target.value = "";
    return;
  }

  state.storageMessage = "";

  for (const file of files) {
    const documentId = createItemId("document");
    const blobStored = await saveDocumentBlob(documentId, file);
    const documentRecord = await buildDocumentRecord(file, documentId, blobStored);
    state.documents.unshift(documentRecord);
  }

  if (incomingFiles.length > files.length) {
    state.storageMessage = `Only ${MAX_DOCUMENT_COUNT} files can be kept in this browser workspace at one time.`;
  }

  const overflowDocuments = state.documents.slice(MAX_DOCUMENT_COUNT);
  state.documents = state.documents.slice(0, MAX_DOCUMENT_COUNT);
  await Promise.all(overflowDocuments.map((documentRecord) => deleteDocumentBlob(documentRecord.id)));

  event.target.value = "";
  persist();
  render();
}

function handleAiSettingsSave() {
  const typedKey = aiApiKey.value.trim();
  const effectiveKey = typedKey || getConfiguredApiKey();

  state.ai.model = aiModel.value;
  state.ai.baseUrl = normaliseBaseUrl(aiBaseUrl.value);
  state.ai.rememberKey = rememberAiKey.checked;

  if (state.ai.rememberKey) {
    state.ai.apiKey = effectiveKey;
    sessionApiKey = "";
    aiApiKey.value = state.ai.apiKey;
  } else {
    sessionApiKey = effectiveKey;
    state.ai.apiKey = "";
  }

  persist();
  setAiUiStatus(
    effectiveKey
      ? "AI settings saved. You can ask AI about the uploaded files now."
      : "Model and base URL saved. Add your OpenAI key when you want live AI reading.",
    effectiveKey ? "success" : ""
  );
  renderAiPanel();
}

function handleAiSettingsClear() {
  sessionApiKey = "";
  state.ai.apiKey = "";
  state.ai.rememberKey = false;
  rememberAiKey.checked = false;
  aiApiKey.value = "";
  persist();
  setAiUiStatus("Stored API key removed from this browser workspace.", "success");
  renderAiPanel();
}

function handleUseSmartPrompt() {
  aiQuestion.value = buildDefaultAiQuestion();
}

async function handleDocumentAnalysis() {
  const documents = getDocumentsForAi();

  if (documents.length === 0) {
    setAiUiStatus("Upload at least one file first. Text, PDF, DOCX, XLSX, CSV, and images work best.", "error");
    renderAiPanel();
    return;
  }

  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    setAiUiStatus("Add your OpenAI key first, then click Analyse files.", "error");
    renderAiPanel();
    return;
  }

  const question = aiQuestion.value.trim() || buildDefaultAiQuestion();

  uiState.aiBusy = true;
  setAiUiStatus("Preparing your files for AI reading...", "working");
  renderAiPanel();

  try {
    const request = await buildAiRequest(question, documents);

    if (request.usedDocuments.length === 0) {
      throw new Error("None of the current files were ready for AI. Re-upload older PDF or image files if needed.");
    }

    setAiUiStatus(
      `Reading ${request.usedDocuments.length} file${request.usedDocuments.length === 1 ? "" : "s"} with ${state.ai.model}...`,
      "working"
    );
    renderAiPanel();

    const response = await callResponsesApi(apiKey, request.payload);
    const answer = extractResponseText(response);

    if (!answer) {
      throw new Error("The AI response was empty. Try a shorter question or fewer large files.");
    }

    const analysedAt = new Date().toISOString();
    state.ai.lastQuestion = question;
    state.ai.lastAnswer = answer.trim();
    state.ai.lastSources = request.usedDocuments;
    state.ai.lastAnalysedAt = analysedAt;

    if (request.usedDocumentIds.length === 1) {
      const targetId = request.usedDocumentIds[0];
      const documentRecord = state.documents.find((item) => item.id === targetId);
      if (documentRecord) {
        documentRecord.aiSummary = shortenText(answer.replace(/\s+/g, " ").trim(), 280);
      }
    }

    state.documents.forEach((documentRecord) => {
      if (request.usedDocumentIds.includes(documentRecord.id)) {
        documentRecord.lastAiAt = analysedAt;
      }
    });

    persist();
    setAiUiStatus("AI analysis finished. Review the answer and copy anything you want to use.", "success");
    render();
  } catch (error) {
    setAiUiStatus(normaliseAiError(error), "error");
    renderAiPanel();
  } finally {
    uiState.aiBusy = false;
    renderAiPanel();
  }
}

function render() {
  renderSummary();
  renderNextStep();
  renderTasks();
  renderDocuments();
  renderAiPanel();
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

  todayOpenCount.textContent = String(activeTasks.length);
  todayOverdueCount.textContent = String(overdueCount);
  todayFileCount.textContent = String(state.documents.length);

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
    taskNode.querySelector(".copy-email").addEventListener("click", (clickEvent) => {
      copyText(clickEvent.currentTarget, buildEmailDraft(task));
    });
    taskNode.querySelector(".copy-call").addEventListener("click", (clickEvent) => {
      copyText(clickEvent.currentTarget, buildCallScript(task));
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
      ? "No uploaded files yet. Add a text file, PDF, DOCX, spreadsheet, or image."
      : "No uploaded files match this search.";
    documentList.append(createEmptyState(message));
    return;
  }

  const fragment = document.createDocumentFragment();

  documents.forEach((documentRecord) => {
    const documentNode = documentTemplate.content.firstElementChild.cloneNode(true);
    documentNode.querySelector(".document-source").textContent = buildDocumentSourceLabel(documentRecord);
    documentNode.querySelector(".document-name").textContent = documentRecord.name;
    documentNode.querySelector(".document-meta").textContent = buildDocumentMetaLine(documentRecord);
    documentNode.querySelector(".document-preview").textContent = documentRecord.summary;
    documentNode.querySelector(".document-keywords").textContent = buildKeywordLine(documentRecord.keywords, documentRecord);

    const aiSummaryNode = documentNode.querySelector(".document-ai-summary");
    if (documentRecord.aiSummary) {
      aiSummaryNode.textContent = `AI note: ${documentRecord.aiSummary}`;
      aiSummaryNode.classList.remove("hidden");
    }

    const statusNode = documentNode.querySelector(".document-status");
    statusNode.textContent = buildDocumentStatus(documentRecord);
    statusNode.classList.add(getDocumentStatusClass(documentRecord));

    const snippetNode = documentNode.querySelector(".document-snippet");
    const snippet = buildDocumentSnippet(documentRecord, query);
    if (snippet) {
      snippetNode.textContent = snippet;
      snippetNode.classList.remove("hidden");
    }

    documentNode.querySelector(".copy-document").addEventListener("click", (clickEvent) => {
      copyText(clickEvent.currentTarget, buildDocumentCopyText(documentRecord, query));
    });
    documentNode.querySelector(".delete-document").addEventListener("click", () => deleteDocument(documentRecord.id));

    fragment.append(documentNode);
  });

  documentList.append(fragment);
}

function renderAiPanel() {
  const hasApiKey = Boolean(getConfiguredApiKey());

  aiStatus.dataset.tone = uiState.aiStatusTone;
  if (uiState.aiBusy) {
    aiStatus.textContent = uiState.aiStatusMessage || "AI is reading your files...";
  } else if (uiState.aiStatusMessage) {
    aiStatus.textContent = uiState.aiStatusMessage;
  } else if (hasApiKey) {
    aiStatus.textContent = `AI is ready with ${state.ai.model}. Upload files and click Analyse files.`;
  } else {
    aiStatus.textContent = "AI is not connected yet. Paste your OpenAI key to turn on live file reading.";
  }

  aiAnswer.textContent = state.ai.lastAnswer || "";

  if (state.ai.lastAnswer) {
    aiAnswerCard.classList.remove("hidden");
  } else {
    aiAnswerCard.classList.add("hidden");
  }

  aiSources.innerHTML = "";
  if (Array.isArray(state.ai.lastSources) && state.ai.lastSources.length > 0) {
    state.ai.lastSources.forEach((sourceName) => {
      const chip = document.createElement("span");
      chip.className = "source-chip";
      chip.textContent = sourceName;
      aiSources.append(chip);
    });
    aiSources.classList.remove("hidden");
  } else {
    aiSources.classList.add("hidden");
  }
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
        documentRecord.aiSummary,
        documentRecord.keywords.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort(compareDocuments);
}

function getDocumentsForAi() {
  return [...state.documents]
    .filter((documentRecord) => isAiReadyDocument(documentRecord))
    .sort(compareDocuments)
    .slice(0, MAX_AI_DOCUMENTS);
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

async function deleteDocument(documentId) {
  state.documents = state.documents.filter((documentRecord) => documentRecord.id !== documentId);
  await deleteDocumentBlob(documentId);
  persist();
  render();
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
    ai: normaliseAiState(rawState.ai),
    storageMessage: "",
  };
}

function normaliseAiState(rawAiState) {
  if (!rawAiState || typeof rawAiState !== "object") {
    return cloneValue(defaultState.ai);
  }

  return {
    model: cleanString(rawAiState.model) || defaultState.ai.model,
    baseUrl: normaliseBaseUrl(rawAiState.baseUrl || defaultState.ai.baseUrl),
    rememberKey: Boolean(rawAiState.rememberKey),
    apiKey: cleanString(rawAiState.apiKey),
    lastQuestion: cleanString(rawAiState.lastQuestion),
    lastAnswer: cleanString(rawAiState.lastAnswer),
    lastSources: Array.isArray(rawAiState.lastSources)
      ? rawAiState.lastSources.map(cleanString).filter(Boolean)
      : [],
    lastAnalysedAt: cleanString(rawAiState.lastAnalysedAt),
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
    extractor: cleanString(rawDocument.extractor) || "Stored file",
    aiSummary: cleanString(rawDocument.aiSummary),
    lastAiAt: cleanString(rawDocument.lastAiAt),
    blobStored: Boolean(rawDocument.blobStored),
  };
}

function persist() {
  const snapshot = {
    tasks: state.tasks,
    notes: state.notes,
    documents: state.documents.slice(0, MAX_DOCUMENT_COUNT),
    ai: {
      ...state.ai,
      apiKey: state.ai.rememberKey ? state.ai.apiKey : "",
    },
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
            ai: snapshot.ai,
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

async function buildDocumentRecord(file, documentId, blobStored) {
  const extension = getFileExtension(file.name);
  const baseRecord = {
    id: documentId,
    name: file.name,
    type: file.type || inferMimeType(extension),
    extension,
    size: file.size || 0,
    uploadedAt: new Date().toISOString(),
    readable: false,
    partial: false,
    text: "",
    summary: "",
    keywords: [],
    extractor: buildDocumentSourceLabel({ extension, type: file.type || "", readable: false }),
    aiSummary: "",
    lastAiAt: "",
    blobStored,
  };

  try {
    if (isReadableTextFile(file, extension)) {
      const rawText = await readFileAsText(file);
      return buildReadableDocument(baseRecord, rawText, "Text");
    }

    if (isPdfExtension(extension)) {
      const rawText = await readPdfText(file);
      return buildReadableDocument(baseRecord, rawText, "PDF");
    }

    if (isDocxExtension(extension)) {
      const rawText = await readDocxText(file);
      return buildReadableDocument(baseRecord, rawText, "DOCX");
    }

    if (isSpreadsheetExtension(extension)) {
      const rawText = await readSpreadsheetText(file);
      return buildReadableDocument(baseRecord, rawText, "Spreadsheet");
    }

    if (isImageFile(file, extension)) {
      return {
        ...baseRecord,
        summary: blobStored
          ? "Image stored for AI vision. Ask AI to extract visible text, labels, numbers, or screenshot details."
          : "Image was added, but this browser could not keep the original file for AI vision. Re-upload it when needed.",
        extractor: "Image",
      };
    }

    return {
      ...baseRecord,
      summary: buildUnsupportedDocumentSummary(extension, blobStored),
      extractor: extension ? extension.toUpperCase() : "Stored file",
    };
  } catch (error) {
    return {
      ...baseRecord,
      summary: buildFailedDocumentSummary(extension, blobStored, error),
      extractor: buildDocumentSourceLabel({ extension, type: file.type || "", readable: false }),
    };
  }
}

function buildReadableDocument(baseRecord, rawText, extractor) {
  const cleanedText = cleanDocumentText(rawText);

  if (!cleanedText) {
    return {
      ...baseRecord,
      extractor,
      summary: `${extractor} file stored, but the browser could not find enough readable text.`,
    };
  }

  const partial = cleanedText.length > MAX_DOCUMENT_CHARACTERS;
  const text = cleanedText.slice(0, MAX_DOCUMENT_CHARACTERS);

  return {
    ...baseRecord,
    readable: true,
    partial,
    text,
    summary: buildDocumentPreview(text, partial),
    keywords: extractKeywords(text),
    extractor,
  };
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
    preview += " Only the first part of this file was kept to keep the browser fast.";
  }

  return preview;
}

function buildDocumentSummaryLine(filteredCount, totalCount, query) {
  const aiReadyCount = state.documents.filter(isAiReadyDocument).length;

  if (totalCount === 0) {
    return "No uploaded files yet.";
  }

  if (!query) {
    return `${totalCount} file${totalCount === 1 ? "" : "s"} in this browser. ${aiReadyCount} ready for AI.`;
  }

  return `${filteredCount} match${filteredCount === 1 ? "" : "es"} found. ${aiReadyCount} file${aiReadyCount === 1 ? "" : "s"} ready for AI.`;
}

function buildDocumentMetaLine(documentRecord) {
  return `${formatFileSize(documentRecord.size)} | ${formatDateTime(documentRecord.uploadedAt)}${documentRecord.lastAiAt ? ` | AI read ${formatDateTime(documentRecord.lastAiAt)}` : ""}`;
}

function buildDocumentSourceLabel(documentRecord) {
  if (documentRecord.extractor) {
    return documentRecord.extractor;
  }

  if (isPdfExtension(documentRecord.extension)) {
    return "PDF";
  }

  if (isDocxExtension(documentRecord.extension)) {
    return "DOCX";
  }

  if (isSpreadsheetExtension(documentRecord.extension)) {
    return "Spreadsheet";
  }

  if (isImageExtension(documentRecord.extension)) {
    return "Image";
  }

  return documentRecord.extension ? documentRecord.extension.toUpperCase() : "Stored file";
}

function buildDocumentStatus(documentRecord) {
  if (documentRecord.readable && documentRecord.blobStored) {
    return documentRecord.partial ? "Ready (partial)" : "Ready";
  }

  if (documentRecord.readable) {
    return documentRecord.partial ? "Text only (partial)" : "Text only";
  }

  if (documentRecord.blobStored) {
    return "Stored for AI";
  }

  return "Needs re-upload";
}

function getDocumentStatusClass(documentRecord) {
  if (documentRecord.readable && documentRecord.blobStored) {
    return documentRecord.partial ? "partial" : "ready";
  }

  if (documentRecord.readable || documentRecord.blobStored) {
    return "waiting";
  }

  return "missing";
}

function buildKeywordLine(keywords, documentRecord) {
  if (keywords.length > 0) {
    return `Keywords: ${keywords.join(", ")}`;
  }

  if (documentRecord.aiSummary) {
    return "Keywords: AI note available";
  }

  return "Keywords: add a search term or ask AI for a summary";
}

function buildDocumentSnippet(documentRecord, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  const haystackText = [documentRecord.text, documentRecord.aiSummary].join(" ");

  if (!query || !haystackText) {
    return "";
  }

  const haystack = haystackText.toLowerCase();
  const matchIndex = haystack.indexOf(query);

  if (matchIndex === -1) {
    return "";
  }

  const start = Math.max(0, matchIndex - 110);
  const end = Math.min(haystackText.length, matchIndex + query.length + 150);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < haystackText.length ? "..." : "";
  return `${prefix}${haystackText.slice(start, end).trim()}${suffix}`;
}

function buildDocumentCopyText(documentRecord, query) {
  const parts = [
    `File: ${documentRecord.name}`,
    `Status: ${buildDocumentStatus(documentRecord)}`,
    `Summary: ${documentRecord.summary}`,
  ];

  if (documentRecord.aiSummary) {
    parts.push(`AI note: ${documentRecord.aiSummary}`);
  }

  const snippet = buildDocumentSnippet(documentRecord, query);

  if (snippet) {
    parts.push(`Match: ${snippet}`);
  }

  return parts.join("\n");
}

function buildDefaultAiQuestion() {
  return "Review these files like an internal sales coordinator. Give me: 1) a short summary 2) important company, contact, or project names 3) dates, deadlines, and follow-up promises 4) commercial details like value, quantity, delivery, or payment terms 5) risks or missing information 6) the best next action in simple English.";
}

async function buildAiRequest(question, documents) {
  const content = [
    {
      type: "input_text",
      text: buildAiInstruction(question, documents),
    },
  ];

  const usedDocuments = [];
  const usedDocumentIds = [];
  let remainingCharacters = MAX_AI_TOTAL_CHARACTERS;
  let binaryFileCount = 0;

  for (const documentRecord of documents) {
    const blob = documentRecord.blobStored ? await getDocumentBlob(documentRecord.id) : null;

    if (isImageExtension(documentRecord.extension) && blob && blob.size <= MAX_AI_IMAGE_BYTES && binaryFileCount < MAX_AI_BINARY_FILES) {
      content.push({
        type: "input_text",
        text: `Image file: ${documentRecord.name}. Extract any visible text, labels, numbers, signatures, or screenshot details before answering.`,
      });
      content.push({
        type: "input_image",
        image_url: await blobToDataUrl(blob),
        detail: "high",
      });
      usedDocuments.push(documentRecord.name);
      usedDocumentIds.push(documentRecord.id);
      binaryFileCount += 1;
      continue;
    }

    if (isPdfExtension(documentRecord.extension) && blob && blob.size <= MAX_AI_PDF_BYTES && binaryFileCount < MAX_AI_BINARY_FILES) {
      content.push({
        type: "input_text",
        text: `PDF file: ${documentRecord.name}. Use the document contents to answer the request.`,
      });
      content.push({
        type: "input_file",
        filename: documentRecord.name,
        file_data: await blobToBase64(blob),
      });
      usedDocuments.push(documentRecord.name);
      usedDocumentIds.push(documentRecord.id);
      binaryFileCount += 1;
      continue;
    }

    const textInput = buildDocumentTextForAi(documentRecord, remainingCharacters);

    if (textInput) {
      content.push({
        type: "input_text",
        text: textInput.text,
      });
      remainingCharacters -= textInput.length;
      usedDocuments.push(documentRecord.name);
      usedDocumentIds.push(documentRecord.id);
    }
  }

  return {
    usedDocuments,
    usedDocumentIds,
    payload: {
      model: state.ai.model,
      input: [
        {
          role: "user",
          content,
        },
      ],
      max_output_tokens: 1200,
    },
  };
}

function buildAiInstruction(question, documents) {
  const filenames = documents.map((documentRecord) => documentRecord.name).join(", ");

  return [
    "You are helping an internal sales coordinator.",
    "Read the uploaded files and answer in simple business English.",
    "Use short sections with these headings:",
    "Summary",
    "Important details",
    "Risks or missing information",
    "Recommended next action",
    "When you mention a fact, include the filename in brackets if possible.",
    `Files available: ${filenames || "none"}`,
    `User question: ${question}`,
  ].join("\n");
}

function buildDocumentTextForAi(documentRecord, remainingCharacters) {
  const sourceText = documentRecord.text || documentRecord.aiSummary || documentRecord.summary;
  if (!sourceText) {
    return null;
  }

  const header = `File: ${documentRecord.name}\nType: ${buildDocumentSourceLabel(documentRecord)}\n\n`;
  const budget = Math.min(MAX_AI_TEXT_DOCUMENT_LENGTH, remainingCharacters - header.length);

  if (budget < 500) {
    return null;
  }

  const excerpt = shortenText(sourceText, budget);
  return {
    text: `${header}${excerpt}`,
    length: header.length + excerpt.length,
  };
}

async function callResponsesApi(apiKey, payload) {
  const response = await fetch(`${normaliseBaseUrl(state.ai.baseUrl)}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}.`;

    try {
      const errorPayload = await response.json();
      if (errorPayload && errorPayload.error && errorPayload.error.message) {
        errorMessage = errorPayload.error.message;
      }
    } catch {
      try {
        errorMessage = await response.text();
      } catch {
        errorMessage = `Request failed with status ${response.status}.`;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

function extractResponseText(response) {
  if (response && typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  if (!response || !Array.isArray(response.output)) {
    return "";
  }

  return response.output
    .filter((item) => item.type === "message" && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .filter((contentItem) => contentItem.type === "output_text" && typeof contentItem.text === "string")
    .map((contentItem) => contentItem.text)
    .join("\n\n")
    .trim();
}

function normaliseAiError(error) {
  const fallbackMessage = "AI reading failed. Check the key, try fewer large files, or use a secure backend base URL.";
  const message = error instanceof Error ? error.message : "";

  if (!message) {
    return fallbackMessage;
  }

  if (message.includes("Failed to fetch")) {
    return "The browser could not reach the AI endpoint. Check your internet connection, CORS policy, or use a backend proxy URL.";
  }

  return message;
}

function setAiUiStatus(message, tone) {
  uiState.aiStatusMessage = message;
  uiState.aiStatusTone = tone || "";
}

function getConfiguredApiKey() {
  return (
    aiApiKey.value.trim() ||
    (state.ai.rememberKey ? state.ai.apiKey : sessionApiKey || state.ai.apiKey)
  ).trim();
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

function isPdfExtension(extension) {
  return extension === "pdf";
}

function isDocxExtension(extension) {
  return extension === "docx";
}

function isSpreadsheetExtension(extension) {
  return SPREADSHEET_EXTENSIONS.has(extension);
}

function isImageExtension(extension) {
  return IMAGE_EXTENSIONS.has(extension);
}

function isImageFile(file, extension) {
  return file.type.startsWith("image/") || isImageExtension(extension);
}

function isAiReadyDocument(documentRecord) {
  return Boolean(documentRecord.text || documentRecord.blobStored);
}

function getFileExtension(filename) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function inferMimeType(extension) {
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "xls":
      return "application/vnd.ms-excel";
    case "csv":
      return "text/csv";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "";
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed"));
    reader.readAsText(file);
  });
}

async function readPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("The PDF reader library could not be loaded.");
  }

  const fileBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
  const pdfDocument = await loadingTask.promise;
  const pageCount = Math.min(pdfDocument.numPages, MAX_PDF_PAGES);
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pages.push(`Page ${pageNumber}\n${pageText}`);
    }
  }

  if (pdfDocument.numPages > MAX_PDF_PAGES) {
    pages.push(`Only the first ${MAX_PDF_PAGES} pages were extracted in the browser.`);
  }

  return pages.join("\n\n");
}

async function readDocxText(file) {
  if (!window.mammoth) {
    throw new Error("The DOCX reader library could not be loaded.");
  }

  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value || "";
}

async function readSpreadsheetText(file) {
  if (!window.XLSX) {
    throw new Error("The spreadsheet reader library could not be loaded.");
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
  const textParts = workbook.SheetNames.slice(0, 10).map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = window.XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return `Sheet: ${sheetName}\n${csv}`;
  });

  return textParts.join("\n\n");
}

function cleanDocumentText(rawText) {
  return rawText
    .replace(/\r/g, "")
    .replace(/\u0000/g, " ")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
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

function normaliseBaseUrl(value) {
  const cleaned = cleanString(value) || AI_DEFAULT_BASE_URL;
  return cleaned.replace(/\/+$/, "");
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

function buildUnsupportedDocumentSummary(extension, blobStored) {
  if (blobStored) {
    return extension
      ? `${extension.toUpperCase()} file stored. This version does not extract that file type in-browser yet, but you can keep it attached for a future backend or parser upgrade.`
      : "File stored. This version does not extract that file type in-browser yet, but you can keep it attached for a future backend or parser upgrade.";
  }

  return "File metadata was added, but the browser could not keep the original file bytes. Re-upload it when you want AI to inspect it.";
}

function buildFailedDocumentSummary(extension, blobStored, error) {
  const fallback = extension
    ? `${extension.toUpperCase()} file stored, but the browser could not extract readable content.`
    : "File stored, but the browser could not extract readable content.";

  if (!blobStored) {
    return `${fallback} Re-upload it later if you want AI to inspect the original file.`;
  }

  const message = error instanceof Error && error.message ? error.message : "";
  return message ? `${fallback} ${message}` : fallback;
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Image conversion failed"));
    reader.readAsDataURL(blob);
  });
}

async function blobToBase64(blob) {
  const dataUrl = await blobToDataUrl(blob);
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

function supportsIndexedDb() {
  return "indexedDB" in window;
}

function openDocumentDatabase() {
  if (!supportsIndexedDb()) {
    return Promise.reject(new Error("IndexedDB is not supported."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(BLOB_STORE_NAME)) {
          database.createObjectStore(BLOB_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
    });
  }

  return databasePromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
  });
}

async function saveDocumentBlob(documentId, blob) {
  try {
    const database = await openDocumentDatabase();
    const transaction = database.transaction(BLOB_STORE_NAME, "readwrite");
    const store = transaction.objectStore(BLOB_STORE_NAME);
    await requestToPromise(store.put({ id: documentId, blob, updatedAt: Date.now() }));
    await transactionToPromise(transaction);
    return true;
  } catch {
    return false;
  }
}

async function getDocumentBlob(documentId) {
  const database = await openDocumentDatabase();
  const transaction = database.transaction(BLOB_STORE_NAME, "readonly");
  const store = transaction.objectStore(BLOB_STORE_NAME);
  const result = await requestToPromise(store.get(documentId));
  await transactionToPromise(transaction);
  return result && result.blob ? result.blob : null;
}

async function deleteDocumentBlob(documentId) {
  if (!supportsIndexedDb()) {
    return;
  }

  try {
    const database = await openDocumentDatabase();
    const transaction = database.transaction(BLOB_STORE_NAME, "readwrite");
    const store = transaction.objectStore(BLOB_STORE_NAME);
    await requestToPromise(store.delete(documentId));
    await transactionToPromise(transaction);
  } catch {
    return;
  }
}
