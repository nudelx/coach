const cron = require('node-cron');
const { ensureEnvVars } = require('./env');
const { loadConfig } = require('./configLoader');
const { runLessonCycle } = require('./job');

const REQUIRED_ENV_VARS = ['OPENAI_API_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];

const logCycleResults = (cycle) => {
  cycle.results.forEach((result) => {
    if (result.status === 'sent') {
      console.log(`[SUCCESS] Sent lesson to ${result.email} – ${result.module}`);
    } else {
      console.error(`[ERROR] Failed to send lesson to ${result.email} – ${result.error}`);
    }
  });
};

const executeCycleNow = async () => {
  const cycle = await runLessonCycle(new Date());
  logCycleResults(cycle);
};

const scheduleWeeklyJob = (schedule) => {
  console.log(`Scheduling weekly lesson job with cron expression "${schedule}"`);
  cron.schedule(schedule, async () => {
    console.log(`Starting scheduled lesson cycle at ${new Date().toISOString()}`);
    try {
      await executeCycleNow();
    } catch (error) {
      console.error(`Scheduled cycle failed: ${error.message}`);
    }
  });
};

const main = async () => {
  try {
    ensureEnvVars(REQUIRED_ENV_VARS);
    const config = await loadConfig();
    const schedule = config.weeklySchedule || '0 9 * * 1';

    if (process.env.RUN_ONCE === 'true') {
      await executeCycleNow();
      return;
    }

    scheduleWeeklyJob(schedule);
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

main();
