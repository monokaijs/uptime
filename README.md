# Uptime Tracker

A simple uptime monitoring service built with Next.js, MongoDB, and shadcn/ui. This application allows you to monitor the online status of web services by periodically sending GET requests and tracking their response times.

## Features

- Monitor multiple web services
- Track uptime status and response times
- Simple admin dashboard to manage monitored services
- Secure admin authentication
- Responsive UI built with shadcn/ui components

## Prerequisites

### Option 1: Local Development
- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Option 2: Docker
- Docker and Docker Compose

## Getting Started

### Option 1: Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/uptime-tracker.git
cd uptime-tracker
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=mongodb://localhost:27017/uptime-tracker
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
ADMIN_PASSWORD=your-admin-password
API_KEY=your-api-key-for-cron-jobs
```

#### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the dashboard.

### Option 2: Docker Deployment

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/uptime-tracker.git
cd uptime-tracker
```

#### 2. Configure environment variables (optional)

Create a `.env` file in the root directory to override default values:

```
NEXTAUTH_SECRET=your-secure-secret-key
ADMIN_PASSWORD=your-secure-admin-password
API_KEY=your-secure-api-key
```

#### 3. Build and start the Docker containers

```bash
docker-compose up -d
```

This will start three containers:
- The Next.js application on port 3000
- MongoDB database on port 27017
- A cron service that checks your services every 5 minutes

Open [http://localhost:3000](http://localhost:3000) with your browser to access the dashboard.

## Setting Up Scheduled Monitoring

### Option 1: External Cron Job

To automatically check your services at regular intervals, you can set up a cron job to call the API endpoint:

```
GET /api/cron/check?key=your-api-key
```

You can use a service like cron-job.org, GitHub Actions, or a server-based cron job to call this endpoint at your desired frequency (e.g., every 5 minutes).

### Option 2: Docker Cron Service

If you're using Docker, the included cron service will automatically check your services every 5 minutes. You can modify the check frequency by editing the `Dockerfile.cron` file.

## Usage

1. Access the dashboard at `/dashboard`
2. Log in using the admin password configured in your `.env.local` file
3. Add services to monitor by providing a name and URL
4. Use the "Check All Services" button to manually check the status of all services
5. View the status and response time of each service

## Technologies Used

- Next.js 15
- React 19
- MongoDB with Mongoose
- NextAuth.js for authentication
- shadcn/ui for the user interface
- Tailwind CSS for styling
- Axios for HTTP requests
- Docker and Docker Compose for containerization

## License

MIT
