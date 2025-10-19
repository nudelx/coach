const { join } = require('path');
const { readJsonFile, writeJsonFile } = require('./fileUtils');

const progressPath = join(__dirname, '..', 'data', 'progress.json');

const loadProgress = async () => {
  const fallback = { kids: {} };
  return readJsonFile(progressPath, fallback);
};

const saveProgress = async (progress) => writeJsonFile(progressPath, progress);

const getKidProgress = (progress, kidId) => {
  if (!progress.kids[kidId]) {
    progress.kids[kidId] = {
      nextModuleIndex: 0,
      deliveredLessons: [],
      cyclesCompleted: 0,
    };
  }
  return progress.kids[kidId];
};

const recordLessonDelivery = (progress, kidId, lessonReport) => {
  const kidProgress = getKidProgress(progress, kidId);
  kidProgress.deliveredLessons.push(lessonReport);
  if (kidProgress.deliveredLessons.length > 5) {
    kidProgress.deliveredLessons = kidProgress.deliveredLessons.slice(-5);
  }
  kidProgress.nextModuleIndex += 1;
  return kidProgress;
};

const rollOverIfNeeded = (progress, kidId, curriculumLength) => {
  const kidProgress = getKidProgress(progress, kidId);
  if (kidProgress.nextModuleIndex >= curriculumLength) {
    kidProgress.nextModuleIndex = 0;
    kidProgress.cyclesCompleted += 1;
  }
};

module.exports = {
  loadProgress,
  saveProgress,
  getKidProgress,
  recordLessonDelivery,
  rollOverIfNeeded,
  progressPath,
};
