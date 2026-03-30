import { Question, Exercise } from '../types';

export const EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    title: 'Exercise 1.1: Present Simple Mastery',
    type: 'Grammar',
    skill: 'Grammar',
    subSkill: 'Verb Tenses',
    source: 'book',
    description: 'Practice your Present Simple skills with this book-based exercise.',
    content: `Fill in the blanks with the correct form of the verb in brackets.`,
    questions: [
      { id: 'q1', text: '1. She __________ (go) to the gym every morning.', correctAnswer: 'goes', type: 'text', explanation: 'Third person singular (She) takes "s/es" in present simple.' },
      { id: 'q2', text: '2. They __________ (not / like) spicy food.', correctAnswer: 'do not like', type: 'text', explanation: 'Plural subjects (They) use "do not" for negatives.' },
      { id: 'q3', text: '3. __________ he __________ (speak) French?', correctAnswer: 'Does speak', type: 'text', explanation: 'Third person singular questions start with "Does".' },
      { id: 'q4', text: '4. The sun __________ (rise) in the east.', correctAnswer: 'rises', type: 'text', explanation: 'General truths use present simple with "s/es" for singular subjects.' },
      { id: 'q5', text: '5. We __________ (study) English on Mondays.', correctAnswer: 'study', type: 'text', explanation: 'First person plural (We) uses the base form of the verb.' }
    ]
  },
  {
    id: 'ex-2',
    title: 'Exercise 1.2: Past Continuous in Context',
    type: 'Grammar',
    skill: 'Grammar',
    subSkill: 'Verb Tenses',
    source: 'book',
    description: 'Practice your Past Continuous skills with this book-based exercise.',
    content: `Complete the sentences using the past continuous form of the verbs.`,
    questions: [
      { id: 'q1', text: '1. I __________ (read) a book when the phone rang.', correctAnswer: 'was reading', type: 'text', explanation: 'Past continuous for an action in progress interrupted by another.' },
      { id: 'q2', text: '2. What __________ you __________ (do) at 8 PM last night?', correctAnswer: 'were doing', type: 'text', explanation: 'Questions in past continuous use was/were + subject + -ing.' },
      { id: 'q3', text: '3. They __________ (not / watch) TV when I arrived.', correctAnswer: 'were not watching', type: 'text', explanation: 'Negative past continuous uses was/were + not + -ing.' },
      { id: 'q4', text: '4. It __________ (rain) heavily all afternoon.', correctAnswer: 'was raining', type: 'text', explanation: 'Action in progress over a period in the past.' },
      { id: 'q5', text: '5. While she __________ (cook), her husband was setting the table.', correctAnswer: 'was cooking', type: 'text', explanation: 'Two simultaneous actions in progress in the past.' }
    ]
  },
  {
    id: 'ex-3',
    title: 'Exercise 1.3: Listening - Travel Numbers',
    type: 'Listening',
    skill: 'Listening',
    subSkill: 'Numbers & Dates',
    source: 'book',
    description: 'Listen to the travel details and fill in the missing numbers.',
    content: `Listen to the recording and write down the flight numbers and times mentioned.`,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder
    questions: [
      { id: 'q1', text: 'Flight Number to London:', correctAnswer: 'BA123', type: 'text', explanation: 'The speaker clearly says "British Airways flight one-two-three".' },
      { id: 'q2', text: 'Departure Time:', correctAnswer: '10:45 AM', type: 'text', explanation: 'The time mentioned is "quarter to eleven in the morning".' },
      { id: 'q3', text: 'Gate Number:', correctAnswer: '24B', type: 'text', explanation: 'The gate is announced as "twenty-four B".' }
    ]
  },
  {
    id: 'ex-4',
    title: 'Exercise 1.4: Vocabulary - Synonyms',
    type: 'Vocabulary',
    skill: 'Vocabulary',
    subSkill: 'Academic Word List',
    source: 'book',
    description: 'Find the closest synonyms for the highlighted words.',
    content: `Choose the best synonym for the word in bold:
    1. The results were **consistent** with previous findings.
    2. She has a **significant** amount of experience.
    3. The project was **abandoned** due to lack of funds.`,
    questions: [
      { id: 'q1', text: '1. Consistent:', correctAnswer: 'constant', type: 'text', explanation: '"Consistent" means acting or done in the same way over time.' },
      { id: 'q2', text: '2. Significant:', correctAnswer: 'important', type: 'text', explanation: '"Significant" means sufficiently great or important to be worthy of attention.' },
      { id: 'q3', text: '3. Abandoned:', correctAnswer: 'deserted', type: 'text', explanation: '"Abandoned" means having been deserted or left.' }
    ]
  },
  {
    id: 'ex-5',
    title: 'Exercise 1.5: Reading - Skimming for Main Idea',
    type: 'Reading',
    skill: 'Reading',
    subSkill: 'Skimming & Scanning',
    source: 'book',
    description: 'Read the short paragraph and identify the main idea.',
    content: `**The Rise of Remote Work**
    In recent years, technology has enabled millions of employees to work from home. While this offers flexibility and reduces commute times, it also presents challenges such as social isolation and the blurring of work-life boundaries. Companies are now finding a balance through hybrid models.`,
    questions: [
      { id: 'q1', text: 'What is the primary focus of the text?', correctAnswer: 'The impact of remote work', type: 'text', explanation: 'The text discusses both the benefits and challenges of the shift to remote work.' },
      { id: 'q2', text: 'What is a mentioned challenge of working from home?', correctAnswer: 'social isolation', type: 'text', explanation: 'The text explicitly mentions "social isolation" as a challenge.' }
    ]
  },
  ...Array.from({ length: 197 }, (_, i) => ({
    id: `ex-${i + 4}`,
    title: `Exercise ${i + 4}: ${getExerciseTitle(i + 3)}`,
    type: getExerciseType(i + 3),
    skill: getExerciseSkill(i + 3),
    subSkill: 'General Practice',
    source: 'book',
    description: `Practice your ${getExerciseType(i + 3)} skills with this book-based exercise.`,
    questions: []
  }))
];

function getExerciseSkill(index: number): 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary' {
  const skills: ('Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary')[] = ["Grammar", "Vocabulary", "Reading", "Writing", "Listening"];
  return skills[index % skills.length];
}

function getExerciseTitle(index: number): string {
  const titles = [
    "Present Simple Mastery",
    "Past Continuous in Context",
    "Future Intentions",
    "Conditional Type 1",
    "Relative Clauses",
    "Passive Voice Basics",
    "Modal Verbs for Advice",
    "Gerunds vs Infinitives",
    "Article Usage",
    "Prepositions of Place"
  ];
  return titles[index % titles.length];
}

function getExerciseType(index: number): string {
  const types = ["Grammar", "Vocabulary", "Reading", "Writing"];
  return types[index % types.length];
}
