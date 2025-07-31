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

var realAssessmentJson = "```json\n{\n  \"initLevel\": 2,\n  \"initSubLevel\": 6,\n  \"targetLevel\": 3,\n  \"targetSubLevel\": 10,\n  \"estimatedDurationDays\": 60,\n  \"assessmentResult\": {\n    \"score\": 11,\n    \"maxScore\": 15,\n    \"levelEstimate\": \"Mid Level 2\",\n    \"overallComment\": \"The user shows a good grasp of basic vocabulary and simple sentence structures but needs improvement in identifying all correct answers in multiple-choice questions and using precise vocabulary in cloze tests.\",\n    \"strengths\": [\"vocabulary\", \"reading\"],\n    \"weaknesses\": [\"multiple-choice accuracy\", \"cloze test precision\"],\n    \"suggestions\": [\n      \"Practice identifying all correct options in multiple-choice questions.\",\n      \"Work on using more precise vocabulary in cloze tests.\",\n      \"Continue building on writing skills with more complex sentences.\"\n    ],\n    \"writingEvaluation\": {\n      \"task1\": {\n        \"coherence\": \"Good\",\n        \"grammar\": \"Good\",\n        \"score\": 4\n      },\n      \"task2\": {\n        \"coherence\": \"Good\",\n        \"grammar\": \"Good\",\n        \"score\": 4\n      }\n    }\n  },\n  \"studyPlan\": [\n    {\n      \"day\": 1,\n      \"objective\": \"Improve multiple-choice accuracy\",\n      \"tasks\": [\n        \"Practice identifying all correct options in a set of multiple-choice questions about animals.\",\n        \"Review vocabulary for common objects and actions.\"\n      ]\n    },\n    {\n      \"day\": 2,\n      \"objective\": \"Enhance cloze test precision\",\n      \"tasks\": [\n        \"Complete cloze sentences with the most appropriate words.\",\n        \"Read a short story and identify key vocabulary.\"\n      ]\n    },\n    {\n      \"day\": 3,\n      \"objective\": \"Build writing skills\",\n      \"tasks\": [\n        \"Write a short paragraph about a favorite activity using past tense.\",\n        \"Review and correct sentences with grammar mistakes.\"\n      ]\n    },\n    {\n      \"day\": 4,\n      \"objective\": \"Review and practice\",\n      \"tasks\": [\n        \"Take a short quiz on vocabulary and grammar.\",\n        \"Read aloud a short passage to improve pronunciation.\"\n      ]\n    },\n    {\n      \"day\": 5,\n      \"objective\": \"Consolidate learning\",\n      \"tasks\": [\n        \"Write a short story using new vocabulary words.\",\n        \"Practice listening to and repeating simple sentences.\"\n      ]\n    }\n  ]\n}\n```"

func TestAssess(t *testing.T) {
	var res AssessmentGPTResponse
	json.Unmarshal([]byte(jsonOutput), &res)
	fmt.Println(res)

	var res2 QuizGPTResponse
	json.Unmarshal([]byte(examJson), &res2)
	fmt.Println(res2)

	res3, err := CleanAndParse(examJson)
	fmt.Println(res3, err)

	realAssessmentJson, err := ExtractJSON(realAssessmentJson)
	fmt.Println(realAssessmentJson, err)
	var assessment AssessmentGPTResponse
	if err := json.Unmarshal([]byte(realAssessmentJson), &assessment); err != nil {
		fmt.Println(err)
	}
}
