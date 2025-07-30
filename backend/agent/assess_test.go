package agent

import (
	"encoding/json"
	"fmt"
	"testing"
)

var jsonOutput = `
{
  "initLevel": 2,
  "initSubLevel": 6,
  "targetLevel": 3,
  "targetSubLevel": 10,
  "estimatedDurationDays": 45,
  "assessmentResult": {
    "score": 56,
    "maxScore": 70,
    "levelEstimate": "Upper Level 2",
    "overallComment": "The student has a solid grasp of basic vocabulary and grammar but needs improvement in writing structure and prepositions.",
    "strengths": ["vocabulary", "grammar", "reading comprehension"],
    "weaknesses": ["writing organization", "prepositions", "tense usage"],
    "suggestions": [
      "Review common prepositions using visual aids.",
      "Practice short writing tasks with structured prompts.",
      "Focus on using correct verb tenses in sentences."
    ],
    "writingEvaluation": {
      "task1": {
        "coherence": "Fair",
        "grammar": "Weak",
        "score": 6
      },
      "task2": {
        "coherence": "Good",
        "grammar": "Average",
        "score": 7
      }
    }
  },
  "studyPlan": [
    {
      "day": 1,
      "objective": "Reinforce understanding of basic prepositions",
      "tasks": [
        "Watch video: 'Prepositions in Daily Life' (10 min)",
        "Complete worksheet: Fill in the blank with prepositions",
        "Quiz: 5 questions on location prepositions"
      ]
    },
    {
      "day": 2,
      "objective": "Strengthen verb tense consistency",
      "tasks": [
        "Review regular vs irregular verbs (past tense)",
        "Do practice: Rewrite 5 sentences in past tense",
        "Take mini quiz: 5 grammar questions"
      ]
    },
    {
      "day": 3,
      "objective": "Practice descriptive writing",
      "tasks": [
        "Read sample paragraph about a favorite pet",
        "Write 3–5 sentences about your favorite animal",
        "Get feedback and revise your writing"
      ]
    }
  ]
}
`

var examJson = `
{
  "questions": [
    {
      "type": "single_choice",
      "question": "What is the opposite of 'happy'?",
      "options": ["Sad", "Angry", "Excited", "Tired"],
      "answer": "Sad",
      "explanation": "The opposite of 'happy' is 'sad' because they represent contrasting emotions."
    },
    {
      "type": "single_choice",
      "question": "Which word is a color?",
      "options": ["Apple", "Banana", "Blue", "Tree"],
      "answer": "Blue",
      "explanation": "'Blue' is a color, while the other options are objects or fruits."
    },
    {
      "type": "single_choice",
      "question": "What do you use to write on paper?",
      "options": ["Eraser", "Pencil", "Ruler", "Scissors"],
      "answer": "Pencil",
      "explanation": "A 'pencil' is used to write on paper, while the other items are used for different purposes."
    },
    {
      "type": "single_choice",
      "question": "Which animal says 'meow'?",
      "options": ["Dog", "Cat", "Cow", "Bird"],
      "answer": "Cat",
      "explanation": "A cat is known for making the sound 'meow'."
    },
    {
      "type": "single_choice",
      "question": "What is the first month of the year?",
      "options": ["February", "March", "January", "April"],
      "answer": "January",
      "explanation": "January is the first month of the year in the Gregorian calendar."
    },
    {
      "type": "multiple_choice",
      "question": "Which of these are fruits?",
      "options": ["Apple", "Carrot", "Banana", "Broccoli"],
      "answer": "Apple;Banana",
      "explanation": "Apples and bananas are fruits, while carrots and broccoli are vegetables."
    },
    {
      "type": "multiple_choice",
      "question": "Which of these can fly?",
      "options": ["Bird", "Airplane", "Car", "Fish"],
      "answer": "Bird;Airplane",
      "explanation": "Birds and airplanes can fly, while cars and fish cannot."
    },
    {
      "type": "multiple_choice",
      "question": "Which of these are parts of the face?",
      "options": ["Nose", "Elbow", "Ear", "Knee"],
      "answer": "Nose;Ear",
      "explanation": "The nose and ear are parts of the face, while the elbow and knee are parts of the arms and legs."
    },
    {
      "type": "multiple_choice",
      "question": "Which of these are colors of the rainbow?",
      "options": ["Red", "Pink", "Blue", "Black"],
      "answer": "Red;Blue",
      "explanation": "Red and blue are colors of the rainbow, while pink and black are not."
    },
    {
      "type": "multiple_choice",
      "question": "Which of these are school supplies?",
      "options": ["Notebook", "Toy", "Pencil", "Ball"],
      "answer": "Notebook;Pencil",
      "explanation": "Notebooks and pencils are school supplies, while toys and balls are not typically used in school."
    },
    {
      "type": "cloze",
      "question": "The cat is ___ the table.",
      "options": ["on", "in", "under", "over"],
      "answer": "on",
      "explanation": "The correct preposition to describe the cat's position relative to the table is 'on'."
    },
    {
      "type": "cloze",
      "question": "I have ___ apples in my bag.",
      "options": ["a", "an", "two", "the"],
      "answer": "two",
      "explanation": "The word 'two' is used to indicate the quantity of apples."
    },
    {
      "type": "cloze",
      "question": "She ___ to school every day.",
      "options": ["go", "goes", "going", "went"],
      "answer": "goes",
      "explanation": "The correct present tense form of the verb for 'she' is 'goes'."
    },
    {
      "type": "writing",
      "question": "Write about your favorite animal. What does it look like and why do you like it?",
      "options": [],
      "answer": "",
      "explanation": "This prompt assesses the ability to describe and express preferences in writing."
    },
    {
      "type": "writing",
      "question": "Describe what you did last weekend. Include at least three activities.",
      "options": [],
      "answer": "",
      "explanation": "This prompt evaluates the ability to recount past events and use past tense verbs."
    }
  ]
}
`

func TestAssess(t *testing.T) {
	var res AssessmentGPTResponse
	json.Unmarshal([]byte(jsonOutput), &res)
	fmt.Println(res)

	var res2 QuizGPTResponse
	json.Unmarshal([]byte(examJson), &res2)
	fmt.Println(res2)

	res3, err := CleanAndParse(examJson)
	fmt.Println(res3, err)
}
