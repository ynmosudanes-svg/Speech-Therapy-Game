const swaggerJsdoc = require('swagger-jsdoc');
const env = require('../config/env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Speech Therapy Clinic API',
      version: '1.0.0',
      description:
        'Full API documentation for the Speech Therapy Games platform.\n\n' +
        '## Authentication\n' +
        'Most endpoints require a Bearer token. Login first, then use the token in the Authorization header.\n\n' +
        '## Roles\n' +
        '- **SUPER_ADMIN**: Full access to all resources\n' +
        '- **THERAPIST**: Manage own students, games, and sessions\n' +
        '- **STUDENT**: Play games and view own sessions',
    },
    servers: [
      {
        url:
          env.nodeEnv === 'production'
            ? env.publicApiUrl || 'https://game.sudanesetherapy.com'
            : `http://localhost:${env.port}`,
        description: env.nodeEnv === 'production' ? 'Production server' : 'Local development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check' },
      { name: 'Auth', description: 'Authentication & login' },
      { name: 'Games', description: 'Game CRUD operations' },
      { name: 'Students', description: 'Student management' },
      { name: 'Therapists', description: 'Therapist management (SUPER_ADMIN only)' },
      { name: 'Sessions', description: 'Game session tracking' },
      { name: 'Reports', description: 'Student performance reports' },
      { name: 'Images', description: 'Image search & library' },
      { name: 'Uploads', description: 'File uploads' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from the login endpoint.',
        },
      },
      schemas: {
        // ── Error ──
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong.' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'A valid email is required.' },
                },
              },
            },
          },
        },

        // ── Auth ──
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@clinic.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful.' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        StudentLoginRequest: {
          type: 'object',
          required: ['accessCode'],
          properties: {
            accessCode: { type: 'string', minLength: 4, example: 'ABC123' },
          },
        },
        StudentLoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Student login successful.' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' },
            student: { $ref: '#/components/schemas/Student' },
          },
        },
        PatientLoginRequest: {
          type: 'object',
          required: ['accessCode'],
          properties: {
            accessCode: { type: 'string', minLength: 6, maxLength: 8, example: 'AHMED123' },
          },
        },
        PatientLoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' },
            patient: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clx123abc' },
                name: { type: 'string', example: 'Ahmed Mohamed' },
              },
            },
            student: { $ref: '#/components/schemas/Student' },
          },
        },

        // ── User ──
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx1a2b3c' },
            name: { type: 'string', example: 'Dr. Sara' },
            email: { type: 'string', example: 'sara@clinic.com' },
            role: { type: 'string', enum: ['SUPER_ADMIN', 'THERAPIST'], example: 'THERAPIST' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Therapist ──
        CreateTherapistRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Dr. Ahmed' },
            email: { type: 'string', format: 'email', example: 'ahmed@clinic.com' },
            password: { type: 'string', minLength: 6, example: 'securePass123' },
            role: { type: 'string', enum: ['THERAPIST', 'SUPER_ADMIN'], example: 'THERAPIST' },
            isActive: { type: 'boolean', example: true },
          },
        },
        UpdateTherapistRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Dr. Ahmed Updated' },
            email: { type: 'string', format: 'email', example: 'ahmed.new@clinic.com' },
            password: { type: 'string', minLength: 6, example: 'newPass123' },
            role: { type: 'string', enum: ['THERAPIST', 'SUPER_ADMIN'] },
            isActive: { type: 'boolean' },
          },
        },

        // ── Student ──
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clx4d5e6f' },
            name: { type: 'string', example: 'Ali Mohamed' },
            age: { type: 'integer', example: 7 },
            diagnosis: { type: 'string', example: 'Speech delay', nullable: true },
            accessCode: { type: 'string', example: 'ALI7XK' },
            currentLevel: { type: 'integer', example: 1 },
            therapistId: { type: 'string', example: 'clx1a2b3c' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateStudentRequest: {
          type: 'object',
          required: ['name', 'age'],
          properties: {
            name: { type: 'string', example: 'Ali Mohamed' },
            age: { type: 'integer', minimum: 1, maximum: 25, example: 7 },
            diagnosis: { type: 'string', example: 'Speech delay' },
            currentLevel: { type: 'integer', minimum: 1, example: 1 },
            therapistId: { type: 'string', example: 'clx1a2b3c' },
            assignedGameIds: {
              type: 'array',
              items: { type: 'string' },
              example: ['clxgame1', 'clxgame2'],
            },
          },
        },
        UpdateStudentRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Ali Mohamed Updated' },
            age: { type: 'integer', minimum: 1, maximum: 25, example: 8 },
            diagnosis: { type: 'string' },
            currentLevel: { type: 'integer', minimum: 1 },
            therapistId: { type: 'string' },
            assignedGameIds: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },

        // ── Game ──
        Game: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxgame123' },
            gameCode: { type: 'string', example: 'M1' },
            name: { type: 'string', example: 'Match the Animal' },
            title: { type: 'string', nullable: true },
            titleAr: { type: 'string', example: 'طابق الحيوان', nullable: true },
            type: { type: 'string', example: 'matching.similar' },
            level: { type: 'integer', example: 1 },
            config: { type: 'object', nullable: true },
            isActive: { type: 'boolean', example: true },
            questionText: { type: 'string', nullable: true },
            questionTextAr: { type: 'string', nullable: true },
            questionAudio: { type: 'string', nullable: true },
            instructionText: { type: 'string', nullable: true },
            instructionTextAr: { type: 'string', nullable: true },
            instructionAudio: { type: 'string', nullable: true },
            targetImage: { type: 'string', nullable: true },
            options: { type: 'object', nullable: true },
            items: { type: 'object', nullable: true },
            successSound: { type: 'string', nullable: true },
            failSound: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateGameRequest: {
          type: 'object',
          required: ['gameCode'],
          properties: {
            gameCode: { type: 'string', example: 'M1' },
            name: { type: 'string', example: 'Match the Animal' },
            nameAr: { type: 'string', example: 'طابق الحيوان' },
            title: { type: 'string', example: 'Match the Animal' },
            isActive: { type: 'boolean', example: true },
            config: {
              type: 'object',
              description: 'Full game configuration with levels and activities',
              example: {
                gameType: 'matching.similar',
                titleAr: 'طابق الحيوان',
                successSound: 'bravo',
                failSound: 'try-again',
                levels: [
                  {
                    level: 1,
                    activities: [
                      {
                        title: 'Activity 1',
                        difficulty: 'easy',
                        questionText: 'Find the matching image',
                        targetImage: 'https://example.com/cat.png',
                        options: [
                          { image: 'https://example.com/cat.png', isCorrect: true },
                          { image: 'https://example.com/dog.png', isCorrect: false },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
        UpdateGameRequest: {
          type: 'object',
          required: ['gameCode'],
          properties: {
            gameCode: { type: 'string', example: 'M1' },
            name: { type: 'string', example: 'Match the Animal Updated' },
            nameAr: { type: 'string' },
            title: { type: 'string' },
            isActive: { type: 'boolean' },
            config: { type: 'object' },
          },
        },

        // ── Session ──
        Session: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxsess123' },
            studentId: { type: 'string' },
            therapistId: { type: 'string' },
            gameId: { type: 'string' },
            score: { type: 'number', example: 85.5 },
            attempts: { type: 'integer', example: 3 },
            duration: { type: 'integer', example: 120, description: 'Duration in seconds' },
            sessionType: { type: 'string', enum: ['CLINIC', 'HOME'], example: 'CLINIC' },
            promptLevel: { type: 'string', enum: ['FULL', 'PARTIAL', 'INDEPENDENT'], example: 'PARTIAL' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateSessionRequest: {
          type: 'object',
          required: ['gameId', 'score', 'attempts', 'duration', 'sessionType', 'promptLevel'],
          properties: {
            studentId: { type: 'string', example: 'clx4d5e6f' },
            gameId: { type: 'string', example: 'clxgame123' },
            score: { type: 'number', minimum: 0, example: 85.5 },
            attempts: { type: 'integer', minimum: 1, example: 3 },
            duration: { type: 'integer', minimum: 0, example: 120 },
            sessionType: { type: 'string', enum: ['CLINIC', 'HOME'], example: 'CLINIC' },
            promptLevel: { type: 'string', enum: ['FULL', 'PARTIAL', 'INDEPENDENT'], example: 'PARTIAL' },
          },
        },

        // ── Image Library ──
        ImageLibraryItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clximg123' },
            url: { type: 'string', example: 'https://images.pexels.com/photos/123/cat.jpeg' },
            thumbnail: { type: 'string', example: 'https://images.pexels.com/photos/123/cat.jpeg?w=200' },
            category: { type: 'string', example: 'animals', nullable: true },
            source: { type: 'string', example: 'pexels', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SaveImageRequest: {
          type: 'object',
          required: ['url', 'thumbnail'],
          properties: {
            url: { type: 'string', example: 'https://images.pexels.com/photos/123/cat.jpeg' },
            thumbnail: { type: 'string', example: 'https://images.pexels.com/photos/123/cat.jpeg?w=200' },
            category: { type: 'string', example: 'animals' },
            source: { type: 'string', example: 'pexels' },
          },
        },

        // ── Upload ──
        UploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            url: { type: 'string', example: 'https://game.sudanesetherapy.com/uploads/1717200000.png' },
            filename: { type: 'string', example: '1717200000.png' },
          },
        },
        UploadedFile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1717200000.png' },
            filename: { type: 'string', example: '1717200000.png' },
            url: { type: 'string', example: 'https://game.sudanesetherapy.com/uploads/1717200000.png' },
            thumbnail: { type: 'string', example: 'https://game.sudanesetherapy.com/uploads/1717200000.png' },
            source: { type: 'string', example: 'upload' },
            createdAt: { type: 'number', example: 1717200000000 },
          },
        },
      },
    },

    // ════════════════════════════════════════════════
    //                    PATHS
    // ════════════════════════════════════════════════
    paths: {
      // ── Health ──
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns the API status. No authentication required.',
          responses: {
            200: {
              description: 'API is running',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Speech Therapy Clinic API is running.' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Auth: Therapist Login ──
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Therapist / Admin login',
          description: 'Login with email and password. Returns a JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
            },
            401: { description: 'Invalid email or password' },
            422: {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
            },
          },
        },
      },

      // ── Auth: Student Login ──
      '/api/student/login': {
        post: {
          tags: ['Auth'],
          summary: 'Student login with access code',
          description: 'Login using the student access code provided by the therapist.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StudentLoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Student login successful',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/StudentLoginResponse' } } },
            },
            401: { description: 'Invalid access code' },
            422: { description: 'Validation error' },
          },
        },
      },

      // ── Auth: Patient Login ──
      '/api/patient/login': {
        post: {
          tags: ['Auth'],
          summary: 'Patient login using access code only',
          description: 'Simplified login for patients. Returns token and basic patient info.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PatientLoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Patient logged in successfully',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PatientLoginResponse' } } },
            },
            401: { description: 'Invalid access code' },
            422: { description: 'Validation error' },
          },
        },
      },

      // ── Games ──
      '/api/games': {
        get: {
          tags: ['Games'],
          summary: 'List all games',
          description: 'Returns all games. No authentication required.',
          responses: {
            200: {
              description: 'Array of games',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                },
              },
            },
          },
        },
        post: {
          tags: ['Games'],
          summary: 'Create a new game',
          description: 'Create a new game template. Requires SUPER_ADMIN or THERAPIST role.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateGameRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Game created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden – insufficient role' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/games/{id}': {
        get: {
          tags: ['Games'],
          summary: 'Get a single game',
          description: 'Returns a game by its ID. No authentication required.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Game ID',
            },
          ],
          responses: {
            200: {
              description: 'Game details',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } },
            },
            404: { description: 'Game not found' },
          },
        },
        put: {
          tags: ['Games'],
          summary: 'Update a game',
          description: 'Update an existing game. Requires SUPER_ADMIN or THERAPIST role.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Game ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateGameRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Game updated',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Game' } } },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Game not found' },
            422: { description: 'Validation error' },
          },
        },
        delete: {
          tags: ['Games'],
          summary: 'Delete a game',
          description: 'Delete a game by ID. Requires SUPER_ADMIN or THERAPIST role.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Game ID',
            },
          ],
          responses: {
            200: {
              description: 'Game deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Game deleted successfully.' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Game not found' },
          },
        },
      },

      // ── Students ──
      '/api/students': {
        get: {
          tags: ['Students'],
          summary: 'List all students',
          description: 'Returns students belonging to the logged-in therapist (or all for SUPER_ADMIN).',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of students',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 5 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Students'],
          summary: 'Create a student',
          description: 'Create a new student and optionally assign games.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateStudentRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Student created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Student created successfully.' },
                      data: { $ref: '#/components/schemas/Student' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/students/{id}': {
        put: {
          tags: ['Students'],
          summary: 'Update a student',
          description: 'Update student information and assigned games.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateStudentRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Student updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Student updated successfully.' },
                      data: { $ref: '#/components/schemas/Student' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Student not found' },
            422: { description: 'Validation error' },
          },
        },
        delete: {
          tags: ['Students'],
          summary: 'Delete a student',
          description: 'Delete a student by ID.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          ],
          responses: {
            200: {
              description: 'Student deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Student deleted successfully.' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Student not found' },
          },
        },
      },
      '/api/students/{id}/access-code': {
        patch: {
          tags: ['Students'],
          summary: 'Regenerate access code',
          description: 'Generate a new access code for a student.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          ],
          responses: {
            200: {
              description: 'Access code regenerated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Access code regenerated successfully.' },
                      data: {
                        type: 'object',
                        properties: {
                          accessCode: { type: 'string', example: 'XYZ789' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Student not found' },
          },
        },
      },

      // ── Therapists ──
      '/api/therapists': {
        get: {
          tags: ['Therapists'],
          summary: 'List all therapists',
          description: 'Returns all therapists. Requires SUPER_ADMIN role.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of therapists',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 3 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden – SUPER_ADMIN only' },
          },
        },
        post: {
          tags: ['Therapists'],
          summary: 'Create a therapist',
          description: 'Create a new therapist account. Requires SUPER_ADMIN role.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateTherapistRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Therapist created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Therapist created successfully.' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/therapists/{id}': {
        put: {
          tags: ['Therapists'],
          summary: 'Update a therapist',
          description: 'Update therapist info. Requires SUPER_ADMIN role.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Therapist (User) ID' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateTherapistRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Therapist updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Therapist updated successfully.' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Therapist not found' },
          },
        },
      },
      '/api/therapists/{id}/deactivate': {
        patch: {
          tags: ['Therapists'],
          summary: 'Deactivate a therapist',
          description: 'Set therapist isActive to false. Requires SUPER_ADMIN role.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Therapist (User) ID' },
          ],
          responses: {
            200: {
              description: 'Therapist deactivated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Therapist deactivated successfully.' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Therapist not found' },
          },
        },
      },

      // ── Sessions ──
      '/api/sessions': {
        post: {
          tags: ['Sessions'],
          summary: 'Create a game session',
          description: 'Record a new game session result. Requires authentication.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateSessionRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Session created successfully.' },
                      data: { $ref: '#/components/schemas/Session' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            422: { description: 'Validation error' },
          },
        },
        get: {
          tags: ['Sessions'],
          summary: 'List all sessions',
          description: 'Returns sessions for the logged-in user.',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of sessions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 10 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/sessions/student/{studentId}': {
        get: {
          tags: ['Sessions'],
          summary: 'Get sessions by student',
          description: 'Returns all sessions for a specific student.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          ],
          responses: {
            200: {
              description: 'Student sessions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 5 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
          },
        },
      },

      // ── Reports ──
      '/api/reports/{studentId}': {
        get: {
          tags: ['Reports'],
          summary: 'Get student performance report',
          description: 'Returns aggregated performance data for a specific student.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
          ],
          responses: {
            200: {
              description: 'Student report',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'object', description: 'Aggregated performance data' },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Student not found' },
          },
        },
      },

      // ── Images ──
      '/api/images/search': {
        get: {
          tags: ['Images'],
          summary: 'Search images from external provider',
          description: 'Search for images from Pexels or Pixabay. No authentication required.',
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Search keyword',
              example: 'cat',
            },
            {
              name: 'provider',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['pexels', 'pixabay'], default: 'pexels' },
              description: 'Image search provider',
            },
          ],
          responses: {
            200: {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            url: { type: 'string' },
                            thumbnail: { type: 'string' },
                            source: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            422: { description: 'Validation error – query is required' },
          },
        },
      },
      '/api/images/library': {
        get: {
          tags: ['Images'],
          summary: 'Get saved image library',
          description: 'Returns all images saved to the local library.',
          responses: {
            200: {
              description: 'Library images',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 20 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/ImageLibraryItem' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Images'],
          summary: 'Save image to library',
          description: 'Save an image URL to the local library for reuse.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SaveImageRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Image saved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/ImageLibraryItem' },
                    },
                  },
                },
              },
            },
            422: { description: 'Validation error' },
          },
        },
      },
      '/api/images/library/{id}': {
        delete: {
          tags: ['Images'],
          summary: 'Delete image from library',
          description: 'Remove an image from the saved library.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Image ID' },
          ],
          responses: {
            200: {
              description: 'Image deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/ImageLibraryItem' },
                    },
                  },
                },
              },
            },
            404: { description: 'Image not found' },
          },
        },
      },

      // ── Uploads ──
      '/api/upload': {
        post: {
          tags: ['Uploads'],
          summary: 'Upload a file',
          description: 'Upload an image or audio file (max 10MB). Requires SUPER_ADMIN or THERAPIST role.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'The file to upload (image or audio, max 10MB)',
                    },
                  },
                  required: ['file'],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'File uploaded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/UploadResponse' } } },
            },
            400: { description: 'No file uploaded' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/api/uploads': {
        get: {
          tags: ['Uploads'],
          summary: 'List uploaded files',
          description: 'Returns all uploaded image files. Requires SUPER_ADMIN or THERAPIST role.',
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: 'query',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Filter files by filename',
            },
          ],
          responses: {
            200: {
              description: 'List of uploaded files',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 10 },
                      data: { type: 'array', items: { $ref: '#/components/schemas/UploadedFile' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
