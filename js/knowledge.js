/* ============================================
   NEXUS — Built-in Knowledge Engine
   Works offline, no API key needed
   ============================================ */
const KnowledgeEngine = (() => {

    // Comprehensive knowledge base organized by topic
    const knowledge = {
        // ---- MATHEMATICS ----
        math: {
            keywords: ['math', 'calculus', 'algebra', 'geometry', 'trigonometry', 'equation', 'derivative', 'integral', 'fraction', 'percentage', 'probability', 'statistics', 'matrix', 'logarithm', 'quadratic', 'polynomial', 'arithmetic', 'number', 'prime', 'factorial', 'permutation', 'combination', 'mean', 'median', 'mode', 'standard deviation', 'variance', 'slope', 'intercept', 'linear', 'exponential', 'vector', 'set theory', 'function', 'graph', 'area', 'volume', 'perimeter', 'circumference', 'pythagorean', 'sine', 'cosine', 'tangent', 'differentiate', 'integrate', 'limit'],
            responses: {
                'derivative': `**Derivatives** measure how a function changes as its input changes — essentially the *rate of change* or *slope* at any point.

### Basic Rules
| Rule | Formula | Example |
|------|---------|---------|
| Power Rule | d/dx [xⁿ] = nxⁿ⁻¹ | d/dx [x³] = 3x² |
| Constant | d/dx [c] = 0 | d/dx [5] = 0 |
| Sum Rule | d/dx [f+g] = f'+g' | d/dx [x²+3x] = 2x+3 |
| Product Rule | d/dx [fg] = f'g + fg' | — |
| Chain Rule | d/dx [f(g(x))] = f'(g(x))·g'(x) | — |

### Quick Example
For **f(x) = x³ + 2x² − 5x + 3**:
- f'(x) = 3x² + 4x − 5

Would you like me to walk through more examples or explain a specific rule in detail?`,

                'integral': `**Integration** is the reverse of differentiation. It finds the area under a curve or the accumulation of quantities.

### Key Formulas
| Type | Formula |
|------|---------|
| Power Rule | ∫xⁿ dx = xⁿ⁺¹/(n+1) + C |
| Constant | ∫a dx = ax + C |
| Exponential | ∫eˣ dx = eˣ + C |
| Trig | ∫sin(x) dx = −cos(x) + C |

### Example
∫(3x² + 2x) dx = x³ + x² + C

The **C** is the constant of integration — it's there because many functions can have the same derivative.

Want me to solve a specific integral for you?`,

                'quadratic': `**Quadratic Equations** have the form **ax² + bx + c = 0**.

### The Quadratic Formula
**x = (−b ± √(b² − 4ac)) / 2a**

### The Discriminant (b² − 4ac)
- **Positive**: Two distinct real roots
- **Zero**: One repeated real root
- **Negative**: Two complex roots

### Example
Solve **2x² + 5x − 3 = 0**:
- a=2, b=5, c=−3
- Discriminant = 25 + 24 = 49
- x = (−5 ± 7) / 4
- x = 0.5 or x = −3

You can also solve by **factoring** or **completing the square**. Which method would you like to explore?`,

                'pythagorean': `**The Pythagorean Theorem**

In a right triangle: **a² + b² = c²**

Where **c** is the hypotenuse (longest side, opposite the right angle).

### Example
If a = 3 and b = 4:
- c² = 9 + 16 = 25
- c = 5

### Common Pythagorean Triples
| a | b | c |
|---|---|---|
| 3 | 4 | 5 |
| 5 | 12 | 13 |
| 8 | 15 | 17 |
| 7 | 24 | 25 |

This theorem is fundamental in geometry, physics, engineering, and computer graphics. Want to try solving a problem?`,
                'default': `I'd love to help with math! Here's what I can assist you with:

- **Algebra**: Equations, inequalities, polynomials
- **Calculus**: Derivatives, integrals, limits
- **Geometry**: Areas, volumes, theorems
- **Trigonometry**: Sine, cosine, tangent, identities
- **Statistics**: Mean, median, standard deviation, probability

Just ask me a specific question and I'll break it down step by step!`
            }
        },

        // ---- SCIENCE ----
        science: {
            keywords: ['science', 'physics', 'chemistry', 'biology', 'atom', 'molecule', 'cell', 'dna', 'rna', 'evolution', 'gravity', 'force', 'energy', 'motion', 'newton', 'einstein', 'relativity', 'quantum', 'electron', 'proton', 'neutron', 'periodic table', 'element', 'compound', 'reaction', 'acid', 'base', 'photosynthesis', 'respiration', 'ecosystem', 'organism', 'genetics', 'mitosis', 'meiosis', 'momentum', 'velocity', 'acceleration', 'wave', 'light', 'sound', 'thermodynamics', 'entropy', 'electric', 'magnetic', 'nuclear'],
            responses: {
                'photosynthesis': `**Photosynthesis** — How plants convert sunlight into food.

### The Equation
**6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂**

### Two Main Stages

**1. Light-Dependent Reactions** (in thylakoid membranes)
- Absorb sunlight using chlorophyll
- Split water molecules (H₂O → H⁺ + O₂)
- Produce ATP and NADPH

**2. Calvin Cycle / Light-Independent** (in stroma)
- Uses ATP and NADPH from stage 1
- Fixes CO₂ into glucose (C₆H₁₂O₆)
- Doesn't directly need light

### Key Facts
- Chlorophyll absorbs red and blue light, reflects green (that's why leaves are green!)
- Plants produce the oxygen we breathe as a byproduct
- It's the foundation of most food chains on Earth

Would you like to dive deeper into either stage?`,

                'newton': `**Newton's Three Laws of Motion**

### First Law — Inertia
> An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net external force.

*Example*: A book on a table won't move unless pushed.

### Second Law — F = ma
> Force equals mass times acceleration.

| If you... | Then... |
|-----------|---------|
| Double the force | Double the acceleration |
| Double the mass | Half the acceleration |

### Third Law — Action & Reaction
> For every action, there is an equal and opposite reaction.

*Example*: When you push against a wall, the wall pushes back with equal force.

These three laws form the foundation of classical mechanics and are essential for understanding everything from sports to space travel!`,

                'cell': `**The Cell** — The basic unit of life.

### Two Main Types

**Prokaryotic** (bacteria)
- No nucleus
- Simple structure
- Usually smaller

**Eukaryotic** (animals, plants, fungi)
- Has a nucleus
- Complex organelles
- Usually larger

### Key Organelles
| Organelle | Function |
|-----------|----------|
| Nucleus | Contains DNA, controls cell |
| Mitochondria | Energy production (ATP) |
| Ribosome | Protein synthesis |
| ER (Endoplasmic Reticulum) | Transport & processing |
| Golgi Apparatus | Package & ship proteins |
| Cell Membrane | Controls what enters/exits |
| Chloroplast | Photosynthesis (plants only) |
| Cell Wall | Structure (plants only) |

Want to learn more about any specific organelle or process?`,
                'default': `Science is fascinating! I can help with:

- **Physics**: Forces, energy, waves, electricity, quantum mechanics
- **Chemistry**: Elements, reactions, bonding, acids & bases
- **Biology**: Cells, DNA, evolution, ecology, human body
- **Earth Science**: Geology, weather, climate, space

What topic are you curious about?`
            }
        },

        // ---- PROGRAMMING ----
        coding: {
            keywords: ['code', 'coding', 'programming', 'python', 'javascript', 'java', 'html', 'css', 'function', 'variable', 'loop', 'array', 'string', 'algorithm', 'data structure', 'class', 'object', 'api', 'debug', 'error', 'syntax', 'compile', 'runtime', 'database', 'sql', 'git', 'react', 'node', 'web', 'app', 'software', 'compiler', 'recursion', 'sort', 'search', 'binary', 'stack', 'queue', 'linked list', 'tree', 'graph', 'hash', 'framework', 'library', 'typescript', 'c++', 'rust', 'golang'],
            responses: {
                'python': `**Python** — A versatile, beginner-friendly programming language.

### Hello World
\`\`\`python
print("Hello, World!")
\`\`\`

### Key Concepts

**Variables & Types**
\`\`\`python
name = "Alice"        # String
age = 20              # Integer
gpa = 3.8             # Float
is_student = True     # Boolean
\`\`\`

**Lists & Loops**
\`\`\`python
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(f"I like {fruit}")
\`\`\`

**Functions**
\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
\`\`\`

**List Comprehension**
\`\`\`python
squares = [x**2 for x in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
\`\`\`

Python is great for web development, data science, AI/ML, automation, and more. What would you like to build?`,

                'fibonacci': `**Fibonacci Sequence** — Each number is the sum of the two before it.

**Sequence**: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...

### Python Implementation

**Iterative (Efficient)**
\`\`\`python
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))
# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

**Recursive (Elegant but slower)**
\`\`\`python
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)
\`\`\`

**With Memoization (Best of both)**
\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)
\`\`\`

The iterative version is O(n) time and O(1) space — generally the best approach. Want me to explain Big O notation?`,

                'javascript': `**JavaScript** — The language of the web.

### Basics
\`\`\`javascript
// Variables
const name = "Alice";
let age = 20;

// Functions
const greet = (name) => \`Hello, \${name}!\`;

// Arrays
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

// Objects
const student = {
  name: "Alice",
  grade: "A",
  subjects: ["Math", "Science"]
};
\`\`\`

### Modern Features
\`\`\`javascript
// Destructuring
const { name, grade } = student;

// Async/Await
const fetchData = async () => {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
};

// Optional Chaining
const city = user?.address?.city ?? "Unknown";
\`\`\`

JavaScript runs in browsers and servers (Node.js). Would you like to learn about a specific concept?`,
                'default': `I can help with programming! Here are some topics:

- **Languages**: Python, JavaScript, Java, C++, and more
- **Concepts**: Variables, loops, functions, OOP, algorithms
- **Data Structures**: Arrays, stacks, queues, trees, graphs
- **Web Development**: HTML, CSS, React, Node.js
- **Problem Solving**: Algorithm design, debugging, optimization

What would you like to code or learn about?`
            }
        },

        // ---- HISTORY ----
        history: {
            keywords: ['history', 'war', 'revolution', 'ancient', 'medieval', 'civilization', 'empire', 'dynasty', 'king', 'queen', 'president', 'independence', 'colonial', 'world war', 'cold war', 'renaissance', 'industrial', 'french revolution', 'american', 'roman', 'greek', 'egyptian', 'mogul', 'mughal', 'british', 'constitution', 'democracy', 'republic'],
            responses: {
                'world war': `**World War II (1939–1945)**

### Key Facts
- **Duration**: September 1, 1939 – September 2, 1945
- **Sides**: Allied Powers vs. Axis Powers
- **Casualties**: Estimated 70-85 million people

### The Two Sides

**Allied Powers**: USA, UK, Soviet Union, France, China
**Axis Powers**: Germany, Italy, Japan

### Major Events
| Year | Event |
|------|-------|
| 1939 | Germany invades Poland |
| 1940 | Fall of France; Battle of Britain |
| 1941 | Operation Barbarossa; Pearl Harbor attack |
| 1942 | Battle of Stalingrad begins |
| 1944 | D-Day (Normandy landings) |
| 1945 | Fall of Berlin; Atomic bombs; Japan surrenders |

### Key Consequences
- Formation of the United Nations
- Beginning of the Cold War
- Decolonization movements worldwide
- Universal Declaration of Human Rights (1948)

Would you like to explore any specific battle, leader, or aspect of the war?`,
                'default': `History helps us understand the present! I can discuss:

- **Ancient Civilizations**: Egypt, Greece, Rome, Mesopotamia, India, China
- **Medieval Period**: Feudalism, Crusades, Byzantine Empire
- **Modern History**: Renaissance, Revolutions, World Wars, Cold War
- **Regional History**: American, European, Asian, African, Indian

What period or topic interests you?`
            }
        },

        // ---- ENGLISH & WRITING ----
        english: {
            keywords: ['english', 'grammar', 'essay', 'writing', 'literature', 'poem', 'novel', 'shakespeare', 'vocabulary', 'sentence', 'paragraph', 'thesis', 'argument', 'narrative', 'persuasive', 'descriptive', 'metaphor', 'simile', 'alliteration', 'rhyme', 'prose', 'fiction', 'non-fiction', 'character', 'plot', 'theme', 'symbolism', 'irony', 'tone', 'voice', 'punctuation', 'spelling', 'synonym', 'antonym', 'parts of speech', 'noun', 'verb', 'adjective', 'adverb', 'preposition'],
            responses: {
                'essay': `**How to Write a Great Essay**

### Structure

**1. Introduction**
- Hook (engaging opening sentence)
- Background context
- **Thesis statement** (your main argument)

**2. Body Paragraphs** (typically 3)
Each paragraph should have:
- Topic sentence
- Evidence / examples
- Analysis / explanation
- Transition to next point

**3. Conclusion**
- Restate thesis (in new words)
- Summarize key points
- Final thought or call to action

### Tips for Strong Writing
- Use **active voice** ("The dog chased the cat" not "The cat was chased by the dog")
- Vary sentence length for rhythm
- Support claims with **specific evidence**
- Avoid filler words ("very", "really", "basically")
- Proofread carefully!

Would you like help with a specific type of essay, or want me to review something you've written?`,
                'default': `I can help with English and writing! Topics include:

- **Grammar**: Parts of speech, sentence structure, punctuation
- **Writing**: Essays, creative writing, persuasive writing
- **Literature**: Analysis, themes, literary devices
- **Vocabulary**: Word meanings, synonyms, usage

What do you need help with?`
            }
        },

        // ---- STUDY TIPS ----
        study: {
            keywords: ['study', 'learn', 'memorize', 'remember', 'exam', 'test', 'revision', 'focus', 'concentration', 'motivation', 'procrastination', 'notes', 'flashcard', 'technique', 'method', 'pomodoro', 'spaced repetition', 'active recall', 'time management', 'homework', 'assignment', 'project'],
            responses: {
                'default': `**Science-Backed Study Techniques**

### The Top 5 Methods

**1. Active Recall**
- Test yourself instead of re-reading
- Close your book and write what you remember
- Use flashcards

**2. Spaced Repetition**
- Review material at increasing intervals
- Day 1 → Day 3 → Day 7 → Day 14 → Day 30
- Apps like Anki automate this

**3. Pomodoro Technique**
- Study for 25 minutes
- Take a 5-minute break
- After 4 rounds, take a 15-30 min break

**4. Feynman Technique**
- Pick a concept
- Explain it as if teaching a child
- Identify gaps in your understanding
- Review and simplify

**5. Interleaving**
- Mix different topics in one session
- Better than studying one subject for hours

### Quick Wins
- Study in a consistent location
- Get 7-9 hours of sleep (memory consolidation!)
- Exercise before studying (boosts focus)
- Teach what you learn to someone else

What specific challenge are you facing with your studies?`
            }
        }
    };

    // General responses for greetings and common queries
    const generalResponses = {
        greetings: {
            patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'what\'s up', 'greetings'],
            response: `Hey there! 👋 Great to see you!

I'm **Nexus**, your personal study assistant. I'm here to help you learn, understand, and ace your subjects.

Here's what I can help with:
- 📐 **Math** — equations, calculus, geometry, and more
- 🔬 **Science** — physics, chemistry, biology
- 💻 **Coding** — Python, JavaScript, algorithms
- 📚 **History** — ancient to modern
- ✍️ **English** — grammar, essays, literature
- 🧠 **Study Tips** — proven techniques for better learning

Just ask me anything — no question is too simple or too complex!`
        },
        thanks: {
            patterns: ['thanks', 'thank you', 'thx', 'ty', 'appreciate', 'helpful'],
            response: `You're welcome! I'm always here when you need help. Keep up the great work with your studies! 💪

Is there anything else you'd like to learn about?`
        },
        howAreYou: {
            patterns: ['how are you', 'how do you feel', 'are you okay', 'how\'s it going'],
            response: `I'm doing great, thanks for asking! I'm always ready and excited to help you learn something new.

What's on your mind today? Any subject you're working on?`
        },
        whoAreYou: {
            patterns: ['who are you', 'what are you', 'what can you do', 'tell me about yourself', 'your name', 'introduce yourself'],
            response: `I'm **Nexus** — your personal AI study assistant!

### What I Can Do
- Answer questions across all subjects
- Explain complex topics in simple terms
- Help with homework and assignments
- Solve math problems step by step
- Help you write and improve essays
- Teach programming concepts with code examples
- Share proven study techniques
- Quiz you on any topic

### How to Get the Best Results
- Be specific with your questions
- Tell me your level (beginner, intermediate, advanced)
- Ask follow-up questions — I love going deeper!
- Try the voice button 🎤 to talk to me

What would you like to learn about today?`
        },
        joke: {
            patterns: ['joke', 'funny', 'make me laugh', 'tell me something funny'],
            response: `Here's one for you:

> Why do programmers prefer dark mode?
> Because light attracts bugs! 🪲

And a science one:

> I told a chemistry joke once... but there was no reaction. 😄

Want to get back to studying, or would you like another one?`
        },
        quiz: {
            patterns: ['quiz me', 'test me', 'give me a question', 'practice question'],
            response: `Great idea! Let me quiz you. Pick a subject:

**1. Math** — "What is the derivative of sin(x)?"
**2. Science** — "What organelle is the powerhouse of the cell?"
**3. History** — "In what year did World War II end?"
**4. English** — "What is the difference between 'affect' and 'effect'?"
**5. Coding** — "What does 'O(n)' mean in Big O notation?"

Just pick a number or tell me which subject you want to be quizzed on, and I'll generate questions for you!`
        }
    };

    function findBestResponse(userMessage) {
        const msg = userMessage.toLowerCase().trim();

        // Check general responses first
        for (const [, data] of Object.entries(generalResponses)) {
            if (data.patterns.some(p => msg.includes(p))) {
                return data.response;
            }
        }

        // Check knowledge base topics
        let bestMatch = null;
        let bestScore = 0;

        for (const [, topic] of Object.entries(knowledge)) {
            const matchedKeywords = topic.keywords.filter(kw => msg.includes(kw));
            const score = matchedKeywords.length;

            if (score > bestScore) {
                bestScore = score;
                bestMatch = topic;
            }
        }

        if (bestMatch && bestScore > 0) {
            // Find specific sub-response
            for (const [key, response] of Object.entries(bestMatch.responses)) {
                if (key !== 'default' && msg.includes(key)) {
                    return response;
                }
            }
            return bestMatch.responses.default;
        }

        // Fallback response
        return `That's an interesting question! While I have a comprehensive built-in knowledge base, I might not have the specific answer you're looking for right now.

Here's what I suggest:
- Try rephrasing your question with specific keywords
- Ask about a specific subject: **math, science, coding, history, english**
- Try asking me to **explain** a concept, **solve** a problem, or **quiz** you

**Pro tip**: You can connect me to the Gemini AI in Settings for unlimited knowledge on any topic!

What else can I help you with?`;
    }

    // Simulate streaming by yielding words
    async function* streamResponse(userMessage) {
        const response = findBestResponse(userMessage);
        const words = response.split(/(\s+)/); // Split keeping whitespace

        for (const word of words) {
            yield word;
            // Random delay to feel natural
            await new Promise(r => setTimeout(r, 15 + Math.random() * 25));
        }
    }

    return {
        findBestResponse,
        streamResponse
    };
})();
