import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BSF-Nutrifeed API',
      version: '1.0.0',
      description: `
        A scalable, data-driven REST API for sustainable Black Soldier Fly (BSF)
        poultry feed production. Built by Ibiola Abiola.
        Aligned with UN SDG 3 — Good Health and Well-being.
      `,
      contact: {
        name: 'IBILOLA ABIOLA',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
      {
        url: 'https://YOUR-CODESPACE-NAME-5000.app.github.dev',
        description: 'GitHub Codespaces Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ── USER ──────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', example: '69c63bfc1e8268050f303d6a' },
            name:      { type: 'string', example: 'John Farmer' },
            email:     { type: 'string', example: 'john@bsfnutrifeed.com' },
            role:      { type: 'string', enum: ['farmer', 'admin'] },
            farmName:  { type: 'string', example: 'Green BSF Farm' },
            location:  { type: 'string', example: 'Abuja, Nigeria' },
            isActive:  { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── AUTH ──────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:      { type: 'string', example: 'John Farmer' },
            email:     { type: 'string', example: 'john@bsfnutrifeed.com' },
            password:  { type: 'string', example: 'password123' },
            role:      { type: 'string', enum: ['farmer', 'admin'], default: 'farmer' },
            farmName:  { type: 'string', example: 'Green BSF Farm' },
            location:  { type: 'string', example: 'Abuja, Nigeria' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', example: 'john@bsfnutrifeed.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success:      { type: 'boolean', example: true },
            message:      { type: 'string',  example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user:         { $ref: '#/components/schemas/User' },
                accessToken:  { type: 'string', example: 'eyJhbGci...' },
                refreshToken: { type: 'string', example: 'eyJhbGci...' },
              },
            },
          },
        },

        // ── FEED RECORD ───────────────────────────
        FeedRecord: {
          type: 'object',
          properties: {
            _id:      { type: 'string', example: '69c63fd89db4b3b9c70a6382' },
            farmer:   { type: 'string', example: '69c63bfc1e8268050f303d6a' },
            batchId:  { type: 'string', example: 'BATCH-001' },
            inputs: {
              type: 'object',
              properties: {
                organicWaste: { type: 'number', example: 50 },
                waterUsed:    { type: 'number', example: 20 },
                additives:    { type: 'string', example: 'Calcium carbonate' },
              },
            },
            outputs: {
              type: 'object',
              properties: {
                feedProduced:     { type: 'number', example: 25 },
                larvaeHarvested:  { type: 'number', example: 10 },
                compostGenerated: { type: 'number', example: 8 },
              },
            },
            status:     { type: 'string', enum: ['ongoing', 'completed', 'failed'] },
            startDate:  { type: 'string', format: 'date-time' },
            endDate:    { type: 'string', format: 'date-time' },
            efficiency: { type: 'string', example: '0.50' },
            notes:      { type: 'string', example: 'First BSF batch test' },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        FeedRecordInput: {
          type: 'object',
          required: ['batchId', 'inputs', 'startDate'],
          properties: {
            batchId: { type: 'string', example: 'BATCH-001' },
            inputs: {
              type: 'object',
              required: ['organicWaste'],
              properties: {
                organicWaste: { type: 'number', example: 50 },
                waterUsed:    { type: 'number', example: 20 },
                additives:    { type: 'string', example: 'Calcium carbonate' },
              },
            },
            outputs: {
              type: 'object',
              properties: {
                feedProduced:     { type: 'number', example: 0 },
                larvaeHarvested:  { type: 'number', example: 0 },
                compostGenerated: { type: 'number', example: 0 },
              },
            },
            startDate: { type: 'string', example: '2026-03-27' },
            notes:     { type: 'string', example: 'First BSF batch test' },
          },
        },

        // ── MONITORING DATA ───────────────────────
        MonitoringData: {
          type: 'object',
          properties: {
            _id:        { type: 'string', example: '69c64f2947bf06e0e60933eb' },
            feedRecord: { type: 'string', example: '69c63fd89db4b3b9c70a6382' },
            farmer:     { type: 'string', example: '69c63bfc1e8268050f303d6a' },
            larvaeGrowth: {
              type: 'object',
              properties: {
                currentWeight: { type: 'number', example: 150 },
                growthStage:   { type: 'string', enum: ['egg', 'young_larvae', 'mature_larvae', 'prepupae'] },
                mortality:     { type: 'number', example: 3 },
              },
            },
            environment: {
              type: 'object',
              properties: {
                temperature: { type: 'number', example: 28 },
                humidity:    { type: 'number', example: 70 },
                pH:          { type: 'number', example: 6.5 },
              },
            },
            dailyInput:       { type: 'number', example: 500 },
            dailyOutput:      { type: 'number', example: 420 },
            dailyEfficiency:  { type: 'string', example: '0.84' },
            mortalityStatus:  { type: 'string', example: 'healthy' },
            logDate:          { type: 'string', format: 'date-time' },
            remarks:          { type: 'string', example: 'Larvae growing well' },
          },
        },
        MonitoringInput: {
          type: 'object',
          required: ['feedRecord', 'larvaeGrowth'],
          properties: {
            feedRecord: { type: 'string', example: '69c63fd89db4b3b9c70a6382' },
            larvaeGrowth: {
              type: 'object',
              required: ['currentWeight', 'growthStage'],
              properties: {
                currentWeight: { type: 'number', example: 150 },
                growthStage:   { type: 'string', enum: ['egg', 'young_larvae', 'mature_larvae', 'prepupae'] },
                mortality:     { type: 'number', example: 3 },
              },
            },
            environment: {
              type: 'object',
              properties: {
                temperature: { type: 'number', example: 28 },
                humidity:    { type: 'number', example: 70 },
                pH:          { type: 'number', example: 6.5 },
              },
            },
            dailyInput:  { type: 'number', example: 500 },
            dailyOutput: { type: 'number', example: 420 },
            remarks:     { type: 'string', example: 'Larvae growing well' },
          },
        },

        // ── COMMON ────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'Operation successful' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Something went wrong' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;