/* NEXUS v4.0 — RAG Pipeline
   Client-side Retrieval-Augmented Generation.
   Indexes a knowledge base, scores relevance via TF-IDF-like matching,
   and injects top-K chunks into the AI system prompt for grounded responses.
*/
const RAG = (() => {
    // ---- Knowledge Chunks (each chunk is a retrievable unit) ----
    const chunks = [
        // ======== DSA / CODING ========
        { id: 'dsa-arrays', domain: 'dsa', tags: ['array', 'arrays', 'two pointer', 'sliding window', 'kadane', 'subarray'],
          content: `Arrays: Contiguous memory. O(1) access, O(n) insert/delete. Key patterns: Two Pointer (sorted arrays, pair sum), Sliding Window (max subarray, min window substring), Prefix Sum (range queries), Kadane's Algorithm (max subarray sum in O(n)). Common problems: Two Sum, Best Time to Buy/Sell Stock, Container With Most Water, 3Sum, Product of Array Except Self, Maximum Subarray.` },

        { id: 'dsa-linked-list', domain: 'dsa', tags: ['linked list', 'linkedlist', 'node', 'pointer', 'fast slow'],
          content: `Linked Lists: Sequential nodes with pointers. Singly (next only), Doubly (prev+next), Circular. O(1) insert/delete at known position, O(n) search. Key patterns: Fast-Slow Pointer (cycle detection, middle element), Dummy Head Node (simplifies edge cases), Reverse Linked List (iterative: prev/curr/next swap). Common problems: Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle, Remove Nth Node, LRU Cache, Add Two Numbers.` },

        { id: 'dsa-trees', domain: 'dsa', tags: ['tree', 'binary tree', 'bst', 'binary search tree', 'traversal', 'dfs', 'bfs', 'inorder'],
          content: `Trees: Hierarchical data. Binary Tree: max 2 children. BST: left < root < right, O(log n) search/insert. Traversals: Inorder (left-root-right, gives sorted BST), Preorder (root-left-right, serialize), Postorder (left-right-root, delete), Level-order (BFS with queue). Key patterns: Recursive DFS, Iterative with Stack, Level-order BFS with Queue. Common problems: Max Depth, Invert Binary Tree, Validate BST, Lowest Common Ancestor, Serialize/Deserialize, Path Sum.` },

        { id: 'dsa-dp', domain: 'dsa', tags: ['dynamic programming', 'dp', 'memoization', 'tabulation', 'knapsack', 'fibonacci'],
          content: `Dynamic Programming: Solve by breaking into overlapping subproblems. Two approaches: Top-Down (recursion + memoization) and Bottom-Up (tabulation). Steps: 1) Define state, 2) Write recurrence relation, 3) Set base cases, 4) Determine order. DP patterns: 0/1 Knapsack, Unbounded Knapsack, Fibonacci-type, LCS/LIS, Matrix Chain, Interval DP, Bitmask DP. Common problems: Climbing Stairs, Coin Change, Longest Common Subsequence, Edit Distance, House Robber, Unique Paths, Word Break.` },

        { id: 'dsa-graphs', domain: 'dsa', tags: ['graph', 'graphs', 'bfs', 'dfs', 'dijkstra', 'topological', 'adjacency', 'shortest path'],
          content: `Graphs: Nodes + Edges. Representations: Adjacency List (sparse, O(V+E) space), Adjacency Matrix (dense, O(V²) space). BFS (shortest path unweighted, level-order), DFS (path finding, cycle detection, connected components). Dijkstra (shortest path weighted, O(E log V) with min-heap). Topological Sort (DAG ordering, course schedule). Union-Find (connected components, cycle detection). Common problems: Number of Islands, Clone Graph, Course Schedule, Word Ladder, Network Delay Time.` },

        { id: 'dsa-complexity', domain: 'dsa', tags: ['time complexity', 'space complexity', 'big o', 'complexity', 'o(n)', 'o(log n)'],
          content: `Time Complexity: O(1) constant < O(log n) binary search < O(n) linear < O(n log n) merge sort < O(n²) nested loops < O(2^n) recursion subsets < O(n!) permutations. Space Complexity: Auxiliary space used. Recursion uses O(depth) stack space. Amortized analysis: average over sequence (e.g., dynamic array append is O(1) amortized). For interviews: always state both time and space complexity, optimize from brute force.` },

        { id: 'dsa-sorting', domain: 'dsa', tags: ['sort', 'sorting', 'merge sort', 'quick sort', 'heap sort', 'bubble sort'],
          content: `Sorting Algorithms: Bubble Sort O(n²), Selection Sort O(n²), Insertion Sort O(n²) but good for nearly sorted. Merge Sort O(n log n) stable, divide-and-conquer. Quick Sort O(n log n) avg, O(n²) worst, in-place. Heap Sort O(n log n) in-place. Counting Sort O(n+k) for small range integers. Radix Sort O(d*(n+k)). For interviews: know Merge Sort and Quick Sort implementations. Python uses Timsort (hybrid merge+insertion, stable O(n log n)).` },

        { id: 'dsa-strings', domain: 'dsa', tags: ['string', 'strings', 'substring', 'anagram', 'palindrome', 'kmp'],
          content: `String Algorithms: Key patterns: Sliding Window (longest substring without repeating), Two Pointer (palindrome check), HashMap Frequency (anagram detection, group anagrams). KMP algorithm for O(n+m) pattern matching. Trie for prefix search. Common problems: Longest Substring Without Repeating Characters, Valid Anagram, Group Anagrams, Longest Palindromic Substring, String to Integer, Valid Parentheses.` },

        { id: 'dsa-heap', domain: 'dsa', tags: ['heap', 'priority queue', 'min heap', 'max heap', 'top k'],
          content: `Heaps & Priority Queues: Binary Heap: complete binary tree. Min-Heap: parent ≤ children. Max-Heap: parent ≥ children. Operations: insert O(log n), extract-min/max O(log n), peek O(1). Key pattern: Top-K problems (use min-heap of size K for top-K largest). Heap Sort: build max-heap then extract. Common problems: Kth Largest Element, Merge K Sorted Lists, Find Median from Data Stream, Top K Frequent Elements.` },

        { id: 'dsa-backtracking', domain: 'dsa', tags: ['backtracking', 'recursion', 'permutation', 'combination', 'subset', 'n-queens'],
          content: `Backtracking: Systematic search through all possible solutions. Template: choose → explore → unchoose. Pruning: skip invalid branches early. Used for: Permutations, Combinations, Subsets, N-Queens, Sudoku Solver, Word Search, Letter Combinations. Time complexity usually exponential but pruning makes it practical. Key trick: sort input first to easily skip duplicates.` },

        // ======== SYSTEM DESIGN ========
        { id: 'sd-basics', domain: 'system-design', tags: ['system design', 'scalability', 'architecture', 'distributed'],
          content: `System Design Framework: 1) Clarify requirements (functional + non-functional), 2) Estimate scale (QPS, storage, bandwidth), 3) Define API, 4) High-level design (draw components), 5) Deep dive (database schema, algorithms), 6) Identify bottlenecks. Key concepts: Horizontal vs Vertical scaling, Load Balancers (Round Robin, Least Connections, IP Hash), Caching (Redis/Memcached, CDN, browser), Database sharding, Replication (master-slave), Consistent Hashing.` },

        { id: 'sd-databases', domain: 'system-design', tags: ['database', 'sql', 'nosql', 'sharding', 'replication', 'acid', 'cap theorem'],
          content: `Databases: SQL (PostgreSQL, MySQL): ACID compliance, joins, structured data, good for transactions. NoSQL: Document (MongoDB), Key-Value (Redis), Column (Cassandra), Graph (Neo4j). CAP Theorem: choose 2 of Consistency, Availability, Partition tolerance. Sharding strategies: Range-based, Hash-based, Directory-based. Indexing: B-Tree (range queries), Hash (exact match). Read replicas for read-heavy workloads. Use SQL for complex queries/transactions, NoSQL for high scale/flexible schema.` },

        { id: 'sd-caching', domain: 'system-design', tags: ['cache', 'caching', 'redis', 'cdn', 'memcached', 'cache invalidation'],
          content: `Caching Strategies: Cache-Aside (lazy loading): app checks cache first, loads from DB on miss. Write-Through: write to cache and DB simultaneously. Write-Behind: write to cache, async write to DB. Cache eviction: LRU (most common), LFU, TTL. Redis: in-memory, supports strings/hashes/lists/sets/sorted sets. CDN: cache static content at edge. Cache invalidation is the hardest problem. Cache stampede: use locks or probabilistic expiry.` },

        { id: 'sd-url-shortener', domain: 'system-design', tags: ['url shortener', 'tinyurl', 'short url', 'hash', 'base62'],
          content: `Design URL Shortener (TinyURL): Requirements: shorten URLs, redirect, analytics. Scale: 100M URLs/day. API: POST /shorten {longUrl} → shortUrl, GET /{shortCode} → redirect. Approach: Base62 encode auto-increment ID or use hash (MD5/SHA256 first 7 chars). Storage: NoSQL (DynamoDB) or SQL with index on shortCode. Caching: Redis for hot URLs. Rate limiting per user. Analytics: async write to analytics DB.` },

        { id: 'sd-chat-system', domain: 'system-design', tags: ['chat', 'messaging', 'websocket', 'whatsapp', 'slack'],
          content: `Design Chat System: Requirements: 1:1 chat, group chat, online status, read receipts. Protocol: WebSocket for real-time bidirectional. Architecture: Chat servers (stateful WebSocket connections), Message Queue (Kafka) for async delivery, User Service, Group Service. Storage: Messages in Cassandra (write-heavy), User data in MySQL. Message flow: Sender → WebSocket Server → Message Queue → Recipient's WebSocket Server. Offline: store in queue, deliver on reconnect. Group chat: fan-out on write vs fan-out on read.` },

        // ======== INTERVIEW PREP ========
        { id: 'interview-behavioral', domain: 'interview', tags: ['behavioral', 'star method', 'tell me about yourself', 'weakness', 'strength'],
          content: `Behavioral Interview: Use STAR method: Situation (context), Task (your responsibility), Action (what you did), Result (outcome with metrics). Common questions: "Tell me about yourself" (present→past→future, 2 min), "Why this company?" (research + align values), "Biggest weakness?" (genuine weakness + improvement steps), "Conflict with teammate?" (show empathy + resolution), "Failed project?" (show learning + growth). Prepare 5-6 stories that cover leadership, teamwork, failure, conflict, initiative.` },

        { id: 'interview-hr', domain: 'interview', tags: ['hr round', 'hr interview', 'salary negotiation', 'why should we hire'],
          content: `HR Interview: "Why should we hire you?": Match 3 of your strengths to job requirements with examples. "Where do you see yourself in 5 years?": Show ambition aligned with company growth path. "Salary expectations?": Research market rate (Glassdoor, Levels.fyi), give range 10-20% above current. "Why leaving current job?": Focus on growth/opportunity, never badmouth. "Do you have questions?": Always ask about team culture, growth path, current challenges, tech stack decisions.` },

        { id: 'interview-dsa-tips', domain: 'interview', tags: ['coding interview', 'dsa interview', 'leetcode', 'problem solving', 'technical interview'],
          content: `DSA Interview Tips: 1) Clarify: ask about constraints, edge cases, input size. 2) Brute force first, then optimize. 3) Think aloud — interviewers want to see your process. 4) Test with examples before coding. 5) Write clean code with meaningful variable names. 6) Analyze time and space complexity. 7) Handle edge cases (empty input, single element, duplicates). Practice plan: Easy (2 weeks) → Medium (4 weeks) → Hard (2 weeks). Focus on patterns not problems. Do 150-200 problems across all categories.` },

        // ======== CAREER DATA ========
        { id: 'career-sde', domain: 'career', tags: ['software engineer', 'sde', 'developer', 'software developer', 'swe'],
          content: `Software Engineer Career Path: Levels: SDE-1 (0-2 yrs, ₹8-25L) → SDE-2 (2-5 yrs, ₹20-50L) → Senior SDE (5-8 yrs, ₹40-80L) → Staff/Principal (8+ yrs, ₹70L-2Cr). Skills needed: DSA, System Design, 1-2 languages (Java/Python/Go), databases, cloud (AWS/GCP). Top companies India: Google, Microsoft, Amazon, Flipkart, Atlassian, Uber, Goldman Sachs. Prep timeline: 3-6 months focused DSA + System Design. Portfolio: 3-5 projects on GitHub. Most in-demand 2025: Go, Rust, System Design, distributed systems, ML/AI integration.` },

        { id: 'career-frontend', domain: 'career', tags: ['frontend', 'front-end', 'react', 'ui developer', 'web developer'],
          content: `Frontend Developer Path: Junior (₹6-15L) → Mid (₹15-35L) → Senior (₹35-60L) → Staff/Architect (₹50L-1.5Cr). Core skills: HTML/CSS, JavaScript (ES6+), React/Next.js or Vue/Nuxt. Advanced: TypeScript, state management (Zustand/Redux), testing (Jest/Playwright), performance optimization, accessibility (WCAG), design systems. Tools: Webpack/Vite, Git, Figma, Chrome DevTools. Hot in 2025: Server Components, Edge Computing, AI-powered UI, micro-frontends. Interview focus: JS fundamentals, DOM manipulation, React hooks, CSS layout, system design for frontend.` },

        { id: 'career-backend', domain: 'career', tags: ['backend', 'back-end', 'server', 'api', 'microservices'],
          content: `Backend Developer Path: Junior (₹8-18L) → Mid (₹18-40L) → Senior (₹40-70L) → Architect (₹60L-1.8Cr). Core skills: Node.js/Python/Java/Go, REST APIs, databases (PostgreSQL, MongoDB, Redis), authentication (JWT, OAuth). Advanced: Microservices, message queues (Kafka, RabbitMQ), containerization (Docker, Kubernetes), CI/CD, monitoring (Datadog, Grafana). System Design is critical for senior roles. Hot in 2025: Go for performance, Rust for systems, serverless, event-driven architecture. Interview: API design, database schema, system design, concurrency.` },

        { id: 'career-data-science', domain: 'career', tags: ['data science', 'data scientist', 'machine learning', 'ml', 'ai', 'deep learning'],
          content: `Data Science/ML Path: Analyst (₹6-15L) → Data Scientist (₹15-35L) → Senior DS (₹35-60L) → ML Lead (₹50L-1.5Cr). Core skills: Python, SQL, Statistics, Probability, Linear Algebra. ML: Scikit-learn, supervised/unsupervised learning, feature engineering, model evaluation. Deep Learning: PyTorch/TensorFlow, CNNs, RNNs, Transformers. MLOps: MLflow, model deployment, A/B testing. Hot in 2025: LLMs/GenAI, RAG systems, multimodal AI, AI agents. Portfolio: Kaggle competitions, end-to-end projects with deployment.` },

        { id: 'career-devops', domain: 'career', tags: ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'ci/cd', 'sre'],
          content: `DevOps/SRE Path: Junior (₹8-18L) → Mid (₹18-40L) → Senior (₹40-65L) → Principal (₹60L-1.5Cr). Core: Linux, networking, scripting (Bash/Python), Git. Infrastructure: AWS/GCP/Azure, Terraform, CloudFormation. Containers: Docker, Kubernetes, Helm. CI/CD: Jenkins, GitHub Actions, ArgoCD. Monitoring: Prometheus, Grafana, ELK stack, PagerDuty. SRE: SLOs/SLIs/SLAs, incident management, chaos engineering. Certifications: AWS SAA, CKA, Terraform Associate. Hot 2025: Platform Engineering, GitOps, FinOps, AI for Ops.` },

        // ======== COMPANY PREP ========
        { id: 'company-google', domain: 'company', tags: ['google', 'google interview', 'googleyness'],
          content: `Google Interview Prep: Process: Recruiter screen → Phone screen (1 coding) → Onsite (4-5 rounds: 2 coding, 1 system design, 1 behavioral/Googleyness, 1 team match). Coding: Hard LeetCode, focus on optimal solutions. System Design: Design Gmail, Google Maps, YouTube. Googleyness: Leadership, humility, collaboration. Tips: Think aloud, ask clarifying questions, optimize solutions. Hiring committee reviews all feedback. Levels: L3 (entry) → L4 (SDE-2) → L5 (Senior) → L6 (Staff). Salary L4 India: ₹30-45L, L5: ₹50-80L.` },

        { id: 'company-microsoft', domain: 'company', tags: ['microsoft', 'microsoft interview'],
          content: `Microsoft Interview Prep: Process: HR screen → 3-4 technical rounds + 1 "as-appropriate" (hiring manager). Coding rounds: Medium-Hard LeetCode, often array/string/tree problems. System Design for SDE-2+. Behavioral: Growth mindset valued highly. Tips: Code cleanly, consider edge cases, discuss tradeoffs. Levels: SDE (59-60) → SDE-2 (61-62) → Senior (63-64) → Principal (65+). Salary SDE-2 India: ₹30-45L. Culture: Growth mindset, learn-it-all vs know-it-all. Strong work-life balance.` },

        { id: 'company-amazon', domain: 'company', tags: ['amazon', 'amazon interview', 'leadership principles', 'lp'],
          content: `Amazon Interview Prep: Process: OA (Online Assessment, 2 coding) → Phone screen → Onsite (4 rounds: coding + LP stories). Leadership Principles are CRITICAL: Customer Obsession, Ownership, Bias for Action, Earn Trust, Dive Deep, Deliver Results. Every behavioral answer must map to an LP. STAR format mandatory. Coding: Medium LeetCode, often graph/DP problems. System Design for SDE-2+: Design Amazon shopping cart, Prime Video. Bar Raiser round: senior interviewer from different team. Levels: SDE-1 → SDE-2 → SDE-3. Salary SDE-2 India: ₹25-40L + RSUs.` },

        // ======== RESUME ========
        { id: 'resume-tips', domain: 'resume', tags: ['resume', 'cv', 'ats', 'resume tips', 'resume format'],
          content: `Resume Best Practices: Format: 1 page for <5 yrs experience, clean layout, no fancy templates (ATS can't parse). Sections: Contact → Summary (2 lines) → Skills → Experience → Projects → Education. Use action verbs: Built, Designed, Implemented, Optimized, Reduced, Increased. Quantify results: "Reduced API latency by 40%", "Served 10K+ users". ATS tips: Use standard headings, include keywords from job description, PDF format, no tables/columns/graphics. Skills section: list relevant technologies, frameworks, tools. Projects: include live links and GitHub repos.` },

        // ======== SALARY ========
        { id: 'salary-india', domain: 'salary', tags: ['salary', 'package', 'ctc', 'compensation', 'india salary'],
          content: `Tech Salaries India 2024-25 (CTC in LPA): Freshers: Service companies (TCS/Infosys/Wipro) ₹3.5-6L, Product companies ₹8-20L, FAANG/top startups ₹20-45L. 2-4 yrs: Product cos ₹15-35L, FAANG ₹30-55L. 5-8 yrs: Product cos ₹35-60L, FAANG ₹50-1Cr. 8+ yrs: Staff/Principal ₹70L-2.5Cr. Remote US companies: ₹40-80L for mid-level. Negotiation tips: Always negotiate, cite competing offers, focus on total comp (base+bonus+RSU), ask for sign-on bonus. Levels.fyi and Glassdoor are best references.` },
    ];

    // ---- Build inverted index for fast retrieval ----
    const invertedIndex = {};

    function buildIndex() {
        chunks.forEach((chunk, idx) => {
            // Index tags
            chunk.tags.forEach(tag => {
                const words = tag.toLowerCase().split(/\s+/);
                words.forEach(w => {
                    if (!invertedIndex[w]) invertedIndex[w] = new Set();
                    invertedIndex[w].add(idx);
                });
                // Also index full tag as a phrase
                const phrase = tag.toLowerCase();
                if (!invertedIndex[phrase]) invertedIndex[phrase] = new Set();
                invertedIndex[phrase].add(idx);
            });
            // Index content words (selective — only meaningful terms)
            const contentWords = chunk.content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
            const wordFreq = {};
            contentWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
            // Only index words that appear 2+ times (they're important to this chunk)
            Object.entries(wordFreq).forEach(([w, freq]) => {
                if (freq >= 2 && w.length > 3) {
                    if (!invertedIndex[w]) invertedIndex[w] = new Set();
                    invertedIndex[w].add(idx);
                }
            });
        });
    }

    // ---- Score a chunk against a query ----
    function scoreChunk(query, chunkIdx) {
        const chunk = chunks[chunkIdx];
        const qLower = query.toLowerCase();
        const qWords = qLower.split(/\s+/).filter(w => w.length > 2);
        let score = 0;

        // Tag match (highest weight)
        chunk.tags.forEach(tag => {
            if (qLower.includes(tag)) score += 5;
            // Partial tag match
            const tagWords = tag.split(/\s+/);
            tagWords.forEach(tw => {
                if (qWords.includes(tw)) score += 2;
            });
        });

        // Domain match
        if (qLower.includes(chunk.domain)) score += 3;

        // Content keyword overlap
        const contentLower = chunk.content.toLowerCase();
        qWords.forEach(w => {
            if (contentLower.includes(w)) score += 1;
        });

        return score;
    }

    // ---- Retrieve top-K relevant chunks ----
    function retrieve(query, topK = 3) {
        if (!Object.keys(invertedIndex).length) buildIndex();

        const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        // Get candidate chunks from inverted index
        const candidates = new Set();
        qWords.forEach(w => {
            if (invertedIndex[w]) {
                invertedIndex[w].forEach(idx => candidates.add(idx));
            }
        });
        // Also check multi-word phrases
        const qLower = query.toLowerCase();
        Object.entries(invertedIndex).forEach(([phrase, idxSet]) => {
            if (phrase.includes(' ') && qLower.includes(phrase)) {
                idxSet.forEach(idx => candidates.add(idx));
            }
        });

        if (!candidates.size) return [];

        // Score and rank
        const scored = [...candidates].map(idx => ({
            chunk: chunks[idx],
            score: scoreChunk(query, idx)
        })).filter(r => r.score >= 3) // Minimum relevance threshold
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);

        return scored;
    }

    // ---- Build context string for injection into system prompt ----
    function buildContext(query) {
        const results = retrieve(query, 3);
        if (!results.length) return '';

        const contextParts = results.map(r =>
            `[${r.chunk.domain.toUpperCase()}: ${r.chunk.id}]\n${r.chunk.content}`
        );

        return '\n\n[KNOWLEDGE BASE — Ground your response in this verified data. Cite specific facts, numbers, and recommendations from here. Do NOT contradict this data.]\n' + contextParts.join('\n\n');
    }

    // ---- Stats ----
    function getStats() {
        return {
            totalChunks: chunks.length,
            domains: [...new Set(chunks.map(c => c.domain))],
            indexSize: Object.keys(invertedIndex).length
        };
    }

    // Build index on load
    buildIndex();

    return { retrieve, buildContext, getStats, chunks };
})();
