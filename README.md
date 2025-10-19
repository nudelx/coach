## Weekly English Lesson Job

This project creates a weekly job that assembles level-appropriate English lessons for each kid in the config, generates the plan with ChatGPT, and emails the lesson through Gmail.

### Prerequisites
- Node.js 18+
- Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) (regular password will not work)
- OpenAI API key (free-tier works for light usage)

### Environment Variables
Set the following (for local dev you can create a `.env` file):

```env
OPENAI_API_KEY=sk-...
GMAIL_USER=your.gmail.username@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Configuration
Edit `config/lesson-config.json` (see `config/lesson-config.example.json` for a template):
- `kids`: list of learners. Fields:
  - `id`: unique id (used for progress tracking)
  - `name`: learner name
  - `email`: lesson recipient
  - `startingLevel`: index in the curriculum array (0 = very first lesson)
  - Optional: `age`, `languageBackground`, `interests` (array of strings), `ownerEmails`
- `defaultOwnerEmails`: global CC list (optional)
- `weeklySchedule`: cron expression for the job (defaults to `0 9 * * 1`)
- `sender`: name and Gmail address used for outgoing email

Progress is stored in `data/progress.json`. The job remembers which modules were covered and rotates through the defined curriculum.

### Usage
Install dependencies and run a one-off cycle to verify email delivery:

```bash
npm install
npm run run:once
```

Keep the service running to trigger the scheduled job:

```bash
npm start
```

The job logs delivery status for each kid, and updates `data/progress.json` after every run.

### Customisation Tips
- Adjust lesson sequencing by editing `src/curriculum.js`.
- To cover more advanced material, extend the curriculum array; the job automatically loops when it reaches the end.
- Modify `buildLessonPrompt` in `src/lessonPlanner.js` if you want to tweak lesson structure or tone.
