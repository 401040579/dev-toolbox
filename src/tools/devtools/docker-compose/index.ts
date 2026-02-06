import type { ToolDefinition } from '@/tools/types';

export interface DockerService {
  name: string;
  image: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  depends_on?: string[];
  restart?: string;
}

export const TEMPLATES: { name: string; description: string; yaml: string }[] = [
  {
    name: 'Nginx',
    description: 'Basic Nginx web server',
    yaml: `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    restart: unless-stopped`,
  },
  {
    name: 'Node.js + MongoDB',
    description: 'Node.js app with MongoDB database',
    yaml: `version: '3.8'
services:
  app:
    image: node:20-alpine
    ports:
      - "3000:3000"
    environment:
      - MONGO_URL=mongodb://mongo:27017/mydb
    depends_on:
      - mongo
    volumes:
      - ./app:/app
    working_dir: /app
    command: npm start
    restart: unless-stopped
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
volumes:
  mongo_data:`,
  },
  {
    name: 'PostgreSQL + pgAdmin',
    description: 'PostgreSQL database with pgAdmin web UI',
    yaml: `version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: mydb
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: unless-stopped
  pgadmin:
    image: dpage/pgadmin4
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - postgres
    restart: unless-stopped
volumes:
  pg_data:`,
  },
  {
    name: 'Redis',
    description: 'Redis cache server',
    yaml: `version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
volumes:
  redis_data:`,
  },
  {
    name: 'MySQL + Adminer',
    description: 'MySQL database with Adminer web UI',
    yaml: `version: '3.8'
services:
  mysql:
    image: mysql:8
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: mydb
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - mysql
    restart: unless-stopped
volumes:
  mysql_data:`,
  },
];

const tool: ToolDefinition = {
  id: 'docker-compose',
  name: 'Docker Compose Templates',
  description: 'Common Docker Compose templates and snippets',
  category: 'devtools',
  keywords: ['docker', 'compose', 'container', 'yaml', 'template', 'devops'],
  icon: 'Container',
  component: () => import('./DockerCompose'),
};

export default tool;
