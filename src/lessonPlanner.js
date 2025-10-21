const { CURRICULUM } = require("./curriculum");

const selectModuleForKid = (kidProgress) => {
  const { nextModuleIndex } = kidProgress;
  const cappedIndex = Math.min(nextModuleIndex, CURRICULUM.length - 1);
  const module = CURRICULUM[cappedIndex];
  const revisiting = nextModuleIndex >= CURRICULUM.length;
  return { module, moduleIndex: cappedIndex, revisiting };
};

const summariseHistory = (deliveredLessons) => {
  if (!deliveredLessons || deliveredLessons.length === 0) {
    return "No previous lessons yet. Start from absolute beginner level.";
  }

  return deliveredLessons
    .map((lesson) => {
      const summary =
        lesson.summary || lesson.emailSubject || lesson.moduleTitle;
      return `${lesson.generatedAt.slice(0, 10)} – ${
        lesson.moduleTitle
      }: ${summary}`;
    })
    .join("\n");
};

const buildLessonPrompt = ({ kid, module, kidProgress }) => {
  const historySummary = summariseHistory(kidProgress.deliveredLessons);
  const revisitingNote =
    kidProgress.cyclesCompleted > 0
      ? `The learner has already completed the core curriculum ${kidProgress.cyclesCompleted} time(s). Increase challenge with richer activities, authentic materials, and extended production.`
      : "";
  const kidDescriptors = [
    kid.age ? `age ${kid.age}` : null,
    kid.languageBackground
      ? `native language: ${kid.languageBackground}`
      : null,
    kid.interests ? `interests: ${kid.interests.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return [
    "You are an encouraging english teacher who teaches kids english lessons in hebrew and russian.",
    `Learner: ${kid.name}. ${
      kidDescriptors || "Young beginner learner. speaking Hebrew and russian"
    }`,
    "use hebrew and russian in the lesson, create kid friendly lesson.",
    "you are the teacher, write the lesson in the style like you are talking to the kid",
    "use kids friendly language and vocabulary, make the lesson fun and engaging",
    `Current CEFR focus: ${module.cefr}.`,
    revisitingNote,
    "Keep continuity with the previous lessons. Avoid repeating identical activities unless for spaced review.",
    "Past lesson highlights:",
    historySummary,
    "Lesson requirements:",
    "- Provide a concise overview paragraph that recaps the learning goals.",
    "- Outline a 40-minute lesson broken into: Warm-up, Vocabulary, Grammar, Guided Practice, Communicative Task, Reflection, Homework.",
    "- Add a cultural or real-world connection when relevant.",
    "Lesson focus details:",
    `Title: ${module.title}`,
    `Objectives: ${module.objectives.join("; ")}`,
    `Grammar focus: ${module.grammarFocus}`,
    `Target vocabulary: ${module.vocabularyFocus.join(", ")}`,
    `Suggested activities: ${module.activityIdeas.join(", ")}`,
    "Write the lesson in markdown with clear headings and bullet points.",
  ].join("\n");
};

const buildEmailSubject = ({ kid, module, kidProgress }) => {
  const lessonNumber =
    kidProgress.deliveredLessons.length +
    1 +
    kidProgress.cyclesCompleted * CURRICULUM.length;
  return `English Lesson ${lessonNumber}: ${module.title} (${module.cefr})`;
};

const wrapListItems = (segments) => {
  const grouped = [];
  let currentList = null;

  segments.forEach((segment) => {
    if (segment.startsWith("<li>")) {
      if (!currentList) {
        currentList = [];
      }
      currentList.push(segment);
    } else {
      if (currentList) {
        grouped.push(`<ul>${currentList.join("")}</ul>`);
        currentList = null;
      }
      grouped.push(segment);
    }
  });

  if (currentList) {
    grouped.push(`<ul>${currentList.join("")}</ul>`);
  }

  return grouped;
};

const applyInlineFormatting = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

const convertMarkdownLine = (line) => {
  if (/^#/.test(line.trim())) {
    const level = line.match(/^#+/)[0].length;
    const text = line.replace(/^#+\s*/, "");
    const classes = ["section-title"];
    if (text.trim().toLowerCase() === "overview") {
      classes.push("overview-title");
    }
    return `<h${level} class="${classes.join(" ")}">${text}</h${level}>`;
  }

  if (/^\*\*overview:\*\*/i.test(line.trim())) {
    const content = line.replace(/^\*\*overview:\*\*\s*/i, "");
    return `<div class="overview-block"><span class="overview-label">Overview:</span><span class="overview-content">${applyInlineFormatting(
      content
    )}</span></div>`;
  }

  if (/^- /.test(line.trim())) {
    const text = line.replace(/^- /, "");
    return `<li>${applyInlineFormatting(text)}</li>`;
  }

  if (/^\d+[\).\s]/.test(line.trim())) {
    const text = line.replace(/^\d+[\).\s]/, "");
    return `<li>${applyInlineFormatting(text)}</li>`;
  }

  return `<p class="lesson-text">${applyInlineFormatting(line)}</p>`;
};

const convertToHtml = (markdownText) => {
  const escaped = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const normalized = escaped
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const converted = normalized.map(convertMarkdownLine);
  const withWrappedLists = wrapListItems(converted);

  const style = `
    :root {
      color-scheme: light;
    }
    body {
      font-family: 'Poppins', 'Comic Sans MS', 'Nunito', sans-serif;
      background: linear-gradient(180deg, #fef6ff 0%, #f3f9ff 100%);
      color: #121212;
      font-size: 20px;
      line-height: 1.6;
      padding: 24px;
    }
    .lesson-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 12px 24px rgba(47, 142, 198, 0.15);
      padding: 32px 40px;
      border: 3px solid #ffe45e;
    }
    h1, h2, h3 {
      font-family: 'Baloo 2', 'Fredoka One', cursive;
      color: #ff8a5b;
      margin-bottom: 12px;
      margin-top: 28px;
      letter-spacing: 0.02em;
    }
    h1 {
      font-size: 36px;
      text-align: center;
    }
    h2 {
      font-size: 28px;
    }
    h3 {
      font-size: 24px;
    }
    p {
      margin: 12px 0;
    }
    ul {
      list-style: none;
      padding-left: 0;
      margin: 16px 0;
    }
    ul li {
      background: #eff7ff;
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 20px;
      margin-bottom: 10px;
      border-left: 6px solid #4dabf5;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: #ffbd69;
      color: #2b2d42;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .overview-title {
      font-size: 34px;
      color: #ff6f91;
    }
    .overview-block {
      font-size: 24px;
      margin: 20px 0;
      background: #fff4c3;
      border-radius: 16px;
      padding: 18px 22px;
      border: 2px solid #ffd166;
      display: flex;
      gap: 12px;
      align-items: baseline;
    }
    .overview-label {
      font-weight: 700;
      font-size: 26px;
      color: #ff6f91;
    }
    .overview-content {
      font-size: 22px;
      color: #212121;
      flex: 1;
    }
    .success-criteria {
      background: #dfffe2;
      border: 2px dashed #34c759;
      border-radius: 16px;
      padding: 16px 20px;
      margin-top: 24px;
    }
  `;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly English Lesson</title>
        <style>${style}</style>
      </head>
      <body>
        <div class="lesson-card">
          <div class="badge">Your Weekly English Superpower Session</div>
          ${withWrappedLists.join("\n")}
        </div>
      </body>
    </html>
  `;
};

const extractSummary = (lessonMarkdown) => {
  const firstHeadingMatch = lessonMarkdown.match(/#+\s*(.+)/);
  if (firstHeadingMatch) {
    return firstHeadingMatch[1].trim();
  }
  return lessonMarkdown.split("\n").slice(0, 2).join(" ").slice(0, 160);
};

module.exports = {
  selectModuleForKid,
  buildLessonPrompt,
  buildEmailSubject,
  convertToHtml,
  extractSummary,
};
