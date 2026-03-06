import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SchoolarTask API',
      version: '1.0.0',
      description: 'API para la gestión escolar - estudiantes, profesores, padres, evaluaciones, calificaciones y más.',
    },
    servers: [
      {
        url: '/api',
        description: 'API principal',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Token JWT almacenado en cookie HTTP-only',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@email.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            fecha_nacimiento: { type: 'string', format: 'date', example: '2000-01-15' },
            rolNombre: { type: 'string', enum: ['student', 'parent', 'teacher', 'admin'], example: 'student' },
            genero: { type: 'string', enum: ['Masculino', 'Femenino'], example: 'Masculino' },
            domicilio: { type: 'string', example: 'Calle Principal 123' },
            nacionalidad: { type: 'string', example: 'Venezolana' },
          },
        },
        Student: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            email_padre: { type: 'string', format: 'email' },
            grado: { type: 'string', example: '5to' },
            seccion: { type: 'string', example: 'A' },
            alergias: { type: 'string', example: 'Ninguna' },
            condiciones_medicas: { type: 'string', example: 'Ninguna' },
            contacto_emergencia: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                telefono: { type: 'string' },
              },
            },
          },
        },
        Evaluation: {
          type: 'object',
          properties: {
            nombre: { type: 'string', example: 'Examen Parcial 1' },
            materia: { type: 'string', example: 'Matemáticas' },
            descripcion: { type: 'string' },
            fecha: { type: 'string', format: 'date' },
            peso: { type: 'number', example: 25 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number', example: 1 },
            itemsPerPage: { type: 'number', example: 20 },
            totalItems: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 3 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
