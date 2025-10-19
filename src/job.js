const { CURRICULUM } = require('./curriculum');
const { loadConfig } = require('./configLoader');
const {
  loadProgress,
  saveProgress,
  getKidProgress,
  recordLessonDelivery,
  rollOverIfNeeded,
} = require('./progressStore');
const {
  selectModuleForKid,
  buildLessonPrompt,
  buildEmailSubject,
  convertToHtml,
  extractSummary,
} = require('./lessonPlanner');
const { completeLessonPlan } = require('./lessonGenerator');
const { sendLessonEmail } = require('./emailService');

const alignStartingLevel = (kid, kidProgress) => {
  if (kidProgress.deliveredLessons.length === 0 && kid.startingLevel !== undefined) {
    kidProgress.nextModuleIndex = kid.startingLevel;
  }
};

const buildCcList = (kid, config) => {
  const addresses = new Set();
  (config.defaultOwnerEmails || []).forEach((email) => addresses.add(email));
  (kid.ownerEmails || []).forEach((email) => addresses.add(email));
  addresses.delete(kid.email);
  return Array.from(addresses);
};

const runLessonCycle = async (triggeredAt = new Date()) => {
  const config = await loadConfig();
  const progress = await loadProgress();
  const cycleResults = [];

  for (const kid of config.kids) {
    const kidProgress = getKidProgress(progress, kid.id);
    alignStartingLevel(kid, kidProgress);
    const { module, revisiting } = selectModuleForKid(kidProgress);

    try {
      const prompt = buildLessonPrompt({ kid, module, kidProgress, triggeredAt, revisiting });
      const lessonContent = await completeLessonPlan(prompt);
      const emailSubject = buildEmailSubject({ kid, module, kidProgress });
      const emailHtml = convertToHtml(lessonContent);

      await sendLessonEmail({
        to: kid.email,
        cc: buildCcList(kid, config),
        subject: emailSubject,
        text: lessonContent,
        html: emailHtml,
        fromName: config.sender.name,
        fromEmail: config.sender.email,
      });

      recordLessonDelivery(progress, kid.id, {
        moduleId: module.id,
        moduleTitle: module.title,
        cefr: module.cefr,
        generatedAt: triggeredAt.toISOString(),
        summary: extractSummary(lessonContent),
        emailSubject,
        revisiting,
      });
      rollOverIfNeeded(progress, kid.id, CURRICULUM.length);

      cycleResults.push({
        kidId: kid.id,
        email: kid.email,
        module: module.title,
        status: 'sent',
      });
    } catch (error) {
      cycleResults.push({
        kidId: kid.id,
        email: kid.email,
        module: module.title,
        status: 'failed',
        error: error.message,
      });
    }
  }

  await saveProgress(progress);

  return {
    runAt: triggeredAt.toISOString(),
    results: cycleResults,
  };
};

module.exports = {
  runLessonCycle,
};
