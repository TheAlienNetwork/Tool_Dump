# Neural Drill Memory Dump Visualizer - Replit Project Guide

## Overview

This is a full-stack web application designed to analyze and visualize binary memory dumps from Neural Drill tools for health monitoring and diagnostic purposes. The application processes .bin files containing sensor data, performs automated analysis to detect issues, and provides interactive visualizations and reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 22, 2025)

✓ **Migration Completed**: Successfully migrated from Replit Agent to standard Replit environment
✓ **Database Setup**: PostgreSQL database configured and schema deployed with proper relations
✓ **Binary Parser Enhancement**: Fixed device information extraction for proper MP/MDG serial numbers and firmware versions  
✓ **Device Report Format**: Implemented correct format displaying "MP S/N 3388", "MP Firmware Version 10.1.3", etc.
✓ **Type Safety Improvements**: Fixed nullable value support in ParsedData interface for proper data handling
✓ **Temperature Display**: Added proper Celsius/Fahrenheit conversion and display in device reports
✓ **PDF Report Generator**: Enhanced with proper device information formatting and comprehensive analytics
✓ **Performance Optimization**: Maintained batch processing (1000 records) for large datasets with memory management

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom IBM-inspired dark theme
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **File Processing**: Multer for handling binary file uploads (up to 50MB)
- **API Pattern**: RESTful API with structured error handling
- **Development Server**: Custom Vite integration for hot reloading

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless with connection pooling)
- **Schema**: Four main tables with relations:
  - `memory_dumps`: File metadata and processing status
  - `sensor_data`: Parsed sensor readings with 30+ fields
  - `analysis_results`: AI-generated health analysis and issue detection
  - `device_reports`: Extracted device information (MP/MDG S/N, firmware, temperatures, operational metrics)
- **Storage Strategy**: DatabaseStorage using PostgreSQL for persistence and scalability

### File Processing Pipeline
- **Binary Parser**: Handles MDG and MP file types with sensor data extraction
- **Analysis Engine**: Automated health monitoring with issue detection:
  - Temperature anomalies (>130°F critical, <100°F warning)
  - Battery voltage monitoring
  - Shock/vibration analysis
  - Motor performance metrics
  - Flow status monitoring
- **Report Generator**: Creates downloadable health reports in text format

### Data Visualization
- **Charts**: Recharts library for interactive time-series plots
- **Real-time Updates**: Live data streaming with status indicators
- **Export Features**: CSV data export and PDF report generation
- **Responsive Design**: Mobile-friendly visualizations with touch support

## Data Flow

1. **File Upload**: Users drag-and-drop .bin files through the web interface
2. **Processing**: Server validates files, extracts binary data, and parses sensor readings
3. **Analysis**: Automated health analysis engine processes sensor data and identifies issues
4. **Storage**: Parsed data and analysis results are stored in PostgreSQL
5. **Visualization**: Frontend queries processed data and renders interactive charts
6. **Reporting**: Users can export data as CSV or generate health reports

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **recharts**: Data visualization library
- **multer**: File upload handling
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives (dialogs, dropdowns, etc.)
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **ESBuild**: Production bundling
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Development Environment
- **Hot Reloading**: Vite dev server with Express middleware integration
- **Error Handling**: Runtime error overlays and comprehensive logging
- **File Storage**: Local uploads directory with automatic cleanup

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates
- **Static Assets**: Express serves built frontend from production bundle

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection (development/production)
- **File Limits**: 50MB upload limit with .bin file validation

### Key Architectural Decisions

**Problem**: Need to handle large binary files efficiently
**Solution**: Streaming file uploads with Multer and binary parsing
**Rationale**: Prevents memory issues and enables real-time progress tracking

**Problem**: Complex sensor data visualization requirements
**Solution**: Recharts with custom chart components and responsive design
**Rationale**: Provides interactive, accessible charts that work across devices

**Problem**: Real-time health monitoring and issue detection
**Solution**: Automated analysis engine with configurable thresholds
**Rationale**: Enables proactive maintenance and reduces manual inspection time

**Problem**: Flexible storage for development vs production
**Solution**: Storage abstraction layer with in-memory and PostgreSQL implementations
**Rationale**: Simplifies development while supporting production scalability