import { SimulationResult, SimulationResultSchema } from "@/lib/schema";

/**
 * Hardcoded, high-quality fallback result.
 * This is an emergency safety net when AI calls fail or time out.
 * Validated strictly against SimulationResultSchema at module load time.
 */
export const FALLBACK_SIMULATION_RESULT: SimulationResult = {
  paths: [
    {
      title: "Software Engineer (Foundations & Systems)",
      summary: "Focus on procedural programming, algorithms, and core system architectures to build scalable desktop and backend software applications.",
      whyItFits: "Directly leverages your foundational coding mindset in Python and procedural background in C++ to transition into high-performance systems and software engineering.",
      fitScore: 72,
      fitReason: "Strong algorithmic potential and programming problem solving, though requires deep exposure to object-oriented patterns, version control, and data structures.",
      skillGaps: [
        {
          "skill": "Data Structures & Algorithms",
          "importance": "high",
          "currentLevel": 2,
          "targetLevel": 4
        },
        {
          "skill": "Object-Oriented Design & Testing",
          "importance": "high",
          "currentLevel": 1,
          "targetLevel": 4
        },
        {
          "skill": "Git & Collaborative Workflow",
          "importance": "medium",
          "currentLevel": 1,
          "targetLevel": 3
        },
        {
          "skill": "Linux CLI & System Tools",
          "importance": "medium",
          "currentLevel": 1,
          "targetLevel": 3
        }
      ],
      milestones: [
        {
          yearLabel: "Year 1 (Algorithms & CS Core)",
          goals: [
            "Complete 100 structured algorithmic problems covering arrays, trees, and graphs",
            "Write modular code with unit test suites"
          ],
          skillsToLearn: ["Data Structures", "Algorithms", "Unit Testing", "Git"]
        },
        {
          yearLabel: "Year 2 (Systems & Networks)",
          goals: [
            "Understand memory management, threading, and operating system concepts",
            "Build a multithreaded network utility"
          ],
          skillsToLearn: ["OS Fundamentals", "Networking Basics", "POSIX/Win32 APIs"]
        },
        {
          yearLabel: "Year 3 (Software Architecture)",
          goals: [
            "Contribute to open-source software and participate in tech hackathons",
            "Secure a summer software engineering internship"
          ],
          skillsToLearn: ["Design Patterns", "CI/CD", "Docker", "Database Integration"]
        },
        {
          yearLabel: "Year 4 (Career Launch)",
          goals: [
            "Complete a robust senior capstone software application",
            "Interview for full-time junior software engineer positions"
          ],
          skillsToLearn: ["System Design", "Microservices", "Cloud Deployments"]
        }
      ],
      projects: [
        {
          name: "CLI File Indexer & Search Tool",
          description: "Build a command-line utility that indexes directory trees, computes checksums, and performs fast inverted keyword search.",
          skillsPracticed: ["Algorithms", "File I/O", "Data Structures"],
          difficulty: "beginner",
          weeks: 3
        },
        {
          name: "Multithreaded Task Scheduler",
          description: "Implement a thread-safe task worker pool that executes scheduled background jobs with priorities and error logging.",
          skillsPracticed: ["Concurrency", "Data Structures", "Unit Testing"],
          difficulty: "intermediate",
          weeks: 5
        },
        {
          name: "Distributed Key-Value Store",
          description: "Create a persistent distributed in-memory key-value cache with socket communication and replication protocol.",
          skillsPracticed: ["Networking", "Distributed Systems", "Persistence"],
          difficulty: "advanced",
          weeks: 8
        }
      ],
      first30Days: [
        {
          week: 1,
          tasks: [
            "Set up a structured GitHub repository and practice feature branches and pull requests",
            "Solve 15 LeetCode Easy problems on arrays and hash tables",
            "Set up a unit testing framework and write automated tests for array sorting"
          ]
        },
        {
          week: 2,
          tasks: [
            "Study linked lists, stacks, and queues through custom class implementations",
            "Implement a memory-efficient queue and test for boundary conditions",
            "Build a command-line calculator evaluating reverse Polish notation"
          ]
        },
        {
          week: 3,
          tasks: [
            "Learn binary search trees and basic graph traversals (BFS and DFS)",
            "Begin architecture planning for the CLI File Indexer project",
            "Implement recursive directory traversal with robust error handling"
          ]
        },
        {
          week: 4,
          tasks: [
            "Complete inverted index data structure and keyword query engine",
            "Benchmark search retrieval times across 5,000 text files",
            "Publish completed project with comprehensive README and automated test report"
          ]
        }
      ]
    },
    {
      title: "Web Applications Developer",
      summary: "Create accessible, responsive web applications and full-stack services connecting user interfaces with database-backed APIs.",
      whyItFits: "Builds upon fundamental markup and logical programming skills to produce tangible, interactive web products with quick visual feedback.",
      fitScore: 64,
      fitReason: "Good initial aptitude for user-facing applications, but requires structured learning in modern JavaScript/TypeScript, UI frameworks, and relational databases.",
      skillGaps: [
        {
          "skill": "Modern JavaScript & TypeScript",
          "importance": "high",
          "currentLevel": 1,
          "targetLevel": 4
        },
        {
          "skill": "Frontend UI Frameworks (React)",
          "importance": "high",
          "currentLevel": 0,
          "targetLevel": 4
        },
        {
          "skill": "RESTful API Architecture",
          "importance": "high",
          "currentLevel": 1,
          "targetLevel": 3
        },
        {
          "skill": "Relational Databases (PostgreSQL)",
          "importance": "medium",
          "currentLevel": 0,
          "targetLevel": 3
        }
      ],
      milestones: [
        {
          yearLabel: "Year 1 (Web Fundamentals)",
          goals: [
            "Build responsive layouts using modern CSS Flexbox and Grid",
            "Master modern JavaScript async/await, DOM APIs, and fetch"
          ],
          skillsToLearn: ["Semantic HTML", "Modern CSS", "JavaScript ES6+", "Fetch API"]
        },
        {
          yearLabel: "Year 2 (Component Architectures)",
          goals: [
            "Build full TypeScript React single-page applications",
            "Create backend REST APIs with Node.js and SQLite/PostgreSQL"
          ],
          skillsToLearn: ["TypeScript", "React", "Node.js", "Express", "SQL"]
        },
        {
          yearLabel: "Year 3 (Production Full Stack)",
          goals: [
            "Deploy applications with Docker and automated CI/CD workflows",
            "Secure a summer web engineering internship"
          ],
          skillsToLearn: ["Next.js", "Docker", "Authentication", "Tailwind CSS"]
        },
        {
          yearLabel: "Year 4 (Full Stack Mastery)",
          goals: [
            "Build high-performance web applications with server-side rendering and caching",
            "Interview for full-time web developer roles"
          ],
          skillsToLearn: ["System Architecture", "Redis", "Security Best Practices"]
        }
      ],
      projects: [
        {
          name: "Responsive Interactive Course Tracker",
          description: "Design a clean, mobile-first academic schedule organizer using semantic HTML, modern CSS, and local storage persistence.",
          skillsPracticed: ["HTML", "CSS", "JavaScript DOM"],
          difficulty: "beginner",
          weeks: 3
        },
        {
          name: "Full-Stack Student Note Vault",
          description: "Create a markdown note management application using React, TypeScript, and an Express backend with authentication.",
          skillsPracticed: ["TypeScript", "React", "Express", "SQL"],
          difficulty: "intermediate",
          weeks: 5
        },
        {
          name: "Real-Time Collaboration Canvas",
          description: "Develop a multi-user collaborative whiteboard with WebSockets, optimistic UI updates, and image asset uploads.",
          skillsPracticed: ["WebSockets", "Next.js", "TypeScript", "Tailwind CSS"],
          difficulty: "advanced",
          weeks: 7
        }
      ],
      first30Days: [
        {
          week: 1,
          tasks: [
            "Build 3 mobile-responsive layout prototypes using modern CSS Flexbox and Grid",
            "Learn git command line basics and push prototypes to GitHub Pages",
            "Review browser DevTools for inspecting network calls and styling"
          ]
        },
        {
          week: 2,
          tasks: [
            "Master ES6 fundamentals: modules, arrow functions, destructuring, and array methods",
            "Create an interactive task tracker manipulating DOM nodes dynamically",
            "Add localStorage persistence so user data survives page reloads"
          ]
        },
        {
          week: 3,
          tasks: [
            "Learn asynchronous JavaScript using Promises and async/await syntax",
            "Build a public API weather dashboard handling loading and error states cleanly",
            "Structure components into clean modular JavaScript files"
          ]
        },
        {
          week: 4,
          tasks: [
            "Initialize a React application with Vite and TypeScript",
            "Convert the weather dashboard into typed React functional components with state hooks",
            "Document code structure and publish live application preview link"
          ]
        }
      ]
    },
    {
      title: "Data & Analytics Engineer",
      summary: "Transform raw organizational datasets into structured, reliable pipelines that power reporting dashboards and analytics.",
      whyItFits: "Applies algorithmic discipline from C++ and Python data scripting to build high-volume data pipelines that power modern Web applications and AI systems.",
      fitScore: 54,
      fitReason: "Solid logical reasoning and programming basics, but requires learning relational schema design, SQL querying, and automated data pipelines.",
      skillGaps: [
        {
          "skill": "Relational SQL & Schema Design",
          "importance": "high",
          "currentLevel": 1,
          "targetLevel": 4
        },
        {
          "skill": "Python Data Manipulation (Pandas)",
          "importance": "high",
          "currentLevel": 1,
          "targetLevel": 4
        },
        {
          "skill": "ETL Pipeline Design",
          "importance": "medium",
          "currentLevel": 0,
          "targetLevel": 3
        },
        {
          "skill": "Data Visualization & Dashboards",
          "importance": "medium",
          "currentLevel": 0,
          "targetLevel": 3
        }
      ],
      milestones: [
        {
          yearLabel: "Year 1 (Data Querying & Python)",
          goals: [
            "Master complex SQL joins, aggregations, and window functions",
            "Write robust Python scripts for cleaning messy CSV and JSON datasets"
          ],
          skillsToLearn: ["SQL", "PostgreSQL", "Pandas", "Matplotlib"]
        },
        {
          yearLabel: "Year 2 (Data Warehousing & Modeling)",
          goals: [
            "Design normalized and dimensional star schemas",
            "Automate data transformations using modern tooling"
          ],
          skillsToLearn: ["Dimensional Modeling", "DuckDB", "dbt", "Data Formats"]
        },
        {
          yearLabel: "Year 3 (Pipelines & Orchestration)",
          goals: [
            "Build automated data pipelines scheduled with workflow engines",
            "Complete a data engineering or analytics internship"
          ],
          skillsToLearn: ["Airflow/Prefect", "Docker", "Cloud Storage", "PySpark"]
        },
        {
          yearLabel: "Year 4 (Enterprise Systems)",
          goals: [
            "Build end-to-end data pipelines with automated data quality alerting",
            "Interview for junior data engineer and analytics engineer positions"
          ],
          skillsToLearn: ["Data Governance", "Streaming Pipelines", "CI/CD for Data"]
        }
      ],
      projects: [
        {
          name: "Open Data Ingestion & SQL Analytics",
          description: "Clean an open government dataset using Python and run analytical window queries inside SQLite with automated report generation.",
          skillsPracticed: ["Python", "SQL", "SQLite"],
          difficulty: "beginner",
          weeks: 3
        },
        {
          name: "Automated Sales Pipeline with dbt & DuckDB",
          description: "Build an automated transformation pipeline that aggregates multi-source transactions with schema validation tests.",
          skillsPracticed: ["SQL", "dbt", "DuckDB", "Data Modeling"],
          difficulty: "intermediate",
          weeks: 5
        },
        {
          name: "Cloud Stream Ingestion & Analytics Warehouse",
          description: "Construct a streaming data collector that processes simulated events, validates data quality, and outputs structured Parquet tables.",
          skillsPracticed: ["Python", "Docker", "Parquet", "Cloud Storage"],
          difficulty: "advanced",
          weeks: 8
        }
      ],
      first30Days: [
        {
          week: 1,
          tasks: [
            "Install PostgreSQL or SQLite and set up a graphical database browser",
            "Write DDL scripts creating tables with foreign key constraints",
            "Complete 20 practice SQL exercises focusing on multi-table joins and group by"
          ]
        },
        {
          week: 2,
          tasks: [
            "Practice SQL window functions including RANK, DENSE_RANK, and LAG",
            "Write a Python script that connects to database and executes parameterized queries",
            "Load a sample 10,000-row CSV file into database using Python"
          ]
        },
        {
          week: 3,
          tasks: [
            "Learn Pandas data frame transformations, filtering, and missing value handling",
            "Perform exploratory data analysis on a public dataset and generate summary statistics",
            "Output analytical charts summarizing findings using Matplotlib or Seaborn"
          ]
        },
        {
          week: 4,
          tasks: [
            "Construct an end-to-end Python script that extracts data from an API and loads into SQL",
            "Add automated assertion checks for null values and duplicate primary keys",
            "Publish project code with documentation explaining schema design decisions"
          ]
        }
      ]
    }
  ]
};

// Validate fallback at module load to guarantee schema compliance
SimulationResultSchema.parse(FALLBACK_SIMULATION_RESULT);
