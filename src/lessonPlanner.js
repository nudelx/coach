const { CURRICULUM } = require('./curriculum');

const selectModuleForKid = (kidProgress) => {
  const { nextModuleIndex } = kidProgress;
  const cappedIndex = Math.min(nextModuleIndex, CURRICULUM.length - 1);
  const module = CURRICULUM[cappedIndex];
  const revisiting = nextModuleIndex >= CURRICULUM.length;
  return { module, moduleIndex: cappedIndex, revisiting };
};

const summariseHistory = (deliveredLessons) => {
  if (!deliveredLessons || deliveredLessons.length === 0) {
    return 'No previous lessons yet. Start from absolute beginner level.';
  }

  return deliveredLessons
    .map((lesson) => {
      const summary = lesson.summary || lesson.emailSubject || lesson.moduleTitle;
      return `${lesson.generatedAt.slice(0, 10)} – ${lesson.moduleTitle}: ${summary}`;
    })
    .join('\n');
};

const buildLessonPrompt = ({ kid, module, kidProgress }) => {
  const historySummary = summariseHistory(kidProgress.deliveredLessons);
  const revisitingNote = kidProgress.cyclesCompleted > 0
    ? `The learner has already completed the core curriculum ${kidProgress.cyclesCompleted} time(s). Increase challenge with richer activities, authentic materials, and extended production.`
    : '';
  const kidDescriptors = [
    kid.age ? `age ${kid.age}` : null,
    kid.languageBackground ? `native language: ${kid.languageBackground}` : null,
    kid.interests ? `interests: ${kid.interests.join(', ')}` : null,
  ].filter(Boolean).join(' | ');

  return [
    'You are an encouraging ESL tutor who designs engaging weekly lessons for kids.',
    `Learner: ${kid.name}. ${kidDescriptors || 'Young beginner learner.'}`,
    `Current CEFR focus: ${module.cefr}.`,
    revisitingNote,
    'Keep continuity with the previous lessons. Avoid repeating identical activities unless for spaced review.',
    'Past lesson highlights:',
    historySummary,
    'Lesson requirements:',
    '- Provide a concise overview paragraph that recaps the learning goals.',
    '- Outline a 60-minute lesson broken into: Warm-up, Vocabulary, Grammar, Guided Practice, Communicative Task, Reflection, Homework.',
    '- Include specific teacher prompts, expected student responses, and differentiation tips (support and challenge).',
    '- Add a cultural or real-world connection when relevant.',
    '- Finish with measurable success criteria for the learner.',
    'Lesson focus details:',
    `Title: ${module.title}`,
    `Objectives: ${module.objectives.join('; ')}`,
    `Grammar focus: ${module.grammarFocus}`,
    `Target vocabulary: ${module.vocabularyFocus.join(', ')}`,
    `Suggested activities: ${module.activityIdeas.join(', ')}`,
    'Write the lesson in markdown with clear headings and bullet points.',
  ].join('\n');
};

const buildEmailSubject = ({ kid, module, kidProgress }) => {
  const lessonNumber = kidProgress.deliveredLessons.length + 1 + kidProgress.cyclesCompleted * CURRICULUM.length;
  return `English Lesson ${lessonNumber}: ${module.title} (${module.cefr})`;
};

const convertToHtml = (markdownText) => {
  const escaped = markdownText
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped.split('\n\n');
  const htmlParagraphs = paragraphs.map((paragraph) => {
    if (paragraph.trim().startsWith('#')) {
      const level = paragraph.match(/^#+/)[0].length;
      const text = paragraph.replace(/^#+\s*/, '');
      return `<h${level}>${text}</h${level}>`;
    }
    if (paragraph.trim().startsWith('- ')) {
      const items = paragraph.split('\n').map((line) => `<li>${line.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
  });
  return `<html><body>${htmlParagraphs.join('\n')}</body></html>`;
};

const extractSummary = (lessonMarkdown) => {
  const firstHeadingMatch = lessonMarkdown.match(/#+\s*(.+)/);
  if (firstHeadingMatch) {
    return firstHeadingMatch[1].trim();
  }
  return lessonMarkdown.split('\n').slice(0, 2).join(' ').slice(0, 160);
};

module.exports = {
  selectModuleForKid,
  buildLessonPrompt,
  buildEmailSubject,
  convertToHtml,
  extractSummary,
};
